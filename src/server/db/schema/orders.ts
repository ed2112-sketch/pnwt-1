import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { events, eventTicketTypes } from "./events";
import { users } from "./auth";
import { promoCodes, pricingTiers } from "./pricing";
import { orderStatusEnum } from "./enums";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  userId: uuid("user_id").references(() => users.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  subtotalAmount: integer("subtotal_amount").notNull(),
  feesAmount: integer("fees_amount").default(0).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  gratuityAmount: integer("gratuity_amount").default(0).notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(),
  totalAmount: integer("total_amount").notNull(),
  promoCodeId: uuid("promo_code_id").references(() => promoCodes.id),
  paymentMethod: text("payment_method").default("stub"),
  paymentIntentId: text("payment_intent_id"),
  isComp: boolean("is_comp").default(false).notNull(),
  giftCardId: uuid("gift_card_id"),
  giftCardAmountUsed: integer("gift_card_amount_used").default(0).notNull(),
  referralCodeId: uuid("referral_code_id"),
  notes: text("notes"),
  refundAmount: integer("refund_amount"),
  refundedAt: timestamp("refunded_at", { mode: "date" }),
  refundReason: text("refund_reason"),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  eventTicketTypeId: uuid("event_ticket_type_id")
    .notNull()
    .references(() => eventTicketTypes.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  pricingTierId: uuid("pricing_tier_id").references(() => pricingTiers.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
