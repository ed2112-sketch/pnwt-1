import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { venueTypeEnum } from "./enums";

export const venues = pgTable("venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: venueTypeEnum("type").default("other").notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  imageUrl: text("image_url"),
  capacity: integer("capacity"),
  timezone: text("timezone").default("America/Los_Angeles").notNull(),
  settings: jsonb("settings").$type<VenueSettings>().default({}),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type VenueSettings = {
  hasDinnerService?: boolean;
  autoGratuityPercent?: number;
  taxRate?: number;
  serviceChargePercent?: number;
  crossPromoEnabled?: boolean;
};
