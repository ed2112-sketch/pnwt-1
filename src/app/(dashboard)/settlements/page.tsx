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

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function SettlementsPage() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: settlements, isLoading } = trpc.settlement.list.useQuery();
  const { data: events } = trpc.event.list.useQuery();

  const generate = trpc.settlement.generate.useMutation({
    onSuccess: () => {
      toast.success("Settlement generated!");
      utils.settlement.list.invalidate();
      setShowForm(false);
      setEventId("");
      setStartDate("");
      setEndDate("");
    },
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    generate.mutate({
      eventId: eventId || undefined,
      periodStart: new Date(startDate),
      periodEnd: new Date(endDate),
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settlements</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Generate Settlement
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Settlement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Event (optional)</Label>
                <Select
                  value={eventId}
                  onValueChange={(v) => setEventId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settle-start">Start Date</Label>
                  <Input
                    id="settle-start"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settle-end">End Date</Label>
                  <Input
                    id="settle-end"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={generate.isPending}>
                  {generate.isPending ? "Generating..." : "Generate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEventId("");
                    setStartDate("");
                    setEndDate("");
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
      ) : !settlements || settlements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No settlements yet.</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Generate your first settlement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/settlements/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {new Date(s.periodStart).toLocaleDateString()} &ndash;{" "}
                      {new Date(s.periodEnd).toLocaleDateString()}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.eventId ? s.eventId.slice(0, 8) + "..." : "All"}
                  </TableCell>
                  <TableCell>{formatPrice(s.grossRevenue)}</TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(s.netRevenue)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.payoutStatus === "paid"
                          ? "default"
                          : s.payoutStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {s.payoutStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
