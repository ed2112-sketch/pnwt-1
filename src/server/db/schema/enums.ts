import { pgEnum } from "drizzle-orm/pg-core";

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "manager",
  "member",
  "promoter",
]);

export const venueTypeEnum = pgEnum("venue_type", [
  "theater",
  "restaurant",
  "bar",
  "club",
  "outdoor",
  "other",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "concert",
  "show",
  "dinner_theater",
  "comedy",
  "private",
  "other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "cancelled",
  "refunded",
]);

export const pricingTierTypeEnum = pgEnum("pricing_tier_type", [
  "time_based",
  "demand_based",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed_amount",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "valid",
  "used",
  "cancelled",
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "notified",
  "converted",
  "expired",
]);

export const surveyStatusEnum = pgEnum("survey_status", [
  "draft",
  "active",
  "closed",
]);

export const surveyQuestionTypeEnum = pgEnum("survey_question_type", [
  "rating",
  "text",
  "nps",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "pending",
  "paid",
]);

export const giftCardStatusEnum = pgEnum("gift_card_status", [
  "active",
  "depleted",
  "expired",
  "cancelled",
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "credited",
  "expired",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
]);
