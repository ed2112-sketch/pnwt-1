"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function TierForm({
  eventTicketTypeId,
  onDone,
}: {
  eventTicketTypeId: string;
  onDone: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [tierType, setTierType] = useState<string>("time_based");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPercent, setMinPercent] = useState("");
  const [maxPercent, setMaxPercent] = useState("");

  const create = trpc.pricing.create.useMutation({
    onSuccess: () => {
      toast.success("Pricing tier added!");
      utils.pricing.list.invalidate({ eventTicketTypeId });
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      eventTicketTypeId,
      name,
      type: tierType as "time_based" | "demand_based",
      price: Math.round(parseFloat(price) * 100),
      ...(tierType === "time_based"
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : {
            minPercent: parseFloat(minPercent),
            maxPercent: parseFloat(maxPercent),
          }),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4 border-t pt-4">
      <div className="space-y-2">
        <Label htmlFor="tier-name">Tier Name</Label>
        <Input
          id="tier-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Early Bird"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={tierType}
            onValueChange={(v) => setTierType(v ?? "time_based")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_based">Time Based</SelectItem>
              <SelectItem value="demand_based">Demand Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier-price">Price ($)</Label>
          <Input
            id="tier-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
      </div>
      {tierType === "time_based" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tier-start">Start Date</Label>
            <Input
              id="tier-start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-end">End Date</Label>
            <Input
              id="tier-end"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tier-min">Min % Sold</Label>
            <Input
              id="tier-min"
              type="number"
              step="1"
              min="0"
              max="100"
              value={minPercent}
              onChange={(e) => setMinPercent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-max">Max % Sold</Label>
            <Input
              id="tier-max"
              type="number"
              step="1"
              min="0"
              max="100"
              value={maxPercent}
              onChange={(e) => setMaxPercent(e.target.value)}
              required
            />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Adding..." : "Add Tier"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TicketTypeCard({ ticketType }: { ticketType: { id: string; name: string; price: number } }) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);

  const { data: tiers, isLoading } = trpc.pricing.list.useQuery({
    eventTicketTypeId: ticketType.id,
  });

  const remove = trpc.pricing.delete.useMutation({
    onSuccess: () => {
      toast.success("Pricing tier removed.");
      utils.pricing.list.invalidate({ eventTicketTypeId: ticketType.id });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{ticketType.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Base price: {formatPrice(ticketType.price)}
          </p>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Add Tier
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tiers...</p>
        ) : tiers?.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pricing tiers yet.
          </p>
        ) : (
          <div className="space-y-2">
            {tiers?.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">{tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.type === "time_based" && tier.startsAt && tier.endsAt
                        ? `${new Date(tier.startsAt).toLocaleDateString()} - ${new Date(tier.endsAt).toLocaleDateString()}`
                        : tier.type === "demand_based" && tier.minPercentSold != null && tier.maxPercentSold != null
                          ? `${tier.minPercentSold}% - ${tier.maxPercentSold}% sold`
                          : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {tier.type === "time_based" ? "Time" : "Demand"}
                  </Badge>
                  <Badge variant={tier.isActive ? "default" : "secondary"}>
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatPrice(tier.price)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate({ id: tier.id })}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showForm && (
          <TierForm
            eventTicketTypeId={ticketType.id}
            onDone={() => setShowForm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function PricingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const { data: ticketTypes, isLoading } = trpc.eventTicketType.list.useQuery({
    eventId,
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pricing Tiers</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : ticketTypes?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No ticket types yet. Add ticket types first before setting up
              pricing tiers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ticketTypes?.map((tt) => (
            <TicketTypeCard key={tt.id} ticketType={tt} />
          ))}
        </div>
      )}
    </div>
  );
}
