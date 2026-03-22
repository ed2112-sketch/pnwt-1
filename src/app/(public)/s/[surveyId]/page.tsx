"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicSurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = use(params);

  const { data: survey, isLoading } = trpc.survey.getForSubmission.useQuery({
    surveyId,
  });

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.survey.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message),
  });

  function setAnswer(questionId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit.mutate({
      surveyId,
      respondentName: name || undefined,
      respondentEmail: email,
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        answer: String(value),
      })),
    });
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
        <p className="text-muted-foreground">
          Your feedback has been submitted. We appreciate your time.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading survey...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Survey not found or not active.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        {survey.event && (
          <p className="text-sm text-muted-foreground mb-1">
            {survey.event.title}
          </p>
        )}
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        {survey.description && (
          <p className="text-muted-foreground mt-1">{survey.description}</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {survey.questions.map((q) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {q.type === "rating" && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAnswer(q.id, star)}
                      className={`text-2xl transition-colors ${
                        star <= (answers[q.id] as number ?? 0)
                          ? "text-yellow-500"
                          : "text-muted-foreground/30 hover:text-yellow-300"
                      }`}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              )}

              {q.type === "nps" && (
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n)}
                      className={`w-9 h-9 rounded text-sm font-medium border transition-colors ${
                        answers[q.id] === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                    <span>Not likely</span>
                    <span>Very likely</span>
                  </div>
                </div>
              )}

              {q.type === "text" && (
                <Textarea
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Your answer..."
                  rows={3}
                />
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey-name">Name</Label>
              <Input
                id="survey-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-email">Email</Label>
              <Input
                id="survey-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={submit.isPending}>
          {submit.isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </div>
  );
}
