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

export default function SurveysPage() {
  const { data: surveys, isLoading } = trpc.survey.list.useQuery();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Surveys</h1>
        <Button render={<Link href="/surveys/new" />}>Create Survey</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !surveys || surveys.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No surveys yet.</p>
            <Button render={<Link href="/surveys/new" />} className="mt-4">
              Create your first survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>
                    <Link
                      href={`/surveys/${survey.id}`}
                      className="font-medium hover:underline"
                    >
                      {survey.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {survey.eventTitle ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        survey.status === "active"
                          ? "default"
                          : survey.status === "closed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {survey.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{survey.responseCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(survey.createdAt).toLocaleDateString("en-US", {
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
