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
