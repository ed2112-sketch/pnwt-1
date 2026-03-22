"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Download, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
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

function getOrderStatusStyle(status: string) {
  switch (status) {
    case "confirmed":
      return { background: "oklch(0.6 0.18 150 / 12%)", color: "oklch(0.45 0.15 150)" };
    case "pending":
      return { background: "oklch(0.7 0.15 80 / 12%)", color: "oklch(0.55 0.15 80)" };
    case "refunded":
      return { background: "oklch(0.55 0.2 240 / 12%)", color: "oklch(0.45 0.18 240)" };
    default:
      return undefined;
  }
}

export function OrderList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: orders, isLoading } = trpc.order.list.useQuery({
    search: debouncedSearch || undefined,
  });

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!orders) return;
    setSelectedIds((prev) => {
      if (prev.size === orders.length) return new Set();
      return new Set(orders.map((o) => o.id));
    });
  }, [orders]);

  const exportCsv = useCallback(() => {
    if (!orders) return;
    const selected = orders.filter((o) => selectedIds.has(o.id));
    const header = "id,name,email,event,total,status,date";
    const rows = selected.map((o) =>
      [
        o.id,
        `"${(o.name ?? "").replace(/"/g, '""')}"`,
        `"${(o.email ?? "").replace(/"/g, '""')}"`,
        `"${(o.event?.title ?? "").replace(/"/g, '""')}"`,
        (o.totalAmount / 100).toFixed(2),
        o.status,
        new Date(o.createdAt).toISOString().slice(0, 10),
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} orders`);
  }, [orders, selectedIds]);

  const exportEmails = useCallback(() => {
    if (!orders) return;
    const selected = orders.filter((o) => selectedIds.has(o.id));
    const emails = [...new Set(selected.map((o) => o.email).filter(Boolean))].join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${emails.split(", ").length} email(s) to clipboard`);
  }, [orders, selectedIds]);

  // Clear selection when orders change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch]);

  return (
    <div className="animate-fade-in-up">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search orders by name, email, or order #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-xl text-base pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground mt-4">Loading...</p>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-lg border p-12 text-center mt-4">
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="rounded-lg border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === orders.length && orders.length > 0}
                    onChange={toggleAll}
                    className="size-3.5 rounded cursor-pointer"
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="table-row-hover"
                  data-selected={selectedIds.has(order.id) || undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleId(order.id)}
                      className="size-3.5 rounded cursor-pointer"
                      aria-label={`Select order ${order.id.slice(0, 8)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono font-medium hover:underline"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.event?.title ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{order.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          order.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                        style={getOrderStatusStyle(order.status)}
                      >
                        {order.status}
                      </Badge>
                      {order.isComp && (
                        <span
                          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: "oklch(0.55 0.2 300 / 12%)", color: "oklch(0.45 0.18 300)" }}
                        >
                          Comp
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    ${(order.totalAmount / 100).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
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

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-background/80 backdrop-blur-lg shadow-lg p-3">
          <span className="text-sm font-medium pl-1 tabular-nums">
            {selectedIds.size} selected
          </span>
          <div className="h-5 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportEmails} className="gap-1.5">
            <Copy className="size-3.5" />
            Export Emails
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
