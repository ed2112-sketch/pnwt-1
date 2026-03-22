import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { orders } from "./orders";
import { giftCardStatusEnum } from "./enums";

export const giftCards = pgTable("gift_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  initialAmount: integer("initial_amount").notNull(),
  balance: integer("balance").notNull(),
  status: giftCardStatusEnum("status").default("active").notNull(),
  purchaserEmail: text("purchaser_email"),
  purchaserName: text("purchaser_name"),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  message: text("message"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  giftCardId: uuid("gift_card_id")
    .notNull()
    .references(() => giftCards.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  amount: integer("amount").notNull(), // positive=load, negative=redeem
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
