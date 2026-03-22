"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const eventTypes = [
  { value: "concert", label: "Concert" },
  { value: "show", label: "Show" },
  { value: "dinner_theater", label: "Dinner Theater" },
  { value: "comedy", label: "Comedy" },
  { value: "private", label: "Private" },
  { value: "other", label: "Other" },
] as const;

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVenueId = searchParams.get("venueId") ?? "";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: venues } = trpc.venue.list.useQuery();

  const create = trpc.event.create.useMutation({
    onSuccess: (event) => {
      toast.success("Event created!");
      router.push(`/events/${event.id}`);
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    create.mutate({
      venueId: fd.get("venueId") as string,
      title,
      slug: slug || undefined,
      eventType: (fd.get("eventType") as any) ?? "other",
      description: (fd.get("description") as string) || undefined,
      shortDescription: (fd.get("shortDescription") as string) || undefined,
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      doorsOpen: fd.get("doorsOpen")
        ? new Date(fd.get("doorsOpen") as string)
        : undefined,
      isFeatured: fd.get("isFeatured") === "on",
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Create Event</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Friday Night Jazz"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="e.g. friday-night-jazz"
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-xs text-muted-foreground">
                Public link: /e/{slug || "..."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueId">Venue</Label>
              <Select name="venueId" defaultValue={preselectedVenueId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event type</Label>
              <Select name="eventType" defaultValue="other">
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
              <Label htmlFor="shortDescription">Short description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea id="description" name="description" rows={4} />
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doorsOpen">Doors open</Label>
              <Input id="doorsOpen" name="doorsOpen" type="datetime-local" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={create.isPending} className="w-full">
          {create.isPending ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewEventForm />
    </Suspense>
  );
}
