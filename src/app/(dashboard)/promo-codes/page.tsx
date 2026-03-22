"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

function formatDiscount(type: string, value: number) {
  if (type === "percentage") {
    return `${value}%`;
  }
  return `$${(value / 100).toFixed(2)}`;
}

export default function PromoCodesPage() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);

  const { data: promos, isLoading } = trpc.promo.list.useQuery();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<string>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [eventId, setEventId] = useState("");

  const create = trpc.promo.create.useMutation({
    onSuccess: () => {
      toast.success("Promo code created!");
      utils.promo.list.invalidate();
      setShowForm(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = trpc.promo.delete.useMutation({
    onSuccess: () => {
      toast.success("Promo code deleted.");
      utils.promo.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("");
    setValidFrom("");
    setValidTo("");
    setEventId("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      code: code.toUpperCase(),
      discountType: discountType as "percentage" | "fixed_amount",
      discountValue:
        discountType === "percentage"
          ? parseFloat(discountValue)
          : Math.round(parseFloat(discountValue) * 100),
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      eventId: eventId || undefined,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Create Promo Code</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Promo Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EARLYBIRD20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v ?? "percentage")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-value">
                    {discountType === "percentage"
                      ? "Discount (%)"
                      : "Discount ($)"}
                  </Label>
                  <Input
                    id="promo-value"
                    type="number"
                    step={discountType === "percentage" ? "1" : "0.01"}
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-max">Max Uses (blank = unlimited)</Label>
                  <Input
                    id="promo-max"
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-from">Valid From</Label>
                  <Input
                    id="promo-from"
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-to">Valid To</Label>
                  <Input
                    id="promo-to"
                    type="datetime-local"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-event">
                  Event ID (blank = all events)
                </Label>
                <Input
                  id="promo-event"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Leave blank for all events"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create Promo Code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : promos?.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No promo codes yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Create your first promo code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Valid Dates</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos?.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-medium">
                    {promo.code}
                  </TableCell>
                  <TableCell>
                    {formatDiscount(promo.discountType, promo.discountValue)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {promo.currentUses} /{" "}
                    {promo.maxUses != null ? promo.maxUses : "unlimited"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {promo.validFrom
                      ? new Date(promo.validFrom).toLocaleDateString()
                      : "—"}{" "}
                    to{" "}
                    {promo.validTo
                      ? new Date(promo.validTo).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {promo.eventId ? promo.eventId.slice(0, 8) + "..." : "All"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={promo.isActive ? "default" : "secondary"}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate({ id: promo.id })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
