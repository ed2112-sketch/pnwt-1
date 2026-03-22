import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { eventTicketTypes } from "./events";
import { organizations } from "./organizations";
import { events } from "./events";
import { pricingTierTypeEnum, discountTypeEnum } from "./enums";

export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventTicketTypeId: uuid("event_ticket_type_id")
    .notNull()
    .references(() => eventTicketTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: pricingTierTypeEnum("type").notNull(),
  price: integer("price").notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }),
  endsAt: timestamp("ends_at", { mode: "date" }),
  minPercentSold: integer("min_percent_sold"),
  maxPercentSold: integer("max_percent_sold"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0).notNull(),
  validFrom: timestamp("valid_from", { mode: "date" }),
  validTo: timestamp("valid_to", { mode: "date" }),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  minOrderAmount: integer("min_order_amount"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
