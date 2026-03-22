"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/dashboard/confirm-dialog";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();

  const cancel = trpc.order.cancel.useMutation({
    onSuccess: () => {
      toast.success("Order cancelled.");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <ConfirmButton
      onConfirm={() => cancel.mutate({ id: orderId })}
      title="Cancel this order?"
      description="The customer will be notified and tickets will be voided."
      confirmText="Cancel Order"
      variant="destructive"
      disabled={cancel.isPending}
    >
      <Button variant="destructive" disabled={cancel.isPending}>
        {cancel.isPending ? "Cancelling..." : "Cancel Order"}
      </Button>
    </ConfirmButton>
  );
}
