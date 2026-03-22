"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrderNotes({
  orderId,
  initialNotes,
}: {
  orderId: string;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");

  const update = trpc.order.updateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved."),
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Admin Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this order..."
          rows={4}
        />
        <Button
          size="sm"
          onClick={() => update.mutate({ id: orderId, notes })}
          disabled={update.isPending}
        >
          {update.isPending ? "Saving..." : "Save Notes"}
        </Button>
      </CardContent>
    </Card>
  );
}
