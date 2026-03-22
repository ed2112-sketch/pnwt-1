"use client";

import { Badge } from "@/components/ui/badge";

interface RecentEntry {
  id: string;
  attendeeName: string;
  ticketNumber: string;
  checkedInAt: Date | null;
  ticketType: { name: string };
}

interface RecentLogProps {
  entries: RecentEntry[];
}

export function RecentLog({ entries }: RecentLogProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No check-ins yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="font-medium text-sm">{entry.attendeeName}</p>
            <p className="text-xs text-muted-foreground">
              {entry.ticketNumber}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary">{entry.ticketType.name}</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {entry.checkedInAt
                ? new Date(entry.checkedInAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
