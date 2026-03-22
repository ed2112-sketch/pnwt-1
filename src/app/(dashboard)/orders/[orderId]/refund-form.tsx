"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/dashboard/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RefundForm({
  orderId,
  totalAmount,
}: {
  orderId: string;
  totalAmount: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState((totalAmount / 100).toFixed(2));
  const [reason, setReason] = useState("");

  const refund = trpc.order.refund.useMutation({
    onSuccess: () => {
      toast.success("Order refunded.");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Refund</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="refund-amount">Refund Amount ($)</Label>
          <Input
            id="refund-amount"
            type="number"
            step="0.01"
            min="0"
            max={(totalAmount / 100).toFixed(2)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-reason">Reason</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for refund..."
            rows={3}
          />
        </div>
        <ConfirmButton
          onConfirm={() =>
            refund.mutate({
              id: orderId,
              refundAmount: Math.round(parseFloat(amount) * 100),
              refundReason: reason || undefined,
            })
          }
          title="Issue this refund?"
          description={`$${amount} will be refunded to the customer.`}
          confirmText="Issue Refund"
          variant="destructive"
          disabled={refund.isPending}
        >
          <Button variant="destructive" disabled={refund.isPending}>
            {refund.isPending ? "Processing..." : "Issue Refund"}
          </Button>
        </ConfirmButton>
      </CardContent>
    </Card>
  );
}
