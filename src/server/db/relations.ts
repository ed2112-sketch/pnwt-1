import { relations } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
  organizations,
  organizationMembers,
  venues,
  events,
  eventTicketTypes,
  pricingTiers,
  promoCodes,
  orders,
  orderItems,
  tickets,
  waitlistEntries,
  surveys,
  surveyQuestions,
  surveyResponses,
  surveyAnswers,
  settlements,
  giftCards,
  giftCardTransactions,
  referralCodes,
  referralConversions,
  emailCampaigns,
  emailSubscribers,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  memberships: many(organizationMembers),
  orders: many(orders),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  venues: many(venues),
  events: many(events),
  promoCodes: many(promoCodes),
  orders: many(orders),
  waitlistEntries: many(waitlistEntries),
  surveys: many(surveys),
  settlements: many(settlements),
  giftCards: many(giftCards),
  referralCodes: many(referralCodes),
  emailCampaigns: many(emailCampaigns),
  emailSubscribers: many(emailSubscribers),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  })
);

export const venuesRelations = relations(venues, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [venues.organizationId],
    references: [organizations.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  ticketTypes: many(eventTicketTypes),
  promoCodes: many(promoCodes),
  orders: many(orders),
  waitlistEntries: many(waitlistEntries),
  surveys: many(surveys),
}));

export const eventTicketTypesRelations = relations(
  eventTicketTypes,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventTicketTypes.eventId],
      references: [events.id],
    }),
    pricingTiers: many(pricingTiers),
    orderItems: many(orderItems),
  })
);

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  ticketType: one(eventTicketTypes, {
    fields: [pricingTiers.eventTicketTypeId],
    references: [eventTicketTypes.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one }) => ({
  organization: one(organizations, {
    fields: [promoCodes.organizationId],
    references: [organizations.id],
  }),
  event: one(events, {
    fields: [promoCodes.eventId],
    references: [events.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
  items: many(orderItems),
  tickets: many(tickets),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  ticketType: one(eventTicketTypes, {
    fields: [orderItems.eventTicketTypeId],
    references: [eventTicketTypes.id],
  }),
  pricingTier: one(pricingTiers, {
    fields: [orderItems.pricingTierId],
    references: [pricingTiers.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id],
  }),
  orderItem: one(orderItems, {
    fields: [tickets.orderItemId],
    references: [orderItems.id],
  }),
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  ticketType: one(eventTicketTypes, {
    fields: [tickets.eventTicketTypeId],
    references: [eventTicketTypes.id],
  }),
}));

export const waitlistEntriesRelations = relations(
  waitlistEntries,
  ({ one }) => ({
    event: one(events, {
      fields: [waitlistEntries.eventId],
      references: [events.id],
    }),
    ticketType: one(eventTicketTypes, {
      fields: [waitlistEntries.eventTicketTypeId],
      references: [eventTicketTypes.id],
    }),
    organization: one(organizations, {
      fields: [waitlistEntries.organizationId],
      references: [organizations.id],
    }),
  })
);

export const surveysRelations = relations(surveys, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [surveys.organizationId],
    references: [organizations.id],
  }),
  event: one(events, {
    fields: [surveys.eventId],
    references: [events.id],
  }),
  questions: many(surveyQuestions),
  responses: many(surveyResponses),
}));

export const surveyQuestionsRelations = relations(
  surveyQuestions,
  ({ one, many }) => ({
    survey: one(surveys, {
      fields: [surveyQuestions.surveyId],
      references: [surveys.id],
    }),
    answers: many(surveyAnswers),
  })
);

export const surveyResponsesRelations = relations(
  surveyResponses,
  ({ one, many }) => ({
    survey: one(surveys, {
      fields: [surveyResponses.surveyId],
      references: [surveys.id],
    }),
    answers: many(surveyAnswers),
  })
);

export const surveyAnswersRelations = relations(surveyAnswers, ({ one }) => ({
  response: one(surveyResponses, {
    fields: [surveyAnswers.responseId],
    references: [surveyResponses.id],
  }),
  question: one(surveyQuestions, {
    fields: [surveyAnswers.questionId],
    references: [surveyQuestions.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  organization: one(organizations, {
    fields: [settlements.organizationId],
    references: [organizations.id],
  }),
  event: one(events, {
    fields: [settlements.eventId],
    references: [events.id],
  }),
}));

export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [giftCards.organizationId],
    references: [organizations.id],
  }),
  transactions: many(giftCardTransactions),
}));

export const giftCardTransactionsRelations = relations(
  giftCardTransactions,
  ({ one }) => ({
    giftCard: one(giftCards, {
      fields: [giftCardTransactions.giftCardId],
      references: [giftCards.id],
    }),
    order: one(orders, {
      fields: [giftCardTransactions.orderId],
      references: [orders.id],
    }),
  })
);

export const referralCodesRelations = relations(
  referralCodes,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [referralCodes.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [referralCodes.userId],
      references: [users.id],
    }),
    conversions: many(referralConversions),
  })
);

export const referralConversionsRelations = relations(
  referralConversions,
  ({ one }) => ({
    referralCode: one(referralCodes, {
      fields: [referralConversions.referralCodeId],
      references: [referralCodes.id],
    }),
    order: one(orders, {
      fields: [referralConversions.orderId],
      references: [orders.id],
    }),
  })
);

export const emailCampaignsRelations = relations(emailCampaigns, ({ one }) => ({
  organization: one(organizations, {
    fields: [emailCampaigns.organizationId],
    references: [organizations.id],
  }),
}));

export const emailSubscribersRelations = relations(
  emailSubscribers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [emailSubscribers.organizationId],
      references: [organizations.id],
    }),
  })
);
