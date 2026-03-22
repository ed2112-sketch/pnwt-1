"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function GiftCardsPage() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);

  const { data: giftCards, isLoading } = trpc.giftCard.list.useQuery();

  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const create = trpc.giftCard.create.useMutation({
    onSuccess: () => {
      toast.success("Gift card issued!");
      utils.giftCard.list.invalidate();
      setShowForm(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setAmount("");
    setRecipientEmail("");
    setRecipientName("");
    setMessage("");
    setExpiresAt("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      initialBalance: Math.round(parseFloat(amount) * 100),
      recipientEmail,
      recipientName,
      message: message || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gift Cards</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Issue Gift Card</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue New Gift Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gc-amount">Amount ($)</Label>
                  <Input
                    id="gc-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gc-expiry">Expiry (optional)</Label>
                  <Input
                    id="gc-expiry"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gc-email">Recipient Email</Label>
                  <Input
                    id="gc-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gc-name">Recipient Name</Label>
                  <Input
                    id="gc-name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gc-message">Message (optional)</Label>
                <Input
                  id="gc-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enjoy the show!"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Issuing..." : "Issue Gift Card"}
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
      ) : giftCards?.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No gift cards issued yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Issue your first gift card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Initial</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giftCards?.map((gc) => (
                <TableRow
                  key={gc.id}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Link
                      href={`/gift-cards/${gc.id}`}
                      className="font-mono font-medium hover:underline"
                    >
                      {gc.code}
                    </Link>
                  </TableCell>
                  <TableCell>{formatPrice(gc.initialBalance)}</TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(gc.currentBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        gc.status === "active"
                          ? "default"
                          : gc.status === "depleted"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {gc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{gc.recipientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {gc.recipientEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(gc.createdAt).toLocaleDateString()}
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
