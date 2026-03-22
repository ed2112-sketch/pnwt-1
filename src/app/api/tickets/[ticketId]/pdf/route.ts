import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tickets } from "@/server/db/schema";
import { generateQrDataUrl } from "@/lib/qrcode";
import { TicketPdfDocument } from "@/lib/pdf/ticket-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      event: {
        with: {
          venue: true,
        },
      },
      ticketType: true,
    },
  });

  if (!ticket || ticket.status === "cancelled") {
    return new Response("Ticket not found", { status: 404 });
  }

  const venue = ticket.event.venue;
  const venueAddress = [venue.address, venue.city, venue.state, venue.zip]
    .filter(Boolean)
    .join(", ");

  const qrCodeDataUrl = await generateQrDataUrl(ticket.qrCodeData);

  const buffer = await renderToBuffer(
    TicketPdfDocument({
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
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`,
    },
  });
}
