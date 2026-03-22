"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currentPrice: number;
  tierName: string | null;
  tierId: string | null;
  remaining: number;
  maxPerOrder: number;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function TicketSelector({
  eventId,
  eventSlug,
  eventTitle,
  ticketTypes,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [openWaitlistId, setOpenWaitlistId] = useState<string | null>(null);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "", phone: "" });

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: () => {
      toast("You've been added to the waitlist!");
      setOpenWaitlistId(null);
      setWaitlistForm({ name: "", email: "", phone: "" });
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  function updateQuantity(ticketTypeId: string, delta: number) {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const tt = ticketTypes.find((t) => t.id === ticketTypeId)!;
      const next = Math.max(0, Math.min(current + delta, tt.remaining, tt.maxPerOrder));
      return { ...prev, [ticketTypeId]: next };
    });
  }

  function handleWaitlistToggle(ticketTypeId: string) {
    if (openWaitlistId === ticketTypeId) {
      setOpenWaitlistId(null);
      setWaitlistForm({ name: "", email: "", phone: "" });
    } else {
      setOpenWaitlistId(ticketTypeId);
      setWaitlistForm({ name: "", email: "", phone: "" });
    }
  }

  function handleWaitlistSubmit(eventTicketTypeId: string) {
    if (!waitlistForm.name.trim() || !waitlistForm.email.trim()) return;
    joinWaitlist.mutate({
      eventId,
      eventTicketTypeId,
      name: waitlistForm.name.trim(),
      email: waitlistForm.email.trim(),
      phone: waitlistForm.phone.trim() || undefined,
    });
  }

  const subtotal = ticketTypes.reduce((sum, tt) => {
    const qty = quantities[tt.id] ?? 0;
    return sum + tt.currentPrice * qty;
  }, 0);

  const hasItems = Object.values(quantities).some((q) => q > 0);

  function handleCheckout() {
    const items = ticketTypes
      .filter((tt) => (quantities[tt.id] ?? 0) > 0)
      .map((tt) => ({
        ticketTypeId: tt.id,
        name: tt.name,
        quantity: quantities[tt.id],
        unitPrice: tt.currentPrice,
      }));

    const cart = {
      eventId,
      eventSlug,
      eventTitle,
      items,
    };

    sessionStorage.setItem("pnwt-cart", JSON.stringify(cart));
    router.push("/checkout");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Select Tickets</h2>
      </div>

      {/* Ticket types */}
      <div className="space-y-3">
        {ticketTypes.length === 0 && (
          <div
            className="rounded-xl p-6 text-center text-sm text-[#666] border border-[rgba(255,255,255,0.08)]"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            No tickets are currently available for this event.
          </div>
        )}

        {ticketTypes.map((tt) => {
          const qty = quantities[tt.id] ?? 0;
          const soldOut = tt.remaining === 0;
          const waitlistOpen = openWaitlistId === tt.id;

          return (
            <div key={tt.id}>
              <div
                className="rounded-xl p-5 border transition-colors duration-200"
                style={{
                  backgroundColor: "#1a1a1a",
                  borderColor: qty > 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-white">
                        {tt.name}
                      </span>
                      {tt.tierName && (
                        <span className="text-xs text-[#a1a1a1]">
                          {tt.tierName}
                        </span>
                      )}
                    </div>

                    {tt.description && (
                      <div
                        className="text-sm text-[#e0ded9] mb-2 [&_p]:mb-1 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: tt.description }}
                      />
                    )}

                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-white">
                        {formatPrice(tt.currentPrice)}
                      </span>
                      {tt.currentPrice !== tt.basePrice && (
                        <span className="text-sm line-through text-[#666]">
                          {formatPrice(tt.basePrice)}
                        </span>
                      )}
                    </div>

                    {soldOut ? (
                      <p className="text-sm text-red-400 mt-1">Sold Out</p>
                    ) : (
                      <p className="text-xs text-[#666] mt-1">
                        {tt.remaining} remaining
                      </p>
                    )}
                  </div>

                  {/* Quantity controls or waitlist */}
                  {soldOut ? (
                    <button
                      onClick={() => handleWaitlistToggle(tt.id)}
                      className="px-4 py-2 rounded-full text-sm font-medium border border-[rgba(255,255,255,0.08)] text-[#a1a1a1] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-colors duration-200 cursor-pointer shrink-0"
                    >
                      {waitlistOpen ? "Cancel" : "Join Waitlist"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => updateQuantity(tt.id, -1)}
                        disabled={qty === 0}
                        className="size-9 rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.08)] text-white transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[rgba(255,255,255,0.2)]"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-lg font-semibold tabular-nums text-white">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(tt.id, 1)}
                        disabled={qty >= Math.min(tt.remaining, tt.maxPerOrder)}
                        className="size-9 rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.08)] text-white transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[rgba(255,255,255,0.2)]"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Waitlist form */}
              {soldOut && waitlistOpen && (
                <div
                  className="rounded-xl p-5 mt-2 border border-dashed border-[rgba(255,255,255,0.08)]"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  <p className="text-sm font-medium text-white mb-3">
                    Get notified when {tt.name} tickets become available
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`wl-name-${tt.id}`}
                        className="text-xs font-medium block mb-1 text-[#666]"
                      >
                        Name
                      </label>
                      <input
                        id={`wl-name-${tt.id}`}
                        placeholder="Your name"
                        value={waitlistForm.name}
                        onChange={(e) =>
                          setWaitlistForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white border border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.2)] transition-colors duration-200"
                        style={{ backgroundColor: "#141414" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`wl-email-${tt.id}`}
                        className="text-xs font-medium block mb-1 text-[#666]"
                      >
                        Email
                      </label>
                      <input
                        id={`wl-email-${tt.id}`}
                        type="email"
                        placeholder="you@example.com"
                        value={waitlistForm.email}
                        onChange={(e) =>
                          setWaitlistForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white border border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.2)] transition-colors duration-200"
                        style={{ backgroundColor: "#141414" }}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label
                      htmlFor={`wl-phone-${tt.id}`}
                      className="text-xs font-medium block mb-1 text-[#666]"
                    >
                      Phone (optional)
                    </label>
                    <input
                      id={`wl-phone-${tt.id}`}
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={waitlistForm.phone}
                      onChange={(e) =>
                        setWaitlistForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white border border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.2)] transition-colors duration-200"
                      style={{ backgroundColor: "#141414" }}
                    />
                  </div>
                  <button
                    disabled={
                      !waitlistForm.name.trim() ||
                      !waitlistForm.email.trim() ||
                      joinWaitlist.isPending
                    }
                    onClick={() => handleWaitlistSubmit(tt.id)}
                    className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-white text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200"
                  >
                    {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtotal bar */}
      <div
        className="rounded-xl p-5 mt-6 sticky bottom-4 md:static border-t border-[rgba(255,255,255,0.08)]"
        style={{ backgroundColor: "#141414" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#666]">Subtotal</p>
            <p className="text-2xl font-bold text-white">
              {formatPrice(subtotal)}
            </p>
          </div>
          <button
            disabled={!hasItems}
            onClick={handleCheckout}
            className="inline-flex items-center px-8 py-3 rounded-full text-sm font-medium bg-white text-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
