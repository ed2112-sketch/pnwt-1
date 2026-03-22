"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Calendar, EyeOff, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getStatusStyle(status: string) {
  switch (status) {
    case "published":
      return { background: "oklch(0.6 0.18 150 / 12%)", color: "oklch(0.45 0.15 150)" };
    case "draft":
      return { background: "oklch(0.7 0.15 80 / 12%)", color: "oklch(0.55 0.15 80)" };
    case "completed":
      return { background: "oklch(0.55 0.2 240 / 12%)", color: "oklch(0.45 0.18 240)" };
    default:
      return undefined;
  }
}

function getTypeStyle(eventType: string): { bg: string; text: string } {
  switch (eventType) {
    case "concert":
      return { bg: "bg-blue-500/10", text: "text-blue-600" };
    case "show":
      return { bg: "bg-purple-500/10", text: "text-purple-600" };
    case "dinner_theater":
      return { bg: "bg-amber-500/10", text: "text-amber-600" };
    case "comedy":
      return { bg: "bg-green-500/10", text: "text-green-600" };
    case "private":
      return { bg: "bg-pink-500/10", text: "text-pink-600" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

export default function EventsPage() {
  const [showPast, setShowPast] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { data: allEvents, isLoading } = trpc.event.list.useQuery();
  const utils = trpc.useUtils();
  const updateEvent = trpc.event.update.useMutation();

  const now = new Date();
  const events = allEvents
    ? showPast
      ? allEvents
      : allEvents.filter((e) => new Date(e.startDate) >= now)
    : [];

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === events.length) return new Set();
      return new Set(events.map((e) => e.id));
    });
  }, [events]);

  const bulkSetHidden = useCallback(
    async (isHidden: boolean) => {
      setBulkUpdating(true);
      try {
        await Promise.all(
          [...selectedIds].map((id) => updateEvent.mutateAsync({ id, isHidden }))
        );
        await utils.event.list.invalidate();
        toast.success(
          isHidden
            ? `Hidden ${selectedIds.size} event(s)`
            : `Shown ${selectedIds.size} event(s)`
        );
        setSelectedIds(new Set());
      } catch (err) {
        toast.error("Failed to update some events");
      } finally {
        setBulkUpdating(false);
      }
    },
    [selectedIds, updateEvent, utils]
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Events</h1>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="size-3.5 rounded"
            />
            <span className="text-sm text-muted-foreground">Show past events</span>
          </label>
        </div>
        <Link href="/events/new" className="admin-gradient-btn px-4 py-2 rounded-lg font-medium inline-flex items-center">
          <Plus className="mr-2 size-4" />
          Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <Calendar className="mx-auto size-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-lg">
            {showPast ? "No events yet." : "No upcoming events."}
          </p>
          {!showPast && allEvents && allEvents.length > 0 && (
            <button
              onClick={() => setShowPast(true)}
              className="text-sm text-primary underline mt-2 cursor-pointer"
            >
              Show past events
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === events.length && events.length > 0}
                    onChange={toggleAll}
                    className="size-3.5 rounded cursor-pointer"
                    aria-label="Select all events"
                  />
                </TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const typeStyle = getTypeStyle(event.eventType);
                return (
                  <TableRow key={event.id} className="table-row-hover cursor-pointer">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(event.id)}
                        onChange={() => toggleId(event.id)}
                        className="size-3.5 rounded cursor-pointer"
                        aria-label={`Select ${event.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/events/${event.id}`}
                        className="font-medium hover:underline"
                      >
                        {event.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.venue.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize ${typeStyle.bg} ${typeStyle.text}`}>
                        {event.eventType.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        style={getStatusStyle(event.status)}
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background/80 backdrop-blur-lg shadow-lg p-3">
          <span className="text-sm font-medium pl-1 tabular-nums">
            {selectedIds.size} selected
          </span>
          <div className="h-5 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkSetHidden(true)}
            disabled={bulkUpdating}
            className="gap-1.5"
          >
            <EyeOff className="size-3.5" />
            Hide {selectedIds.size} event{selectedIds.size !== 1 ? "s" : ""}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkSetHidden(false)}
            disabled={bulkUpdating}
            className="gap-1.5"
          >
            <Eye className="size-3.5" />
            Show {selectedIds.size} event{selectedIds.size !== 1 ? "s" : ""}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
