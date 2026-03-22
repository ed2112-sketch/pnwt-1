"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { ShoppingCart, User, CreditCard, ChevronDown, Tag, Gift, Check } from "lucide-react";

interface CartItem {
  ticketTypeId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  items: CartItem[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ---- Progress Step Indicator ---- */
function ProgressSteps({ active }: { active: number }) {
  const steps = [
    { label: "Cart", icon: ShoppingCart },
    { label: "Details", icon: User },
    { label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-10 animate-fade-in-up">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i <= active;
        const isComplete = i < active;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="size-10 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, var(--pub-gradient-start), var(--pub-gradient-end))"
                    : "var(--pub-glass)",
                  border: isActive ? "none" : "1px solid var(--pub-border)",
                }}
              >
                {isComplete ? (
                  <Check className="size-5 text-white" />
                ) : (
                  <Icon
                    className="size-5"
                    style={{
                      color: isActive ? "white" : "var(--pub-text-muted)",
                    }}
                  />
                )}
              </div>
              <span
                className="text-xs mt-1.5 font-medium"
                style={{
                  color: isActive ? "var(--pub-text)" : "var(--pub-text-muted)",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-all duration-500"
                style={{
                  background: i < active
                    ? "linear-gradient(90deg, var(--pub-gradient-start), var(--pub-gradient-end))"
                    : "var(--pub-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>(undefined);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDescription, setPromoDescription] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [giftCardOpen, setGiftCardOpen] = useState(false);

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<string | undefined>(undefined);
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  // Referral code from URL or sessionStorage
  const [referralCode, setReferralCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      // Check for widget cart in URL first
      const widgetCart = searchParams.get("widget_cart");
      if (widgetCart) {
        const parsed = JSON.parse(widgetCart);
        setCart(parsed);
        sessionStorage.setItem("pnwt-cart", JSON.stringify(parsed));
      } else {
        const stored = sessionStorage.getItem("pnwt-cart");
        if (stored) {
          setCart(JSON.parse(stored));
        }
      }
    } catch {
      // ignore parse errors
    }
    // Capture referral code from URL search params or sessionStorage
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferralCode(refParam);
      sessionStorage.setItem("pnwt-referral", refParam);
    } else {
      const storedRef = sessionStorage.getItem("pnwt-referral");
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }
    setCartLoaded(true);
  }, [searchParams]);

  const priceQuery = trpc.checkout.calculatePrice.useQuery(
    {
      eventId: cart?.eventId ?? "",
      items: (cart?.items ?? []).map((i) => ({
        ticketTypeId: i.ticketTypeId,
        quantity: i.quantity,
      })),
      promoCode: appliedPromo,
    },
    { enabled: !!cart }
  );

  const promoQuery = trpc.checkout.applyPromoCode.useQuery(
    { code: promoCode.toUpperCase(), eventId: cart?.eventId ?? "" },
    { enabled: false }
  );

  const giftCardQuery = trpc.giftCard.checkBalance.useQuery(
    { code: giftCardCode.toUpperCase() },
    { enabled: false }
  );

  const createOrder = trpc.checkout.createOrder.useMutation({
    onSuccess: (data) => {
      sessionStorage.removeItem("pnwt-cart");
      router.push(`/checkout/confirmation?orderId=${data.orderId}`);
    },
    onError: (error) => {
      setOrderError(error.message);
    },
  });

  async function handleApplyPromo() {
    setPromoError(null);
    setPromoDescription(null);
    try {
      const result = await promoQuery.refetch();
      if (result.data) {
        setAppliedPromo(promoCode.toUpperCase());
        setPromoDescription(
          result.data.description ??
            `${result.data.discountType === "percentage" ? `${result.data.discountValue}%` : formatPrice(result.data.discountValue)} off`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid promo code.";
      setPromoError(message);
      setAppliedPromo(undefined);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(undefined);
    setPromoCode("");
    setPromoDescription(null);
    setPromoError(null);
  }

  async function handleApplyGiftCard() {
    setGiftCardError(null);
    try {
      const result = await giftCardQuery.refetch();
      if (result.data) {
        setAppliedGiftCard(giftCardCode.toUpperCase());
        setGiftCardBalance(result.data.balance);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid gift card code.";
      setGiftCardError(message);
      setAppliedGiftCard(undefined);
      setGiftCardBalance(null);
    }
  }

  function handleRemoveGiftCard() {
    setAppliedGiftCard(undefined);
    setGiftCardCode("");
    setGiftCardBalance(null);
    setGiftCardError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || !name || !email) return;

    setOrderError(null);
    createOrder.mutate({
      eventId: cart.eventId,
      items: cart.items.map((i) => ({
        ticketTypeId: i.ticketTypeId,
        quantity: i.quantity,
      })),
      email,
      name,
      promoCode: appliedPromo,
      giftCardCode: appliedGiftCard,
      referralCode,
    });
  }

  if (!cartLoaded) return null;

  if (!cart || cart.items.length === 0) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-20 text-center"
        style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
      >
        <ShoppingCart
          className="mx-auto size-16 mb-6"
          style={{ color: "var(--pub-text-muted)" }}
        />
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--pub-text)" }}>
          Your cart is empty
        </h1>
        <p className="mb-8" style={{ color: "var(--pub-text-muted)" }}>
          Looks like you haven&apos;t selected any tickets yet.
        </p>
        <Link
          href="/"
          className="btn-gradient inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  const pricing = priceQuery.data;
  const isFormValid = name.trim().length > 0 && email.trim().length > 0;

  // Determine active step
  const activeStep = isFormValid ? 2 : name || email ? 1 : 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text)" }}
    >
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-10">
        {/* Referral banner */}
        {referralCode && (
          <div
            className="glass-card rounded-xl px-4 py-3 mb-8 text-center text-sm font-medium animate-fade-in-up"
            style={{ color: "var(--pub-accent)" }}
          >
            Referred by a friend — welcome!
          </div>
        )}

        <h1
          className="text-3xl md:text-4xl font-bold text-center mb-2 animate-fade-in-up"
          style={{ color: "var(--pub-text)" }}
        >
          Checkout
        </h1>
        <p
          className="text-center mb-8 animate-fade-in-up-delay-1"
          style={{ color: "var(--pub-text-muted)" }}
        >
          Complete your order for {cart.eventTitle}
        </p>

        <ProgressSteps active={activeStep} />

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column — Order summary */}
            <div className="lg:w-[380px] shrink-0 order-2 lg:order-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Order summary card */}
                <div className="glass-card rounded-xl p-6 animate-fade-in-up-delay-1">
                  <h2
                    className="text-lg font-bold mb-5"
                    style={{ color: "var(--pub-text)" }}
                  >
                    Order Summary
                  </h2>
                  <p
                    className="font-semibold mb-4"
                    style={{ color: "var(--pub-text)" }}
                  >
                    {cart.eventTitle}
                  </p>

                  <div className="space-y-3 mb-5">
                    {cart.items.map((item) => (
                      <div
                        key={item.ticketTypeId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span style={{ color: "var(--pub-text-muted)" }}>
                          {item.name} &times; {item.quantity}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "var(--pub-text)" }}
                        >
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div
                    className="h-px my-4"
                    style={{ background: "var(--pub-border)" }}
                  />

                  {/* Price breakdown */}
                  {pricing ? (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: "var(--pub-text-muted)" }}>Subtotal</span>
                        <span style={{ color: "var(--pub-text)" }}>
                          {formatPrice(pricing.subtotal)}
                        </span>
                      </div>
                      {pricing.discount > 0 && (
                        <div className="flex justify-between" style={{ color: "oklch(0.7 0.2 150)" }}>
                          <span>Discount</span>
                          <span>-{formatPrice(pricing.discount)}</span>
                        </div>
                      )}
                      {pricing.serviceCharge > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: "var(--pub-text-muted)" }}>Service charge</span>
                          <span style={{ color: "var(--pub-text)" }}>
                            {formatPrice(pricing.serviceCharge)}
                          </span>
                        </div>
                      )}
                      {pricing.tax > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: "var(--pub-text-muted)" }}>Tax</span>
                          <span style={{ color: "var(--pub-text)" }}>
                            {formatPrice(pricing.tax)}
                          </span>
                        </div>
                      )}
                      {pricing.gratuity > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: "var(--pub-text-muted)" }}>Gratuity</span>
                          <span style={{ color: "var(--pub-text)" }}>
                            {formatPrice(pricing.gratuity)}
                          </span>
                        </div>
                      )}
                      {appliedGiftCard && giftCardBalance != null && pricing.total > 0 && (
                        <div className="flex justify-between" style={{ color: "oklch(0.7 0.2 150)" }}>
                          <span>Gift card applied</span>
                          <span>-{formatPrice(Math.min(giftCardBalance, pricing.total))}</span>
                        </div>
                      )}

                      <div
                        className="h-px my-3"
                        style={{ background: "var(--pub-border)" }}
                      />

                      <div className="flex justify-between font-bold text-lg">
                        <span style={{ color: "var(--pub-text)" }}>Total</span>
                        <span className="gradient-text">
                          {formatPrice(
                            appliedGiftCard && giftCardBalance != null
                              ? Math.max(0, pricing.total - giftCardBalance)
                              : pricing.total
                          )}
                        </span>
                      </div>
                    </div>
                  ) : priceQuery.isLoading ? (
                    <div className="shimmer h-20 rounded-lg" />
                  ) : priceQuery.isError ? (
                    <p className="text-sm" style={{ color: "oklch(0.7 0.2 25)" }}>
                      Failed to calculate price. Please try again.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right column — Forms */}
            <div className="flex-1 min-w-0 space-y-6 order-1 lg:order-2">
              {/* Customer info */}
              <div className="glass-card rounded-xl p-6 animate-fade-in-up-delay-1">
                <h2
                  className="text-lg font-bold mb-5 flex items-center gap-2"
                  style={{ color: "var(--pub-text)" }}
                >
                  <User className="size-5" style={{ color: "var(--pub-primary)" }} />
                  Your Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-sm font-medium block mb-1.5"
                      style={{ color: "var(--pub-text-muted)" }}
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all duration-200 focus:ring-2"
                      style={{
                        background: "var(--pub-glass)",
                        border: "1px solid var(--pub-border)",
                        color: "var(--pub-text)",
                        "--tw-ring-color": "var(--pub-primary)",
                      } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-medium block mb-1.5"
                      style={{ color: "var(--pub-text-muted)" }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all duration-200 focus:ring-2"
                      style={{
                        background: "var(--pub-glass)",
                        border: "1px solid var(--pub-border)",
                        color: "var(--pub-text)",
                        "--tw-ring-color": "var(--pub-primary)",
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* Promo code — expandable */}
              <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up-delay-2">
                <button
                  type="button"
                  onClick={() => setPromoOpen(!promoOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--pub-text)" }}>
                    <Tag className="size-4" style={{ color: "var(--pub-primary)" }} />
                    Promo Code
                  </span>
                  <ChevronDown
                    className="size-4 transition-transform duration-300"
                    style={{
                      color: "var(--pub-text-muted)",
                      transform: promoOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {(promoOpen || appliedPromo) && (
                  <div className="px-6 pb-5">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="glass-card text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ color: "var(--pub-accent)" }}
                          >
                            {appliedPromo}
                          </span>
                          {promoDescription && (
                            <span className="text-sm" style={{ color: "var(--pub-text-muted)" }}>
                              {promoDescription}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-sm font-medium cursor-pointer"
                          style={{ color: "var(--pub-text-muted)" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200"
                          style={{
                            background: "var(--pub-glass)",
                            border: "1px solid var(--pub-border)",
                            color: "var(--pub-text)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={!promoCode.trim()}
                          className="glass-card px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: "var(--pub-primary)" }}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-sm mt-2" style={{ color: "oklch(0.7 0.2 25)" }}>
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Gift card — expandable */}
              <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up-delay-2">
                <button
                  type="button"
                  onClick={() => setGiftCardOpen(!giftCardOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--pub-text)" }}>
                    <Gift className="size-4" style={{ color: "var(--pub-primary)" }} />
                    Gift Card
                  </span>
                  <ChevronDown
                    className="size-4 transition-transform duration-300"
                    style={{
                      color: "var(--pub-text-muted)",
                      transform: giftCardOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {(giftCardOpen || appliedGiftCard) && (
                  <div className="px-6 pb-5">
                    {appliedGiftCard ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="glass-card text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ color: "var(--pub-accent)" }}
                          >
                            {appliedGiftCard}
                          </span>
                          {giftCardBalance != null && (
                            <span className="text-sm" style={{ color: "var(--pub-text-muted)" }}>
                              Balance: {formatPrice(giftCardBalance)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveGiftCard}
                          className="text-sm font-medium cursor-pointer"
                          style={{ color: "var(--pub-text-muted)" }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          placeholder="Enter gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-200"
                          style={{
                            background: "var(--pub-glass)",
                            border: "1px solid var(--pub-border)",
                            color: "var(--pub-text)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyGiftCard}
                          disabled={!giftCardCode.trim()}
                          className="glass-card px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: "var(--pub-primary)" }}
                        >
                          Apply
                        </button>
                      </div>
                    )}
                    {giftCardError && (
                      <p className="text-sm mt-2" style={{ color: "oklch(0.7 0.2 25)" }}>
                        {giftCardError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment info */}
              <div className="glass-card rounded-xl p-6 animate-fade-in-up-delay-3">
                <h2
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ color: "var(--pub-text)" }}
                >
                  <CreditCard className="size-5" style={{ color: "var(--pub-primary)" }} />
                  Payment
                </h2>
                <div
                  className="glass-card rounded-xl p-5 text-center text-sm"
                  style={{ borderStyle: "dashed", color: "var(--pub-text-muted)" }}
                >
                  <p className="font-medium" style={{ color: "var(--pub-text)" }}>
                    Test Mode
                  </p>
                  <p className="mt-1">
                    No payment required &mdash; orders are automatically confirmed.
                  </p>
                </div>
              </div>

              {/* Error */}
              {orderError && (
                <div
                  className="glass-card rounded-xl px-5 py-3 text-sm"
                  style={{
                    color: "oklch(0.75 0.15 25)",
                    background: "oklch(0.5 0.2 25 / 10%)",
                    border: "1px solid oklch(0.5 0.2 25 / 20%)",
                  }}
                >
                  {orderError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isFormValid || createOrder.isPending || !pricing}
                className="btn-gradient w-full py-4 rounded-xl text-lg font-bold transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none animate-fade-in-up-delay-3"
                style={
                  isFormValid && pricing && !createOrder.isPending
                    ? { animation: "pulse-glow 2s ease-in-out infinite, fade-in-up 0.6s ease-out 0.3s both" }
                    : undefined
                }
              >
                {createOrder.isPending ? "Processing..." : "Complete Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="max-w-3xl mx-auto px-4 py-20 text-center"
          style={{ backgroundColor: "var(--pub-bg)", color: "var(--pub-text-muted)" }}
        >
          <div className="shimmer h-8 w-48 mx-auto rounded-lg mb-4" />
          <div className="shimmer h-4 w-64 mx-auto rounded-lg" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
