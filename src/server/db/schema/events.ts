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
import { venues } from "./venues";
import { eventTypeEnum, eventStatusEnum } from "./enums";

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  eventType: eventTypeEnum("event_type").default("other").notNull(),
  status: eventStatusEnum("status").default("draft").notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  doorsOpen: timestamp("doors_open", { mode: "date" }),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  settings: jsonb("settings").$type<EventSettings>().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type EventSettings = {
  ageRestriction?: string;
  dinnerIncluded?: boolean;
  dresscode?: string;
};

export const eventTicketTypes = pgTable("event_ticket_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  saleStart: timestamp("sale_start", { mode: "date" }),
  saleEnd: timestamp("sale_end", { mode: "date" }),
  isActive: boolean("is_active").default(true).notNull(),
  settings: jsonb("settings").$type<TicketTypeSettings>().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TicketTypeSettings = {
  maxPerOrder?: number;
};
