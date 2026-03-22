"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function EditableName({
  ticketId,
  initialName,
}: {
  ticketId: string;
  initialName: string;
}) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = trpc.ticket.updateAttendee.useMutation({
    onSuccess: () => {
      toast.success("Name updated.");
      utils.ticket.listByEvent.invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name !== initialName) {
            update.mutate({ ticketId, attendeeName: name });
          } else {
            setEditing(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (name !== initialName) {
              update.mutate({ ticketId, attendeeName: name });
            } else {
              setEditing(false);
            }
          }
          if (e.key === "Escape") {
            setName(initialName);
            setEditing(false);
          }
        }}
        className="h-7 w-48"
        disabled={update.isPending}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-left text-sm font-medium hover:underline cursor-pointer"
    >
      {initialName || "—"}
    </button>
  );
}

export default function AttendeesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = trpc.ticket.listByEvent.useQuery({
    eventId,
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : (status as "valid" | "used" | "cancelled"),
  });

  const tickets = data?.tickets ?? [];
  const stats = data?.stats ?? { total: 0, checkedIn: 0, remaining: 0, cancelled: 0 };

  const exportCSV = useCallback(() => {
    const headers = ["Name", "Email", "Ticket Type", "Ticket #", "Status", "Checked In At"];
    const rows = tickets.map((t) => [
      t.attendeeName ?? "",
      t.attendeeEmail ?? "",
      t.ticketType?.name ?? "",
      t.ticketNumber ?? "",
      t.status ?? "",
      t.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendees-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tickets, eventId]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendees</h1>
        <Button variant="outline" onClick={exportCSV} disabled={tickets.length === 0}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.checkedIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.remaining}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No tickets found.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ticket Type</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checked In At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <EditableName
                      ticketId={ticket.id}
                      initialName={ticket.attendeeName ?? ""}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.attendeeEmail ?? "—"}
                  </TableCell>
                  <TableCell>{ticket.ticketType?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {ticket.ticketNumber ?? "—"}
                  </TableCell>
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
        </div>
      )}
    </div>
  );
}
