"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const { data, isLoading } = trpc.analytics.eventBreakdown.useQuery({
    eventId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    );
  }

  const revenueByType = data.revenueByType ?? [];
  const totalRevenue = revenueByType.reduce((sum, tt) => sum + tt.totalRevenue, 0);
  const totalAttendance =
    data.attendance.checkedIn +
    data.attendance.noShows +
    data.attendance.cancelled;
  const attendanceRate =
    data.attendance.total > 0
      ? Math.round((data.attendance.checkedIn / data.attendance.total) * 100)
      : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Event Analytics</h1>

      {/* Attendance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.attendance.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.attendance.checkedIn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              No-Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.attendance.noShows}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.attendance.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-bold">{attendanceRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Ticket Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByType.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByType.map((tt) => (
                    <TableRow key={tt.ticketTypeName}>
                      <TableCell className="font-medium">{tt.ticketTypeName}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{formatPrice(tt.totalRevenue)}</TableCell>
                      <TableCell>
                        {totalRevenue > 0
                          ? `${Math.round((tt.totalRevenue / totalRevenue) * 100)}%`
                          : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No ticket type data yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
