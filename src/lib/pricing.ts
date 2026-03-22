export type TicketTypeForPricing = {
  price: number; // base price in cents
  quantity: number;
  quantitySold: number;
};

export type PricingTierInput = {
  id: string;
  name: string;
  type: "time_based" | "demand_based";
  price: number; // cents
  startsAt: Date | null;
  endsAt: Date | null;
  minPercentSold: number | null;
  maxPercentSold: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type VenueSettingsForPricing = {
  taxRate?: number;
  serviceChargePercent?: number;
  autoGratuityPercent?: number;
  hasDinnerService?: boolean;
};

export type EventSettingsForPricing = {
  dinnerIncluded?: boolean;
};

export type PromoCodeForPricing = {
  discountType: "percentage" | "fixed_amount";
  discountValue: number; // cents for fixed, pct * 100 for percentage (e.g. 1500 = 15%)
};

export type PriceResult = {
  price: number;
  tierId: string | null;
  tierName: string | null;
};

/**
 * Compute the current effective price for a ticket type.
 * Priority: demand-based > time-based > base price.
 */
export function computeCurrentPrice(
  ticketType: TicketTypeForPricing,
  tiers: PricingTierInput[],
  now: Date = new Date()
): PriceResult {
  const activeTiers = tiers.filter((t) => t.isActive);

  // 1. Check demand-based tiers
  const percentSold =
    ticketType.quantity > 0
      ? (ticketType.quantitySold / ticketType.quantity) * 100
      : 0;

  const demandTier = activeTiers
    .filter((t) => t.type === "demand_based")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find(
      (t) =>
        t.minPercentSold != null &&
        t.maxPercentSold != null &&
        percentSold >= t.minPercentSold &&
        percentSold < t.maxPercentSold
    );

  if (demandTier) {
    return { price: demandTier.price, tierId: demandTier.id, tierName: demandTier.name };
  }

  // 2. Check time-based tiers
  const timeTier = activeTiers
    .filter((t) => t.type === "time_based")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find(
      (t) =>
        t.startsAt != null &&
        t.endsAt != null &&
        now >= t.startsAt &&
        now < t.endsAt
    );

  if (timeTier) {
    return { price: timeTier.price, tierId: timeTier.id, tierName: timeTier.name };
  }

  // 3. Fallback to base price
  return { price: ticketType.price, tierId: null, tierName: null };
}

/**
 * Calculate fees based on venue and event settings.
 */
export function calculateFees(
  subtotalCents: number,
  venueSettings: VenueSettingsForPricing,
  eventSettings: EventSettingsForPricing
) {
  const serviceCharge = Math.round(
    subtotalCents * (venueSettings.serviceChargePercent ?? 0) / 100
  );

  const tax = Math.round(
    (subtotalCents + serviceCharge) * (venueSettings.taxRate ?? 0) / 100
  );

  const gratuity =
    eventSettings.dinnerIncluded && venueSettings.autoGratuityPercent
      ? Math.round(subtotalCents * venueSettings.autoGratuityPercent / 100)
      : 0;

  return { serviceCharge, tax, gratuity, totalFees: serviceCharge + tax + gratuity };
}

/**
 * Apply a promo code discount to a subtotal.
 */
export function applyDiscount(
  subtotalCents: number,
  promoCode: PromoCodeForPricing
): number {
  if (promoCode.discountType === "percentage") {
    // discountValue is pct * 100 (e.g. 1500 = 15%)
    return Math.round(subtotalCents * promoCode.discountValue / 10000);
  }
  // fixed_amount: cap at subtotal so we don't go negative
  return Math.min(promoCode.discountValue, subtotalCents);
}

/**
 * Calculate the full order total with fees and optional discount.
 */
export function calculateOrderTotal(
  subtotalCents: number,
  venueSettings: VenueSettingsForPricing,
  eventSettings: EventSettingsForPricing,
  promoCode?: PromoCodeForPricing | null
) {
  const discount = promoCode ? applyDiscount(subtotalCents, promoCode) : 0;
  const discountedSubtotal = subtotalCents - discount;

  const fees = calculateFees(discountedSubtotal, venueSettings, eventSettings);

  return {
    subtotal: subtotalCents,
    discount,
    serviceCharge: fees.serviceCharge,
    tax: fees.tax,
    gratuity: fees.gratuity,
    total: discountedSubtotal + fees.totalFees,
  };
}
