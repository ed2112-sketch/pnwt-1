"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
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

function csvEscape(val: string, sep: string): string {
  if (val.includes(sep) || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type TimeRange = "7d" | "30d" | "90d" | "ytd" | "1y" | "all";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "ytd", label: "Year to Date" },
  { value: "1y", label: "Last Year" },
  { value: "all", label: "All Time" },
];

function getDateRange(range: TimeRange): { start: Date; end: Date; granularity: "day" | "week" | "month" } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case "7d":
      start.setDate(start.getDate() - 7);
      return { start, end, granularity: "day" };
    case "30d":
      start.setDate(start.getDate() - 30);
      return { start, end, granularity: "day" };
    case "90d":
      start.setDate(start.getDate() - 90);
      return { start, end, granularity: "week" };
    case "ytd":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end, granularity: "month" };
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      return { start, end, granularity: "month" };
    case "all":
      start.setFullYear(2020, 0, 1);
      return { start, end, granularity: "month" };
  }
}

function formatPeriodLabel(period: string, granularity: "day" | "week" | "month"): string {
  const d = new Date(period);
  if (granularity === "day") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (granularity === "week") return `Wk ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [hoveredBar, setHoveredBar] = useState<{ index: number; x: number; y: number } | null>(null);
  const [customerLimit, setCustomerLimit] = useState(10);
  const [customerSort, setCustomerSort] = useState<"orders" | "spent">("orders");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportCols, setExportCols] = useState({ rank: true, name: true, email: true, spent: true, orders: true, lastOrder: true });
  const [exportFormat, setExportFormat] = useState<"csv" | "tsv" | "emails">("csv");

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success("Email copied");
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  const { start, end, granularity } = useMemo(() => getDateRange(range), [range]);

  const { data: revenueData, isLoading: revenueLoading } =
    trpc.analytics.revenueByPeriod.useQuery({
      startDate: start,
      endDate: end,
      granularity,
    });

  const { data: promos, isLoading: promosLoading } =
    trpc.analytics.promoEffectiveness.useQuery();

  const { data: customerOverview, isLoading: customerOverviewLoading } =
    trpc.analytics.customerOverview.useQuery({ limit: customerLimit, sortBy: customerSort });

  const { data: customerSegments, isLoading: segmentsLoading } =
    trpc.analytics.customerSegments.useQuery();

  const maxRevenue = revenueData
    ? Math.max(...revenueData.map((d) => d.revenue ?? 0), 1)
    : 1;

  const periodTotal = revenueData
    ? revenueData.reduce((sum, d) => sum + (d.revenue ?? 0), 0)
    : 0;

  const periodOrders = revenueData
    ? revenueData.reduce((sum, d) => sum + (d.orders ?? 0), 0)
    : 0;

  const periodAvg = periodOrders > 0 ? Math.round(periodTotal / periodOrders) : 0;

  function handleExport() {
    if (!customerOverview || customerOverview.length === 0) return;

    if (exportFormat === "emails") {
      const emails = customerOverview.map((c) => c.email).join("\n");
      downloadFile(emails, "customers-emails.txt", "text/plain");
      toast.success(`Exported ${customerOverview.length} emails`);
      setShowExport(false);
      return;
    }

    const sep = exportFormat === "csv" ? "," : "\t";
    const ext = exportFormat === "csv" ? "csv" : "tsv";
    const headers: string[] = [];
    if (exportCols.rank) headers.push("Rank");
    if (exportCols.name) headers.push("Name");
    if (exportCols.email) headers.push("Email");
    if (exportCols.spent) headers.push("Total Spent");
    if (exportCols.orders) headers.push("Orders");
    if (exportCols.lastOrder) headers.push("Last Order");

    const rows = customerOverview.map((c, i) => {
      const row: string[] = [];
      if (exportCols.rank) row.push(String(i + 1));
      if (exportCols.name) row.push(csvEscape(c.name ?? "", sep));
      if (exportCols.email) row.push(csvEscape(c.email, sep));
      if (exportCols.spent) row.push(formatPrice(c.totalSpent ?? 0));
      if (exportCols.orders) row.push(String(c.orderCount ?? 0));
      if (exportCols.lastOrder) row.push(c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "");
      return row.join(sep);
    });

    const content = [headers.join(sep), ...rows].join("\n");
    downloadFile(content, `top-customers.${ext}`, exportFormat === "csv" ? "text/csv" : "text/tab-separated-values");
    toast.success(`Exported ${customerOverview.length} customers as ${ext.toUpperCase()}`);
    setShowExport(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-in-up">
      {/* Header with time range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                range === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Stats — derived from revenue data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="admin-card admin-stat-card admin-stat-card-green">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{formatPrice(periodTotal)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="admin-card admin-stat-card admin-stat-card-blue">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{periodOrders}</p>
            )}
          </CardContent>
        </Card>
        <Card className="admin-card admin-stat-card admin-stat-card-amber">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Order</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{formatPrice(periodAvg)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="admin-card admin-stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-8 w-12 bg-muted rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{revenueData?.length ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <div className="flex items-end gap-1 animate-pulse" style={{ height: 240 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-muted rounded-t"
                  style={{ height: `${Math.random() * 60 + 10}%` }}
                />
              ))}
            </div>
          ) : revenueData && revenueData.length > 0 ? (
            <div className="relative">
              <div
                className="flex items-end gap-[2px]"
                style={{ height: 240 }}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {revenueData.map((d, i) => {
                  const height = ((d.revenue ?? 0) / maxRevenue) * 100;
                  const isHovered = hoveredBar?.index === i;
                  return (
                    <div
                      key={i}
                      className="flex-1 relative"
                      style={{ height: "100%" }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({
                          index: i,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t transition-all duration-150 cursor-pointer"
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          background: isHovered
                            ? "linear-gradient(to top, oklch(0.5 0.22 270), oklch(0.6 0.2 300))"
                            : "linear-gradient(to top, oklch(0.45 0.2 270), oklch(0.55 0.18 300))",
                          opacity: hoveredBar !== null && !isHovered ? 0.5 : 1,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Hover tooltip */}
              {hoveredBar !== null && revenueData[hoveredBar.index] && (
                <div
                  className="absolute z-10 pointer-events-none px-3 py-2 rounded-lg shadow-lg text-xs"
                  style={{
                    bottom: `calc(${Math.max(((revenueData[hoveredBar.index].revenue ?? 0) / maxRevenue) * 100, 10)}% + 12px)`,
                    left: `${(hoveredBar.index / revenueData.length) * 100}%`,
                    transform: "translateX(-50%)",
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                >
                  <p className="font-semibold text-sm">
                    {formatPrice(revenueData[hoveredBar.index].revenue ?? 0)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatPeriodLabel(revenueData[hoveredBar.index].period, granularity)}
                    {" · "}
                    {revenueData[hoveredBar.index].orders} order{revenueData[hoveredBar.index].orders !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                <span>{formatPeriodLabel(revenueData[0].period, granularity)}</span>
                {revenueData.length > 2 && (
                  <span>{formatPeriodLabel(revenueData[Math.floor(revenueData.length / 2)].period, granularity)}</span>
                )}
                <span>{formatPeriodLabel(revenueData[revenueData.length - 1].period, granularity)}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              No revenue data for this period.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Customers */}
      <h2 className="text-xl font-bold mt-2">Customers</h2>

      {/* Customer Segments */}
      {segmentsLoading ? (
        <p className="text-muted-foreground">Loading segments...</p>
      ) : customerSegments ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="admin-card admin-stat-card admin-stat-card-amber">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">VIP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customerSegments.vip ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="admin-card admin-stat-card admin-stat-card-blue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Regular</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customerSegments.regular ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="admin-card admin-stat-card admin-stat-card-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customerSegments.new ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="admin-card admin-stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customerSegments.inactive ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Top Customers */}
      <Card className="admin-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-base">Top Customers</CardTitle>
            <div className="flex items-center gap-3">
              {/* Sort toggle */}
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <button
                  onClick={() => setCustomerSort("orders")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    customerSort === "orders"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  By Orders
                </button>
                <button
                  onClick={() => setCustomerSort("spent")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    customerSort === "spent"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  By Spent
                </button>
              </div>
              {/* Limit selector */}
              <div className="flex items-center gap-1 rounded-lg border p-1">
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCustomerLimit(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      customerLimit === n
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {/* Export button */}
              <button
                onClick={() => setShowExport(!showExport)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Download className="size-3.5" />
                Export
              </button>
            </div>
          </div>
        </CardHeader>
        {/* Export panel */}
        {showExport && (
          <div className="px-6 pb-4">
            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Export Options</p>
              {/* Format */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Format</p>
                <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
                  {([["csv", "CSV"], ["tsv", "TSV"], ["emails", "Emails Only"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setExportFormat(val)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        exportFormat === val
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Columns (only for CSV/TSV) */}
              {exportFormat !== "emails" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Columns</p>
                  <div className="flex flex-wrap gap-3">
                    {([
                      ["rank", "Rank"],
                      ["name", "Name"],
                      ["email", "Email"],
                      ["spent", "Total Spent"],
                      ["orders", "Orders"],
                      ["lastOrder", "Last Order"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportCols[key]}
                          onChange={(e) => setExportCols((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="size-3.5 rounded"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="admin-gradient-btn px-4 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  Download {exportFormat === "emails" ? `${customerOverview?.length ?? 0} emails` : exportFormat.toUpperCase()}
                </button>
                <button
                  onClick={() => {
                    if (!customerOverview) return;
                    const emails = customerOverview.map((c) => c.email).join(", ");
                    navigator.clipboard.writeText(emails);
                    toast.success(`Copied ${customerOverview.length} emails to clipboard`);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  Copy all emails
                </button>
              </div>
            </div>
          </div>
        )}
        <CardContent>
          {customerOverviewLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : customerOverview && customerOverview.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOverview.map((customer, index) => (
                    <TableRow key={customer.email} className="table-row-hover">
                      <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 group/email">
                          <span className="text-muted-foreground">{customer.email}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyEmail(customer.email); }}
                            className="opacity-0 group-hover/email:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-foreground"
                            title="Copy email"
                          >
                            {copiedEmail === customer.email ? (
                              <Check className="size-3.5 text-green-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(customer.totalSpent ?? 0)}</TableCell>
                      <TableCell>{customer.orderCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.lastOrderAt
                          ? new Date(customer.lastOrderAt).toLocaleDateString()
                          : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No customer data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Promo Effectiveness — bottom */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">Promo Code Effectiveness</CardTitle>
        </CardHeader>
        <CardContent>
          {promosLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : promos && promos.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Total Discount</TableHead>
                    <TableHead>Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.map((promo) => (
                    <TableRow key={promo.code} className="table-row-hover">
                      <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                      <TableCell>{promo.usageCount}</TableCell>
                      <TableCell>{formatPrice(promo.totalDiscount)}</TableCell>
                      <TableCell>{formatPrice(promo.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No promo code data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
