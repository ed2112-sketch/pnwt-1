"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { getMonthGrid, isSameDay } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  concert: { bg: "bg-blue-500/15", text: "text-blue-600" },
  show: { bg: "bg-purple-500/15", text: "text-purple-600" },
  dinner_theater: { bg: "bg-amber-500/15", text: "text-amber-600" },
  comedy: { bg: "bg-green-500/15", text: "text-green-600" },
  private: { bg: "bg-pink-500/15", text: "text-pink-600" },
  other: { bg: "bg-muted", text: "text-muted-foreground" },
};

interface Venue {
  id: string;
  name: string;
}

export function EventCalendar({ venues }: { venues: Venue[] }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [venueId, setVenueId] = useState<string>("");

  const { data: events } = trpc.event.listForCalendar.useQuery({
    month,
    year,
    venueId: venueId || undefined,
  });

  const weeks = getMonthGrid(year, month);
  const today = new Date();

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function isEventToday(eventStartDate: string | Date): boolean {
    const eventDate = new Date(eventStartDate);
    return isSameDay(eventDate, today);
  }

  function getEventHref(eventId: string, eventStartDate: string | Date): string {
    if (isEventToday(eventStartDate)) {
      return `/events/${eventId}/checkin`;
    }
    return `/events/${eventId}`;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Select value={venueId} onValueChange={(v) => setVenueId(v ?? "")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Venues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Venues</SelectItem>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day, di) => {
              const dayEvents = events?.filter((e) =>
                isSameDay(new Date(e.startDate), day.date)
              );
              const isToday = isSameDay(day.date, today);

              return (
                <div
                  key={di}
                  className={cn(
                    "min-h-[110px] p-2 border-r last:border-r-0",
                    !day.isCurrentMonth && "bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs mb-1",
                      !day.isCurrentMonth && "text-muted-foreground/50",
                      isToday &&
                        "font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center"
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayEvents?.slice(0, 3).map((event) => {
                      const colors = EVENT_TYPE_COLORS[event.eventType] ?? EVENT_TYPE_COLORS.other;
                      const eventIsToday = isEventToday(event.startDate);
                      return (
                        <Link
                          key={event.id}
                          href={getEventHref(event.id, event.startDate)}
                          className={cn(
                            "block truncate rounded-md px-1.5 py-1 text-xs font-medium leading-snug transition-opacity hover:opacity-80",
                            colors.bg,
                            colors.text,
                            eventIsToday && "ring-2 ring-primary/40 ring-offset-1"
                          )}
                        >
                          {eventIsToday && (
                            <span className="inline-block size-1.5 rounded-full bg-current mr-1 align-middle" />
                          )}
                          {event.title}
                        </Link>
                      );
                    })}
                    {dayEvents && dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground px-1.5">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
