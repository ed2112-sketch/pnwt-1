"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

type QuestionDraft = {
  type: "rating" | "text" | "nps";
  text: string;
};

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const { data: events } = trpc.event.list.useQuery();

  const create = trpc.survey.create.useMutation({
    onSuccess: (data) => {
      toast.success("Survey created!");
      router.push(`/surveys/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  function addQuestion() {
    setQuestions([...questions, { type: "rating", text: "" }]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, updates: Partial<QuestionDraft>) {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) {
      toast.error("Please select an event.");
      return;
    }
    create.mutate({
      title,
      eventId,
      description: description || undefined,
      questions: questions.map((q, i) => ({
        question: q.text,
        type: q.type,
        sortOrder: i,
      })),
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Create Survey</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey-title">Title</Label>
              <Input
                id="survey-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post-event feedback"
                required
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="survey-desc">Description</Label>
              <Textarea
                id="survey-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="We'd love to hear your feedback..."
                rows={3}
              />
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  <Plus className="mr-1 size-4" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No questions added yet. Click &quot;Add Question&quot; to get
                  started.
                </p>
              )}

              {questions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <Select
                        value={q.type}
                        onValueChange={(v) =>
                          updateQuestion(i, {
                            type: (v ?? "rating") as QuestionDraft["type"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="nps">NPS</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={q.text}
                        onChange={(e) =>
                          updateQuestion(i, { text: e.target.value })
                        }
                        placeholder="Question text..."
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(i)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create Survey"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/surveys")}
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
