"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, Code, ExternalLink, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { data: org, isLoading } = trpc.organization.get.useQuery();
  const { data: venues } = trpc.venue.list.useQuery();

  const update = trpc.organization.update.useMutation({
    onSuccess: () => toast.success("Settings saved!"),
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    update.mutate({
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      timezone: fd.get("timezone") as string,
    });
  }

  if (isLoading || !org) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const firstVenue = venues?.[0];
  const venueSettings = firstVenue?.settings as
    | { taxRate?: number; serviceChargePercent?: number; autoGratuityPercent?: number }
    | undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
      {/* Widget link */}
      <Link
        href="/settings/widget"
        className="admin-card rounded-lg border p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
      >
        <div>
          <p className="font-medium text-sm">Embeddable Widget</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add a ticket widget to any website with a single script tag
          </p>
        </div>
        <Code className="size-5 text-muted-foreground" />
      </Link>
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={org.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={org.slug}
                required
                pattern="^[a-z0-9-]+$"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={org.timezone}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>

      {/* Default Venue Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Venue Settings</CardTitle>
          <CardDescription>
            Showing settings from {firstVenue?.name ?? "your first venue"}.
            {firstVenue && (
              <Link
                href={`/venues/${firstVenue.id}`}
                className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
              >
                Edit venue <ExternalLink className="size-3" />
              </Link>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate</Label>
              <Input
                value={venueSettings?.taxRate != null ? `${venueSettings.taxRate}%` : "Not set"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Charge</Label>
              <Input
                value={
                  venueSettings?.serviceChargePercent != null
                    ? `${venueSettings.serviceChargePercent}%`
                    : "Not set"
                }
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-Gratuity</Label>
              <Input
                value={
                  venueSettings?.autoGratuityPercent != null
                    ? `${venueSettings.autoGratuityPercent}%`
                    : "Not set"
                }
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Stripe</p>
              <p className="text-xs text-muted-foreground">Payment processing</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not connected</Badge>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Resend Email</p>
              <p className="text-xs text-muted-foreground">Transactional email delivery</p>
            </div>
            <Badge
              variant="secondary"
              style={{ background: "oklch(0.6 0.18 150 / 12%)", color: "oklch(0.45 0.15 150)" }}
            >
              Configured
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete all test data</p>
              <p className="text-xs text-muted-foreground">
                Remove all imported/test data and start fresh. Contact support to enable.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <SyncFromHiEvents />
    </div>
  );
}

function SyncFromHiEvents() {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalStats, setFinalStats] = useState<Record<string, number> | null>(null);
  const logEndRef = { current: null as HTMLDivElement | null };

  async function handleSync() {
    setSyncing(true);
    setLogs([]);
    setFinalStats(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });

      if (!res.ok || !res.body) {
        toast.error("Sync failed");
        setSyncing(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "done") {
              setFinalStats(data.stats);
              const total = data.stats.events + data.stats.ticketTypes + data.stats.orders + data.stats.orderItems + data.stats.tickets;
              toast.success(total === 0 ? "Already up to date!" : `Synced ${total} new records`);
            } else if (data.type === "stats") {
              // Intermediate stats update — skip
            } else if (data.message) {
              setLogs((prev) => [...prev, data.message]);
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch {
      toast.error("Connection to sync endpoint failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="text-base">Sync from Hi.Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pull the latest events, orders, and attendees from your Hi.Events database into PNWTickets.
          Existing records are skipped — only new data is imported.
        </p>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className={syncing ? "" : "admin-gradient-btn"}
        >
          <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>

        {/* Live log output */}
        {logs.length > 0 && (
          <div
            className="rounded-lg border p-3 max-h-72 overflow-y-auto font-mono text-xs leading-relaxed"
            style={{ background: "oklch(0.13 0.01 270)", color: "oklch(0.8 0.05 150)" }}
          >
            {logs.map((log, i) => (
              <div key={i} className={log.startsWith("ERROR") ? "text-red-400" : log.startsWith("\u2713") ? "text-green-400" : ""}>
                {log}
              </div>
            ))}
            {syncing && (
              <div className="text-yellow-400 animate-pulse">▋</div>
            )}
            <div ref={(el) => { logEndRef.current = el; el?.scrollIntoView({ behavior: "smooth" }); }} />
          </div>
        )}

        {/* Final stats badges */}
        {finalStats && (
          <div className="text-sm space-y-1 pt-2">
            <p className="font-medium">Sync complete:</p>
            <div className="flex flex-wrap gap-2">
              {finalStats.events > 0 && <Badge className="badge-info">{finalStats.events} events</Badge>}
              {finalStats.ticketTypes > 0 && <Badge className="badge-info">{finalStats.ticketTypes} ticket types</Badge>}
              {finalStats.orders > 0 && <Badge className="badge-success">{finalStats.orders} orders</Badge>}
              {finalStats.orderItems > 0 && <Badge className="badge-success">{finalStats.orderItems} items</Badge>}
              {finalStats.tickets > 0 && <Badge className="badge-success">{finalStats.tickets} tickets</Badge>}
              {finalStats.skipped > 0 && <Badge className="badge-warning">{finalStats.skipped} skipped</Badge>}
              {Object.values(finalStats).every((v) => v === 0) && <Badge>Everything up to date</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
