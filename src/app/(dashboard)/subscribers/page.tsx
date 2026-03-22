"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";

export default function SubscribersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const utils = trpc.useUtils();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: subscribers, isLoading } = trpc.emailSubscriber.list.useQuery({
    search: debouncedSearch || undefined,
  });

  const sync = trpc.emailSubscriber.syncFromOrders.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.newSubscribers} new subscriber${data.newSubscribers === 1 ? "" : "s"} from orders`);
      utils.emailSubscriber.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addManual = trpc.emailSubscriber.addManual.useMutation({
    onSuccess: () => {
      toast.success("Subscriber added!");
      setNewEmail("");
      setNewName("");
      utils.emailSubscriber.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = trpc.emailSubscriber.remove.useMutation({
    onSuccess: () => {
      toast.success("Subscriber removed.");
      utils.emailSubscriber.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;
    addManual.mutate({ email: newEmail, name: newName || undefined });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <Button
          variant="outline"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
        >
          <RefreshCw className={`mr-1 size-4 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "Syncing..." : "Sync from Orders"}
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by email or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Add subscriber inline form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="subscriber@example.com"
                required
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <Button type="submit" disabled={addManual.isPending}>
              <UserPlus className="mr-1 size-4" />
              {addManual.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !subscribers || subscribers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No subscribers found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.name ?? "---"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.isSubscribed ? "default" : "destructive"}>
                      {sub.isSubscribed ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate({ id: sub.id })}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
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
