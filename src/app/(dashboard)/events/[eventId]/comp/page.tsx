"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const { data: ticketTypes, isLoading } = trpc.eventTicketType.list.useQuery({
    eventId,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const comp = trpc.order.createComp.useMutation({
    onSuccess: () => {
      toast.success("Comp tickets created.");
      router.push("/orders");
    },
    onError: (err) => toast.error(err.message),
  });

  function setQuantity(ticketTypeId: string, value: number) {
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    if (items.length === 0) {
      toast.error("Select at least one ticket.");
      return;
    }

    comp.mutate({ eventId, name, email, items });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Comp Tickets</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comp Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading ticket types...</p>
          ) : !ticketTypes || ticketTypes.length === 0 ? (
            <p className="text-muted-foreground">
              No ticket types available for this event.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comp-name">Name</Label>
                <Input
                  id="comp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Attendee name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comp-email">Email</Label>
                <Input
                  id="comp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="attendee@example.com"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Ticket Types</Label>
                {ticketTypes.map((tt) => (
                  <div
                    key={tt.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{tt.name}</p>
                      {tt.description && (
                        <p className="text-xs text-muted-foreground">
                          {tt.description}
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[tt.id] ?? 0}
                      onChange={(e) =>
                        setQuantity(tt.id, parseInt(e.target.value) || 0)
                      }
                      className="w-20 text-center"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={comp.isPending}>
                  {comp.isPending ? "Creating..." : "Create Comp Order"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
