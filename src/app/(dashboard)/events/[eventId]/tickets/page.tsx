"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function TicketTypesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();

  const { data: ticketTypes, isLoading } = trpc.eventTicketType.list.useQuery({
    eventId,
  });

  const create = trpc.eventTicketType.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket type added!");
      utils.eventTicketType.list.invalidate({ eventId });
      setShowForm(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = trpc.eventTicketType.delete.useMutation({
    onSuccess: () => {
      toast.success("Ticket type removed.");
      utils.eventTicketType.list.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setName("");
    setPrice("");
    setQuantity("");
    setDescription("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      eventId,
      name,
      description: description || undefined,
      price: Math.round(parseFloat(price) * 100),
      quantity: parseInt(quantity),
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ticket Types</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Add Ticket Type</Button>
        )}
      </div>

      {/* Existing ticket types */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : ticketTypes?.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No ticket types yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Add your first ticket type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ticketTypes?.map((tt) => (
            <Card key={tt.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{tt.name}</p>
                  {tt.description && (
                    <p className="text-sm text-muted-foreground">
                      {tt.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatPrice(tt.price)} &middot; {tt.quantitySold} /{" "}
                    {tt.quantity} sold
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tt.isActive ? "default" : "secondary"}>
                    {tt.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {tt.quantitySold === 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate({ id: tt.id })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Ticket Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tt-name">Name</Label>
                <Input
                  id="tt-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. General Admission"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tt-desc">Description</Label>
                <Input
                  id="tt-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tt-price">Price ($)</Label>
                  <Input
                    id="tt-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tt-qty">Quantity</Label>
                  <Input
                    id="tt-qty"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Adding..." : "Add Ticket Type"}
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
    </div>
  );
}
