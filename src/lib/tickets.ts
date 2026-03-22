import { eq } from "drizzle-orm";
import { tickets } from "@/server/db/schema";
import type { Database } from "@/server/db";

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/I/L/1

function randomChars(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join("");
}

export async function generateTicketNumber(db: Database): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `PNWT-${randomChars(4)}`;
    const existing = await db.query.tickets.findFirst({
      where: eq(tickets.ticketNumber, number),
      columns: { id: true },
    });
    if (!existing) return number;
  }
  // Fallback with longer suffix
  return `PNWT-${randomChars(6)}`;
}

export async function generateTicketsForOrder(
  db: Database,
  orderId: string,
  orderItems: Array<{
    id: string;
    eventTicketTypeId: string;
    quantity: number;
  }>,
  attendeeName: string,
  attendeeEmail: string,
  eventId: string
) {
  const ticketsToInsert = [];

  for (const item of orderItems) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketNumber = await generateTicketNumber(db);
      const id = crypto.randomUUID();
      ticketsToInsert.push({
        id,
        orderId,
        orderItemId: item.id,
        eventId,
        eventTicketTypeId: item.eventTicketTypeId,
        ticketNumber,
        qrCodeData: `PNWT:${id}`,
        status: "valid" as const,
        attendeeName,
        attendeeEmail,
      });
    }
  }

  if (ticketsToInsert.length > 0) {
    await db.insert(tickets).values(ticketsToInsert);
  }

  return ticketsToInsert;
}
