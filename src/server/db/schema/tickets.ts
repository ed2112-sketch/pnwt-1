import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders, orderItems } from "./orders";
import { events, eventTicketTypes } from "./events";
import { ticketStatusEnum } from "./enums";

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  eventTicketTypeId: uuid("event_ticket_type_id")
    .notNull()
    .references(() => eventTicketTypes.id),
  ticketNumber: text("ticket_number").notNull().unique(),
  qrCodeData: text("qr_code_data").notNull().unique(),
  status: ticketStatusEnum("status").default("valid").notNull(),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  checkedInAt: timestamp("checked_in_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
