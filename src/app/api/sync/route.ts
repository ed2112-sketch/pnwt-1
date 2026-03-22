import { Pool } from "pg";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  events,
  eventTicketTypes,
  orders,
  orderItems,
  tickets,
  venues,
} from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

function getSourcePool() {
  const url = process.env.HI_EVENTS_DATABASE_URL;
  if (!url) throw new Error("HI_EVENTS_DATABASE_URL not configured");
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function randomChars(len: number) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

function cents(val: string | number | null): number {
  if (val == null) return 0;
  return Math.round(parseFloat(String(val)) * 100);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const orgId = session.user.orgId;

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`));
      }
      function sendStats(stats: Record<string, number>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "stats", stats })}\n\n`));
      }
      function sendDone(stats: Record<string, number>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", stats })}\n\n`));
      }

      const source = getSourcePool();
      const stats = { events: 0, ticketTypes: 0, orders: 0, orderItems: 0, tickets: 0, skipped: 0 };

      try {
        send("Connecting to Hi.Events database...");
        await source.query("SELECT 1");
        send("Connected to Hi.Events ✓");

        const [venue] = await db.select({ id: venues.id }).from(venues).where(eq(venues.organizationId, orgId)).limit(1);
        if (!venue) { send("ERROR: No venue found."); controller.close(); return; }
        const venueId = venue.id;

        // --- EVENTS ---
        send("Fetching events from Hi.Events...");
        const { rows: srcEvents } = await source.query("SELECT e.* FROM events e WHERE e.deleted_at IS NULL ORDER BY e.start_date ASC");
        send(`Found ${srcEvents.length} events in Hi.Events`);

        const existingEvents = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.organizationId, orgId));
        const existingTitles = new Set(existingEvents.map((e) => e.title));
        const eventIdMap = new Map<number, string>();

        for (const existing of existingEvents) {
          const srcMatch = srcEvents.find((s: any) => s.title === existing.title);
          if (srcMatch) eventIdMap.set(Number(srcMatch.id), existing.id);
        }

        for (const ev of srcEvents) {
          if (existingTitles.has(ev.title)) continue;
          let eventType = "other";
          const t = ev.title.toLowerCase();
          if (t.includes("comedy") || t.includes("comedian")) eventType = "comedy";
          else if (t.includes("murder mystery") || t.includes("dinner")) eventType = "dinner_theater";
          else if (t.includes("concert") || t.includes("music") || t.includes("band")) eventType = "concert";
          else if (t.includes("burlesque") || t.includes("show") || t.includes("cabaret")) eventType = "show";

          const slug = slugify(ev.title) + "-" + randomChars(4).toLowerCase();
          const description = ev.description || null;
          const shortDesc = description ? description.replace(/<[^>]*>/g, "").slice(0, 300).trim() : null;

          const [newEvent] = await db.insert(events).values({
            organizationId: orgId, venueId, title: ev.title, slug, description, shortDescription: shortDesc,
            eventType: eventType as any, status: ev.status === "LIVE" ? "published" : "draft",
            startDate: new Date(ev.start_date), endDate: new Date(ev.end_date || ev.start_date),
            isFeatured: false, settings: {},
          }).returning({ id: events.id });

          eventIdMap.set(Number(ev.id), newEvent.id);
          stats.events++;
          send(`  + Event: ${ev.title}`);
        }
        send(stats.events > 0 ? `✓ ${stats.events} new events synced` : "✓ Events up to date");

        // --- TICKET TYPES ---
        send("Syncing ticket types...");
        const { rows: srcTickets } = await source.query(`
          SELECT t.*, tp.price, tp.initial_quantity_available, tp.quantity_sold, tp.quantity_available
          FROM tickets t LEFT JOIN ticket_prices tp ON tp.ticket_id = t.id AND tp.deleted_at IS NULL
          WHERE t.deleted_at IS NULL ORDER BY t.event_id, t."order"
        `);

        const existingTT = await db.select({ id: eventTicketTypes.id, name: eventTicketTypes.name, eventId: eventTicketTypes.eventId }).from(eventTicketTypes);
        const existingTTKey = new Set(existingTT.map((t) => `${t.eventId}:${t.name}`));
        const ticketIdMap = new Map<number, string>();

        for (const existing of existingTT) {
          const srcMatch = srcTickets.find((s: any) => eventIdMap.get(Number(s.event_id)) === existing.eventId && s.title === existing.name);
          if (srcMatch) ticketIdMap.set(Number(srcMatch.id), existing.id);
        }

        for (const tk of srcTickets) {
          const eventUuid = eventIdMap.get(Number(tk.event_id));
          if (!eventUuid || existingTTKey.has(`${eventUuid}:${tk.title}`)) continue;

          const [newTT] = await db.insert(eventTicketTypes).values({
            eventId: eventUuid, name: tk.title, description: tk.description || null,
            price: cents(tk.price), quantity: tk.initial_quantity_available || tk.quantity_available || 100,
            quantitySold: Math.min(tk.quantity_sold || 0, tk.initial_quantity_available || 100),
            sortOrder: tk.order || 0, isActive: true, settings: { maxPerOrder: tk.max_per_order || 10 },
          }).returning({ id: eventTicketTypes.id });

          ticketIdMap.set(Number(tk.id), newTT.id);
          stats.ticketTypes++;
        }
        send(stats.ticketTypes > 0 ? `✓ ${stats.ticketTypes} new ticket types synced` : "✓ Ticket types up to date");

        // --- ORDERS ---
        send("Syncing orders...");
        const { rows: srcOrders } = await source.query(`
          SELECT * FROM orders WHERE status = 'COMPLETED' AND payment_status = 'PAYMENT_RECEIVED' AND deleted_at IS NULL ORDER BY created_at ASC
        `);
        send(`Found ${srcOrders.length} completed orders in Hi.Events`);

        const existingOrders = await db.select({ id: orders.id, email: orders.email, createdAt: orders.createdAt }).from(orders).where(eq(orders.organizationId, orgId));
        const existingOrderKeys = new Set(existingOrders.map((o) => `${o.email.toLowerCase()}:${new Date(o.createdAt).getTime()}`));
        const orderIdMap = new Map<number, string>();

        for (const existing of existingOrders) {
          const srcMatch = srcOrders.find((s: any) => (s.email || "").toLowerCase() === existing.email.toLowerCase() && Math.abs(new Date(s.created_at).getTime() - new Date(existing.createdAt).getTime()) < 60000);
          if (srcMatch) orderIdMap.set(Number(srcMatch.id), existing.id);
        }

        let orderBatch = 0;
        for (const ord of srcOrders) {
          const eventUuid = eventIdMap.get(Number(ord.event_id));
          if (!eventUuid) continue;
          const key = `${(ord.email || "").toLowerCase()}:${new Date(ord.created_at).getTime()}`;
          if (existingOrderKeys.has(key)) continue;

          const [newOrder] = await db.insert(orders).values({
            organizationId: orgId, eventId: eventUuid,
            email: ord.email || "unknown@example.com",
            name: `${ord.first_name || ""} ${ord.last_name || ""}`.trim() || "Unknown",
            status: ord.status === "CANCELLED" ? "cancelled" : cents(ord.total_refunded) > 0 ? "refunded" : "confirmed",
            subtotalAmount: cents(ord.total_before_additions), feesAmount: cents(ord.total_fee),
            taxAmount: cents(ord.total_tax), totalAmount: cents(ord.total_gross),
            refundAmount: cents(ord.total_refunded) > 0 ? cents(ord.total_refunded) : null,
            paymentMethod: "stripe", expiresAt: new Date(ord.reserved_until || Date.now() + 86400000),
            createdAt: new Date(ord.created_at),
          }).returning({ id: orders.id });

          orderIdMap.set(Number(ord.id), newOrder.id);
          stats.orders++;
          orderBatch++;
          if (orderBatch % 50 === 0) send(`  Syncing orders... ${stats.orders} so far`);
        }
        send(stats.orders > 0 ? `✓ ${stats.orders} new orders synced` : "✓ Orders up to date");
        sendStats(stats);

        // --- ORDER ITEMS ---
        send("Syncing order items...");
        const { rows: srcItems } = await source.query(`
          SELECT oi.* FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'COMPLETED' AND o.payment_status = 'PAYMENT_RECEIVED' AND oi.deleted_at IS NULL
        `);

        const existingItems = await db.select({ id: orderItems.id, orderId: orderItems.orderId, eventTicketTypeId: orderItems.eventTicketTypeId }).from(orderItems);
        const existingItemKeys = new Set(existingItems.map((i) => `${i.orderId}:${i.eventTicketTypeId}`));

        let itemBatch = 0;
        for (const item of srcItems) {
          const orderUuid = orderIdMap.get(Number(item.order_id));
          const ttUuid = ticketIdMap.get(Number(item.ticket_id));
          if (!orderUuid || !ttUuid) { stats.skipped++; continue; }
          if (existingItemKeys.has(`${orderUuid}:${ttUuid}`)) continue;

          await db.insert(orderItems).values({
            orderId: orderUuid, eventTicketTypeId: ttUuid,
            quantity: item.quantity || 1, unitPrice: cents(item.price), totalPrice: cents(item.total_gross),
          });
          stats.orderItems++;
          itemBatch++;
          if (itemBatch % 50 === 0) send(`  Syncing items... ${stats.orderItems} so far`);
        }
        send(stats.orderItems > 0 ? `✓ ${stats.orderItems} new order items synced` : "✓ Order items up to date");

        // --- ATTENDEES → TICKETS ---
        send("Syncing attendees as tickets...");
        const { rows: srcAttendees } = await source.query(`
          SELECT a.* FROM attendees a JOIN orders o ON o.id = a.order_id
          WHERE o.status = 'COMPLETED' AND o.payment_status = 'PAYMENT_RECEIVED' AND a.deleted_at IS NULL
        `);
        send(`Found ${srcAttendees.length} attendees to process`);

        let ticketBatch = 0;
        for (const att of srcAttendees) {
          const orderUuid = orderIdMap.get(Number(att.order_id));
          const ttUuid = ticketIdMap.get(Number(att.ticket_id));
          const eventUuid = eventIdMap.get(Number(att.event_id));
          if (!orderUuid || !ttUuid || !eventUuid) { stats.skipped++; continue; }

          const [oi] = await db.select({ id: orderItems.id }).from(orderItems)
            .where(sql`${orderItems.orderId} = ${orderUuid} AND ${orderItems.eventTicketTypeId} = ${ttUuid}`).limit(1);
          if (!oi) { stats.skipped++; continue; }

          const ticketId = crypto.randomUUID();
          const name = `${att.first_name || ""} ${att.last_name || ""}`.trim() || "Guest";

          try {
            await db.insert(tickets).values({
              id: ticketId, orderId: orderUuid, orderItemId: oi.id, eventId: eventUuid,
              eventTicketTypeId: ttUuid, ticketNumber: `PNWT-${randomChars(6)}`,
              qrCodeData: `PNWT:${ticketId}`, status: att.checked_in_at ? "used" : "valid",
              attendeeName: name, attendeeEmail: att.email || "unknown@example.com",
              checkedInAt: att.checked_in_at ? new Date(att.checked_in_at) : null,
            });
            stats.tickets++;
            ticketBatch++;
            if (ticketBatch % 100 === 0) send(`  Syncing tickets... ${stats.tickets} so far`);
          } catch {
            stats.skipped++;
          }
        }
        send(stats.tickets > 0 ? `✓ ${stats.tickets} new tickets synced` : "✓ Tickets up to date");
        send(`Skipped ${stats.skipped} records (already exist or missing references)`);

        await source.end();
        sendDone(stats);
      } catch (error: any) {
        send(`ERROR: ${error.message}`);
        await source.end().catch(() => {});
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
