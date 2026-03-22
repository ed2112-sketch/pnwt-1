"use client";

import { use } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusVariant(status: string) {
  switch (status) {
    case "waiting":
      return "secondary" as const;
    case "notified":
      return "default" as const;
    case "converted":
      return "default" as const;
    case "expired":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export default function WaitlistPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();

  const { data: entries, isLoading } = trpc.waitlist.listByEvent.useQuery({
    eventId,
  });

  const notifyNext = trpc.waitlist.notifyNext.useMutation({
    onSuccess: () => {
      toast.success("Next person notified.");
      utils.waitlist.listByEvent.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = trpc.waitlist.remove.useMutation({
    onSuccess: () => {
      toast.success("Entry removed.");
      utils.waitlist.listByEvent.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  const expireStale = trpc.waitlist.checkExpired.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} stale entries expired.`);
      utils.waitlist.listByEvent.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Waitlist</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => notifyNext.mutate({ eventId })}
            disabled={notifyNext.isPending}
          >
            {notifyNext.isPending ? "Notifying..." : "Notify Next"}
          </Button>
          <Button
            variant="outline"
            onClick={() => expireStale.mutate({ eventId })}
            disabled={expireStale.isPending}
          >
            {expireStale.isPending ? "Checking..." : "Expire Stale"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !entries || entries.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No waitlist entries.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Ticket Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notified At</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {entry.priority}
                  </TableCell>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    {entry.ticketType?.name ?? "Any"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(entry.status)}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.notifiedAt
                      ? new Date(entry.notifiedAt).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove.mutate({ id: entry.id })}
                      disabled={remove.isPending}
                    >
                      Remove
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
