import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Ticket,
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/server/auth";
import { serverTRPC } from "@/lib/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTypeColor(type: string) {
  switch (type) {
    case "concert": return "bg-blue-500/10 text-blue-600";
    case "show": return "bg-purple-500/10 text-purple-600";
    case "dinner_theater": return "bg-amber-500/10 text-amber-600";
    case "comedy": return "bg-green-500/10 text-green-600";
    case "private": return "bg-pink-500/10 text-pink-600";
    default: return "bg-muted text-muted-foreground";
  }
}

export default async function DashboardPage() {
  const [session, trpc] = await Promise.all([auth(), serverTRPC()]);
  const user = session?.user;

  const [venues, events, orderData] = await Promise.all([
    trpc.venue.list(),
    trpc.event.list(),
    trpc.order.list(),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  // Today's events — most important for day-of operations
  const todaysEvents = events
    .filter((e) => {
      const d = new Date(e.startDate);
      return d >= todayStart && d < todayEnd && e.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Upcoming events
  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= now && e.status !== "cancelled")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const nextEvent = upcomingEvents[0];
  const activeVenues = venues.filter((v) => v.isActive);

  // This month events
  const thisMonthEvents = events.filter((e) => {
    const d = new Date(e.startDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Revenue stats from orders
  const confirmedOrders = orderData?.filter((o) => o.status === "confirmed") ?? [];
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const recentOrders = confirmedOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Time until next event
  let nextEventCountdown = "";
  if (nextEvent) {
    const diff = new Date(nextEvent.startDate).getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) nextEventCountdown = `${days}d ${hours}h`;
    else if (hours > 0) nextEventCountdown = `${hours}h`;
    else nextEventCountdown = "Today";
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="admin-gradient-btn" render={<Link href="/events/new" />}>
            <Plus className="mr-2 size-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Today's Events — highlighted if any */}
      {todaysEvents.length > 0 && (
        <Card className="admin-card border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              Today&apos;s Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-4 bg-background"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center shrink-0">
                      <p className="text-lg font-bold leading-none">
                        {new Date(event.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                        {event.doorsOpen
                          ? `Doors ${new Date(event.doorsOpen).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                          : ""}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.venue.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/events/${event.id}/checkin`}
                      className="admin-gradient-btn px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      Check-in
                    </Link>
                    <Link
                      href={`/events/${event.id}/runsheet`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Runsheet
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row — 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="admin-card admin-stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <div className="icon-circle icon-circle-indigo">
              <Ticket className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{upcomingEvents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{thisMonthEvents.length} this month</p>
          </CardContent>
        </Card>

        <Card className="admin-card admin-stat-card admin-stat-card-green">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="icon-circle icon-circle-green">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{formatPrice(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{confirmedOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card className="admin-card admin-stat-card admin-stat-card-blue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Venues</CardTitle>
            <div className="icon-circle icon-circle-blue">
              <MapPin className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{activeVenues.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{venues.length} total</p>
          </CardContent>
        </Card>

        <Card className="admin-card admin-stat-card admin-stat-card-amber">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Event</CardTitle>
            <div className="icon-circle icon-circle-amber">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{nextEventCountdown || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextEvent ? nextEvent.title : "No events scheduled"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Left — Upcoming Events */}
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/events" />}>
              View all <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="mx-auto size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
                <Link href="/events/new" className="text-sm text-primary hover:underline mt-1 inline-block">
                  Create one
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3.5 table-row-hover transition-all duration-150"
                  >
                    {/* Date block */}
                    <div className="text-center shrink-0 w-12">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p className="text-xl font-bold leading-none">
                        {new Date(event.startDate).getDate()}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[15px] leading-snug truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.venue.name} &middot;{" "}
                        {new Date(event.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Type + Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${getTypeColor(event.eventType)}`}>
                        {event.eventType.replace("_", " ")}
                      </span>
                      <Badge
                        className={event.status === "published" ? "badge-success" : "badge-warning"}
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="admin-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/orders" />}>
                All orders <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>
              ) : (
                <div className="space-y-0">
                  {recentOrders.map((order, i) => {
                    const isComp = order.isComp;
                    const timeAgo = getTimeAgo(new Date(order.createdAt));
                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-start gap-3 py-3 table-row-hover rounded-md px-2 -mx-2 transition-all duration-150"
                      >
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isComp ? "bg-purple-500/10 text-purple-600" : "badge-success"}`}>
                          {isComp ? "C" : "$"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">{order.name}</span>
                            {isComp ? " received comp tickets" : ` ordered ${formatPrice(order.totalAmount)}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.event.title} &middot; {timeAgo}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/events/new", label: "Create Event", icon: Plus, desc: "Add a new show or experience" },
                { href: "/analytics", label: "View Analytics", icon: TrendingUp, desc: "Revenue and customer insights" },
                { href: "/settings/widget", label: "Embed Widget", icon: Ticket, desc: "Add tickets to your website" },
                { href: "/campaigns/new", label: "Send Campaign", icon: Users, desc: "Email your subscribers" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border p-3 table-row-hover transition-all duration-150"
                >
                  <div className="icon-circle icon-circle-indigo shrink-0">
                    <action.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
