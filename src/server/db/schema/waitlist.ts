import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { events, eventTicketTypes } from "./events";
import { organizations } from "./organizations";
import { waitlistStatusEnum } from "./enums";

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  eventTicketTypeId: uuid("event_ticket_type_id").references(
    () => eventTicketTypes.id,
    { onDelete: "set null" }
  ),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  status: waitlistStatusEnum("status").default("waiting").notNull(),
  priority: integer("priority").default(0).notNull(),
  notifiedAt: timestamp("notified_at", { mode: "date" }),
  convertedAt: timestamp("converted_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
