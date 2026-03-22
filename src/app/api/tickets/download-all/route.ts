import { renderToBuffer } from "@react-pdf/renderer";
import { Document } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { tickets } from "@/server/db/schema";
import { generateQrDataUrl } from "@/lib/qrcode";
import { TicketPage } from "@/lib/pdf/ticket-pdf";
import React from "react";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!orderId) {
    return new Response("Missing orderId parameter", { status: 400 });
  }

  const orderTickets = await db.query.tickets.findMany({
    where: eq(tickets.orderId, orderId),
    with: {
      event: {
        with: {
          venue: true,
        },
      },
      ticketType: true,
    },
  });

  const activeTickets = orderTickets.filter((t) => t.status !== "cancelled");

  if (activeTickets.length === 0) {
    return new Response("No tickets found for this order", { status: 404 });
  }

  const ticketPages = await Promise.all(
    activeTickets.map(async (ticket) => {
      const venue = ticket.event.venue;
      const venueAddress = [
        venue.address,
        venue.city,
        venue.state,
        venue.zip,
      ]
        .filter(Boolean)
        .join(", ");

      const qrCodeDataUrl = await generateQrDataUrl(ticket.qrCodeData);

      return {
        ticketNumber: ticket.ticketNumber,
        eventTitle: ticket.event.title,
        eventDate: ticket.event.startDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        venueName: venue.name,
        venueAddress,
        ticketTypeName: ticket.ticketType.name,
        attendeeName: ticket.attendeeName,
        qrCodeDataUrl,
      };
    })
  );

  const doc = React.createElement(
    Document,
    { title: "PNWTickets - Order Tickets", author: "PNWTickets" },
    ...ticketPages.map((props) =>
      React.createElement(TicketPage, { key: props.ticketNumber, ...props })
    )
  );

  const buffer = await renderToBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tickets-${orderId.slice(0, 8)}.pdf"`,
    },
  });
}
