"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

const SEGMENT_OPTIONS = [
  { value: "all", label: "All Subscribers" },
  { value: "event_attendees", label: "Event Attendees" },
  { value: "vip", label: "VIP Customers" },
  { value: "recent", label: "Recent Customers" },
];

const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Your Event is Coming Up!</h1>
  <p>We're excited to see you at the show.</p>
  <a href="#">View Your Tickets</a>
</body>
</html>`;

export default function NewCampaignPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [segmentType, setSegmentType] = useState("all");
  const [eventId, setEventId] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  const { data: events } = trpc.event.list.useQuery();

  const create = trpc.emailCampaign.create.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const send = trpc.emailCampaign.send.useMutation({
    onError: (err) => toast.error(err.message),
  });

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    const result = await create.mutateAsync({
      title,
      subject,
      previewText: previewText || undefined,
      segmentFilter: {
        type: segmentType as "all" | "event" | "vip" | "recent",
        eventId: segmentType === "event_attendees" ? eventId : undefined,
      },
      htmlContent,
    });
    toast.success("Campaign saved as draft!");
    router.push("/campaigns");
  }

  async function handleSendNow(e: React.FormEvent) {
    e.preventDefault();
    const result = await create.mutateAsync({
      title,
      subject,
      previewText: previewText || undefined,
      segmentFilter: {
        type: segmentType as "all" | "event" | "vip" | "recent",
        eventId: segmentType === "event_attendees" ? eventId : undefined,
      },
      htmlContent,
    });
    await send.mutateAsync({ id: result.id });
    toast.success("Campaign sent!");
    router.push("/campaigns");
  }

  const isPending = create.isPending || send.isPending;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Create Campaign</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveDraft} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Title</Label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Monthly newsletter"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-subject">Subject</Label>
              <Input
                id="campaign-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Don't miss our upcoming events!"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-preview">Preview Text</Label>
              <Input
                id="campaign-preview"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Shown in email clients next to the subject line"
              />
            </div>

            <div className="space-y-2">
              <Label>Segment</Label>
              <Select
                value={segmentType}
                onValueChange={(v) => setSegmentType(v ?? "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {segmentType === "event_attendees" && (
              <div className="space-y-2">
                <Label>Event</Label>
                <Select
                  value={eventId}
                  onValueChange={(v) => setEventId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="campaign-html">HTML Content</Label>
                <Dialog>
                  <DialogTrigger>
                    <Button type="button" variant="outline" size="sm">
                      <Eye className="mr-1 size-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Email Preview</DialogTitle>
                    </DialogHeader>
                    <iframe
                      srcDoc={htmlContent || "<p style='color:#888;padding:20px;'>No content yet.</p>"}
                      className="h-[400px] w-full rounded border bg-white"
                      title="Email preview"
                      sandbox=""
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                id="campaign-html"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder={PLACEHOLDER_HTML}
                rows={12}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {create.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleSendNow}
              >
                {send.isPending ? "Sending..." : "Send Now"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/campaigns")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
