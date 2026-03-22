import { notFound } from "next/navigation";
import { serverTRPC } from "@/lib/trpc/server";
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
import { CancelOrderButton } from "./cancel-button";
import { OrderNotes } from "./order-notes";
import { RefundForm } from "./refund-form";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const trpc = await serverTRPC();

  let order;
  try {
    order = await trpc.order.getById({ id: orderId });
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Order #{order.id.slice(0, 8)}...
            </h1>
            <Badge
              variant={
                order.status === "confirmed"
                  ? "default"
                  : order.status === "cancelled"
                    ? "destructive"
                    : order.status === "refunded"
                      ? "secondary"
                      : "secondary"
              }
            >
              {order.status}
            </Badge>
            {order.isComp && <Badge variant="secondary">Comp</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        {order.status !== "cancelled" && order.status !== "refunded" && (
          <CancelOrderButton orderId={order.id} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.name}</p>
            <p className="text-muted-foreground">{order.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.event?.title ?? "—"}</p>
            {order.event?.venue && (
              <p className="text-muted-foreground">{order.event.venue.name}</p>
            )}
            {order.event?.startDate && (
              <p className="text-muted-foreground">
                {new Date(order.event.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.ticketType?.name ?? "Ticket"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotalAmount)}</span>
            </div>
            {order.feesAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fees</span>
                <span>{formatPrice(order.feesAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            {order.gratuityAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gratuity</span>
                <span>{formatPrice(order.gratuityAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -{formatPrice(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      {order.tickets && order.tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticketNumber ?? ticket.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {ticket.attendeeName ?? "—"}
                        </p>
                        {ticket.attendeeEmail && (
                          <p className="text-xs text-muted-foreground">
                            {ticket.attendeeEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.ticketType?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === "valid"
                            ? "default"
                            : ticket.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.checkedInAt
                        ? new Date(ticket.checkedInAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Refund Info */}
      {order.status === "refunded" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refund Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.refundAmount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund Amount</span>
                <span className="font-medium">
                  {formatPrice(order.refundAmount)}
                </span>
              </div>
            )}
            {order.refundReason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason</span>
                <span>{order.refundReason}</span>
              </div>
            )}
            {order.refundedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refunded At</span>
                <span>
                  {new Date(order.refundedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refund Form - only for confirmed orders */}
      {order.status === "confirmed" && (
        <RefundForm orderId={order.id} totalAmount={order.totalAmount} />
      )}

      {/* Admin Notes */}
      <OrderNotes orderId={order.id} initialNotes={order.notes ?? null} />
    </div>
  );
}
