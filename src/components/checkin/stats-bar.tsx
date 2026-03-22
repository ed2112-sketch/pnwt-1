"use client";

interface StatsBarProps {
  checkedIn: number;
  remaining: number;
  total: number;
  rate: number;
}

export function StatsBar({ checkedIn, remaining, total, rate }: StatsBarProps) {
  const active = checkedIn + remaining;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{checkedIn}</p>
          <p className="text-xs text-muted-foreground">Checked In</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{remaining}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-muted-foreground">{active}</p>
          <p className="text-xs text-muted-foreground">Total Active</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{rate}%</p>
          <p className="text-xs text-muted-foreground">Rate</p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-600 transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
