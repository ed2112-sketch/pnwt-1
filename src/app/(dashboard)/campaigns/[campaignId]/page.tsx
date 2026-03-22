"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEGMENT_OPTIONS = [
  { value: "all", label: "All Subscribers" },
  { value: "event_attendees", label: "Event Attendees" },
  { value: "vip", label: "VIP Customers" },
  { value: "recent", label: "Recent Customers" },
];

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  scheduled: "default",
  sending: "default",
  sent: "secondary",
  cancelled: "destructive",
};

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: campaign, isLoading } = trpc.emailCampaign.getById.useQuery({
    id: campaignId,
  });
  const { data: events } = trpc.event.list.useQuery();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [segmentType, setSegmentType] = useState("all");
  const [eventId, setEventId] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form fields when campaign loads
  if (campaign && !initialized) {
    setTitle(campaign.title);
    setSubject(campaign.subject);
    setPreviewText(campaign.previewText ?? "");
    const filter = campaign.segmentFilter as { type?: string; eventId?: string } | null;
    setSegmentType(filter?.type ?? "all");
    setEventId(filter?.eventId ?? "");
    setHtmlContent(campaign.htmlContent ?? "");
    setInitialized(true);
  }

  const update = trpc.emailCampaign.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign updated!");
      utils.emailCampaign.getById.invalidate({ id: campaignId });
      utils.emailCampaign.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const send = trpc.emailCampaign.send.useMutation({
    onSuccess: () => {
      toast.success("Campaign sent!");
      utils.emailCampaign.getById.invalidate({ id: campaignId });
      utils.emailCampaign.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCampaign = trpc.emailCampaign.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted.");
      utils.emailCampaign.list.invalidate();
      router.push("/campaigns");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      id: campaignId,
      title,
      subject,
      previewText: previewText || undefined,
      segmentFilter: {
        type: segmentType as "all" | "event" | "vip" | "recent",
        eventId: segmentType === "event_attendees" ? eventId : undefined,
      },
      htmlContent,
    });
  }

  async function handleSend() {
    await send.mutateAsync({ id: campaignId });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    deleteCampaign.mutate({ id: campaignId });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Campaign not found.</p>
      </div>
    );
  }

  const isDraft = campaign.status === "draft";

  // Sent / non-draft: read-only view
  if (!isDraft) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <Badge variant={statusVariant[campaign.status] ?? "secondary"}>
              {campaign.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Recipients</p>
              <p className="text-2xl font-bold">{campaign.recipientCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold">{campaign.sentCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sent At</p>
              <p className="text-lg font-medium">
                {campaign.sentAt
                  ? new Date(campaign.sentAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "---"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{campaign.subject}</p>
            {campaign.previewText && (
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.previewText}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              srcDoc={campaign.htmlContent ?? "<p>No content</p>"}
              className="h-[400px] w-full rounded border bg-white"
              title="Email preview"
              sandbox=""
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Draft: editable form
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
          <Badge variant="secondary">draft</Badge>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleteCampaign.isPending}
        >
          {deleteCampaign.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Title</Label>
              <Input
                id="campaign-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-subject">Subject</Label>
              <Input
                id="campaign-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-preview">Preview Text</Label>
              <Input
                id="campaign-preview"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Segment</Label>
              <Select
                value={segmentType}
                onValueChange={(v) => setSegmentType(v ?? "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
              <Label htmlFor="campaign-html">HTML Content</Label>
              <Textarea
                id="campaign-html"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={send.isPending}
                onClick={handleSend}
              >
                {send.isPending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe
            srcDoc={htmlContent || "<p style='color:#888;padding:20px;'>No content yet.</p>"}
            className="h-[400px] w-full rounded border bg-white"
            title="Email preview"
            sandbox=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
