"use client";

import { use } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);
  const utils = trpc.useUtils();

  const { data: survey, isLoading } = trpc.survey.getById.useQuery({
    id: surveyId,
  });
  const { data: results } = trpc.survey.getResults.useQuery({ surveyId });

  const update = trpc.survey.update.useMutation({
    onSuccess: () => {
      toast.success("Survey updated!");
      utils.survey.getById.invalidate({ id: surveyId });
      utils.survey.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function cycleStatus() {
    if (!survey) return;
    const next =
      survey.status === "draft"
        ? "active"
        : survey.status === "active"
          ? "closed"
          : "draft";
    update.mutate({ id: surveyId, status: next });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <p className="text-muted-foreground">Survey not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{survey.title}</h1>
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
          </div>
          {survey.eventId && (
            <p className="text-muted-foreground text-sm">Event: {survey.eventId.slice(0, 8)}...</p>
          )}
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {survey.description}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={cycleStatus}
          disabled={update.isPending}
        >
          {survey.status === "draft"
            ? "Activate"
            : survey.status === "active"
              ? "Close"
              : "Reopen as Draft"}
        </Button>
      </div>

      {survey.status === "active" && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Public link: </span>
              <span className="font-mono text-primary">/s/{surveyId}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <>
          <Separator />
          <h2 className="text-lg font-semibold">Results</h2>
          {results.map((q) => (
            <Card key={q.questionId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{q.question}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">
                  {q.type}
                </p>
              </CardHeader>
              <CardContent>
                {q.type === "rating" && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {q.avgScore?.toFixed(1) ?? "—"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= Math.round(q.avgScore ?? 0)
                              ? "text-yellow-500"
                              : "text-muted-foreground/30"
                          }
                        >
                          &#9733;
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({q.count} responses)
                    </span>
                  </div>
                )}

                {q.type === "nps" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">
                        {q.npsScore ?? "—"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        NPS Score
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {q.count} responses
                    </p>
                  </div>
                )}

                {q.type === "text" && (
                  <div className="space-y-2">
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((resp, i) => (
                        <div
                          key={i}
                          className="rounded border p-2 text-sm bg-muted/50"
                        >
                          {resp}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No responses yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {(!results || results.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No results yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
