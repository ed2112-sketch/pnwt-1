"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
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

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  scheduled: "default",
  sending: "default",
  sent: "secondary",
  cancelled: "destructive",
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = trpc.emailCampaign.list.useQuery();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button render={<Link href="/campaigns/new" />}>Create Campaign</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No campaigns yet.</p>
            <Button render={<Link href="/campaigns/new" />} className="mt-4">
              Create your first campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {campaign.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[campaign.status] ?? "secondary"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.recipientCount ?? 0}</TableCell>
                  <TableCell>{campaign.sentCount ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleDateString("en-US", {
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
    </div>
  );
}
