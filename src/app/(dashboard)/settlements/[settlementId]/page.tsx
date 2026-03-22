"use client";

import { use } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SettlementDetailPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = use(params);
  const utils = trpc.useUtils();

  const { data: settlement, isLoading } = trpc.settlement.getById.useQuery({
    id: settlementId,
  });

  const markPaid = trpc.settlement.markPaid.useMutation({
    onSuccess: () => {
      toast.success("Settlement marked as paid!");
      utils.settlement.getById.invalidate({ id: settlementId });
      utils.settlement.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Settlement not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settlement Details</h1>
          <p className="text-muted-foreground">
            {new Date(settlement.periodStart).toLocaleDateString()} &ndash;{" "}
            {new Date(settlement.periodEnd).toLocaleDateString()}
            {settlement.event && ` \u00b7 ${settlement.event.title}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              settlement.payoutStatus === "paid"
                ? "default"
                : settlement.payoutStatus === "pending"
                  ? "secondary"
                  : "destructive"
            }
            className="text-sm"
          >
            {settlement.payoutStatus}
          </Badge>
          {settlement.payoutStatus === "pending" && (
            <Button
              onClick={() => markPaid.mutate({ id: settlementId })}
              disabled={markPaid.isPending}
            >
              {markPaid.isPending ? "Updating..." : "Mark as Paid"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Gross Revenue</span>
            <span className="font-medium">
              {formatPrice(settlement.grossRevenue)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>- Promo Discounts</span>
            <span>-{formatPrice(settlement.promoDiscounts)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>+ Service Charges</span>
            <span>+{formatPrice(settlement.serviceCharges)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>+ Taxes</span>
            <span>+{formatPrice(settlement.taxes)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>+ Gratuities</span>
            <span>+{formatPrice(settlement.gratuities)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>- Refunds</span>
            <span>-{formatPrice(settlement.refunds)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>= Net Revenue</span>
            <span>{formatPrice(settlement.netRevenue)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
