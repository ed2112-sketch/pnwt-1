"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const eventTypes = [
  { value: "concert", label: "Concert" },
  { value: "show", label: "Show" },
  { value: "dinner_theater", label: "Dinner Theater" },
  { value: "comedy", label: "Comedy" },
  { value: "private", label: "Private" },
  { value: "other", label: "Other" },
] as const;

const statuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
] as const;

function toLocalDatetime(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const { data: event, isLoading } = trpc.event.getById.useQuery({ id: eventId });

  const update = trpc.event.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated!");
      router.push(`/events/${eventId}`);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    update.mutate({
      id: eventId,
      title: fd.get("title") as string,
      slug: (fd.get("slug") as string) || undefined,
      eventType: fd.get("eventType") as any,
      status: fd.get("status") as any,
      shortDescription: (fd.get("shortDescription") as string) || null,
      description: (fd.get("description") as string) || null,
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      doorsOpen: fd.get("doorsOpen")
        ? new Date(fd.get("doorsOpen") as string)
        : null,
      isFeatured: fd.get("isFeatured") === "on",
      isHidden: fd.get("isHidden") === "on",
    });
  }

  if (isLoading || !event) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Edit Event</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={event.title} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={event.slug}
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-xs text-muted-foreground">
                Public link: /e/{event.slug}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Type</Label>
                <Select name="eventType" defaultValue={event.eventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={event.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                maxLength={300}
                defaultValue={event.shortDescription ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={event.description ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  defaultValue={toLocalDatetime(event.startDate)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  defaultValue={toLocalDatetime(event.endDate)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doorsOpen">Doors open</Label>
              <Input
                id="doorsOpen"
                name="doorsOpen"
                type="datetime-local"
                defaultValue={event.doorsOpen ? toLocalDatetime(event.doorsOpen) : ""}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isHidden"
                defaultChecked={event.isHidden}
                className="size-4 rounded"
              />
              <span className="text-sm font-medium">Hide from discovery</span>
              <span className="text-xs text-muted-foreground">
                Event stays accessible via direct link but won&apos;t appear on homepage or browse pages
              </span>
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending} className="flex-1">
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
