"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function GiftCardDetailPage({
  params,
}: {
  params: Promise<{ giftCardId: string }>;
}) {
  const { giftCardId } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: giftCard, isLoading } = trpc.giftCard.getById.useQuery({
    id: giftCardId,
  });

  const cancel = trpc.giftCard.cancel.useMutation({
    onSuccess: () => {
      toast.success("Gift card cancelled.");
      utils.giftCard.getById.invalidate({ id: giftCardId });
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

  if (!giftCard) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Gift card not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono">{giftCard.code}</h1>
            <Badge
              variant={
                giftCard.status === "active"
                  ? "default"
                  : giftCard.status === "depleted"
                    ? "secondary"
                    : "destructive"
              }
            >
              {giftCard.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created on{" "}
            {new Date(giftCard.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        {giftCard.status === "active" && (
          <Button
            variant="destructive"
            onClick={() => cancel.mutate({ id: giftCardId })}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? "Cancelling..." : "Cancel Gift Card"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Amount</span>
              <span className="font-medium">
                {formatPrice(giftCard.initialBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-bold text-base">
                {formatPrice(giftCard.currentBalance)}
              </span>
            </div>
            {giftCard.expiresAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>
                  {new Date(giftCard.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{giftCard.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{giftCard.recipientEmail}</span>
            </div>
            {giftCard.message && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Message
                  </span>
                  <p className="italic">&ldquo;{giftCard.message}&rdquo;</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {giftCard.transactions && giftCard.transactions.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftCard.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {formatPrice(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(tx.balanceAfter)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No transactions yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
