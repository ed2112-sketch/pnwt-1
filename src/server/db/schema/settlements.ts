import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { events } from "./events";
import { settlementStatusEnum } from "./enums";

export const settlements = pgTable("settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id),
  periodStart: timestamp("period_start", { mode: "date" }).notNull(),
  periodEnd: timestamp("period_end", { mode: "date" }).notNull(),
  grossRevenue: integer("gross_revenue").default(0).notNull(),
  refunds: integer("refunds").default(0).notNull(),
  comps: integer("comps").default(0).notNull(),
  serviceCharges: integer("service_charges").default(0).notNull(),
  taxes: integer("taxes").default(0).notNull(),
  gratuities: integer("gratuities").default(0).notNull(),
  promoDiscounts: integer("promo_discounts").default(0).notNull(),
  netRevenue: integer("net_revenue").default(0).notNull(),
  payoutStatus: settlementStatusEnum("payout_status").default("pending").notNull(),
  payoutDate: timestamp("payout_date", { mode: "date" }),
  payoutReference: text("payout_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
