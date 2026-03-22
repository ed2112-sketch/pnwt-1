import { createRouter, createCallerFactory } from "./init";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { onboardingRouter } from "./routers/onboarding";
import { organizationRouter } from "./routers/organization";
import { venueRouter } from "./routers/venue";
import { eventRouter } from "./routers/event";
import { eventTicketTypeRouter } from "./routers/event-ticket-type";
import { pricingRouter } from "./routers/pricing";
import { promoRouter } from "./routers/promo";
import { checkoutRouter } from "./routers/checkout";
import { orderRouter } from "./routers/order";
import { ticketRouter } from "./routers/ticket";
import { waitlistRouter } from "./routers/waitlist";
import { analyticsRouter } from "./routers/analytics";
import { settlementRouter } from "./routers/settlement";
import { surveyRouter } from "./routers/survey";
import { giftCardRouter } from "./routers/gift-card";
import { referralRouter } from "./routers/referral";
import { emailSubscriberRouter } from "./routers/email-subscriber";
import { emailCampaignRouter } from "./routers/email-campaign";
import { discoverRouter } from "./routers/discover";

export const appRouter = createRouter({
  health: healthRouter,
  auth: authRouter,
  onboarding: onboardingRouter,
  organization: organizationRouter,
  venue: venueRouter,
  event: eventRouter,
  eventTicketType: eventTicketTypeRouter,
  pricing: pricingRouter,
  promo: promoRouter,
  checkout: checkoutRouter,
  order: orderRouter,
  ticket: ticketRouter,
  waitlist: waitlistRouter,
  analytics: analyticsRouter,
  settlement: settlementRouter,
  survey: surveyRouter,
  giftCard: giftCardRouter,
  referral: referralRouter,
  emailSubscriber: emailSubscriberRouter,
  emailCampaign: emailCampaignRouter,
  discover: discoverRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
