import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicProcedure, orgProcedure } from "../init";
import { surveys, surveyQuestions, surveyResponses, surveyAnswers, events } from "@/server/db/schema";

export const surveyRouter = createRouter({
  list: orgProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: surveys.id,
        title: surveys.title,
        description: surveys.description,
        status: surveys.status,
        eventId: surveys.eventId,
        eventTitle: events.title,
        createdAt: surveys.createdAt,
        responseCount: sql<number>`(
          SELECT COUNT(*) FROM survey_responses
          WHERE survey_responses.survey_id = ${surveys.id}
        )`,
      })
      .from(surveys)
      .innerJoin(events, eq(surveys.eventId, events.id))
      .where(eq(surveys.organizationId, ctx.orgId))
      .orderBy(sql`${surveys.createdAt} DESC`);

    return rows.map((r) => ({
      ...r,
      responseCount: Number(r.responseCount),
    }));
  }),

  create: orgProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        questions: z.array(
          z.object({
            question: z.string().min(1),
            type: z.enum(["rating", "text", "nps"]),
            sortOrder: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to org
      const event = await ctx.db.query.events.findFirst({
        where: and(
          eq(events.id, input.eventId),
          eq(events.organizationId, ctx.orgId)
        ),
        columns: { id: true },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found.",
        });
      }

      const [survey] = await ctx.db
        .insert(surveys)
        .values({
          organizationId: ctx.orgId,
          eventId: input.eventId,
          title: input.title,
          description: input.description,
        })
        .returning();

      for (const q of input.questions) {
        await ctx.db.insert(surveyQuestions).values({
          surveyId: survey.id,
          question: q.question,
          type: q.type,
          sortOrder: q.sortOrder,
        });
      }

      return survey;
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const survey = await ctx.db.query.surveys.findFirst({
        where: and(
          eq(surveys.id, input.id),
          eq(surveys.organizationId, ctx.orgId)
        ),
        with: {
          questions: {
            orderBy: (q, { asc }) => [asc(q.sortOrder)],
          },
        },
      });

      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });

      const [countResult] = await ctx.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(surveyResponses)
        .where(eq(surveyResponses.surveyId, input.id));

      return {
        ...survey,
        responseCount: Number(countResult.count),
      };
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        status: z.enum(["draft", "active", "closed"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(surveys)
        .set(data)
        .where(
          and(eq(surveys.id, id), eq(surveys.organizationId, ctx.orgId))
        )
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  getForSubmission: publicProcedure
    .input(z.object({ surveyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const survey = await ctx.db.query.surveys.findFirst({
        where: and(
          eq(surveys.id, input.surveyId),
          eq(surveys.status, "active")
        ),
        with: {
          questions: {
            orderBy: (q, { asc }) => [asc(q.sortOrder)],
          },
          event: {
            columns: { title: true },
          },
        },
      });

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey not found or not active.",
        });
      }

      return survey;
    }),

  submit: publicProcedure
    .input(
      z.object({
        surveyId: z.string().uuid(),
        respondentEmail: z.string().email(),
        respondentName: z.string().optional(),
        answers: z.array(
          z.object({
            questionId: z.string().uuid(),
            answer: z.string().min(1),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate survey is active
      const survey = await ctx.db.query.surveys.findFirst({
        where: and(
          eq(surveys.id, input.surveyId),
          eq(surveys.status, "active")
        ),
        columns: { id: true },
      });

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey not found or not active.",
        });
      }

      const [response] = await ctx.db
        .insert(surveyResponses)
        .values({
          surveyId: input.surveyId,
          respondentEmail: input.respondentEmail,
          respondentName: input.respondentName,
        })
        .returning();

      for (const a of input.answers) {
        await ctx.db.insert(surveyAnswers).values({
          responseId: response.id,
          questionId: a.questionId,
          answer: a.answer,
        });
      }

      return { success: true };
    }),

  getResults: orgProcedure
    .input(z.object({ surveyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify survey belongs to org
      const survey = await ctx.db.query.surveys.findFirst({
        where: and(
          eq(surveys.id, input.surveyId),
          eq(surveys.organizationId, ctx.orgId)
        ),
        with: {
          questions: {
            orderBy: (q, { asc }) => [asc(q.sortOrder)],
          },
        },
      });

      if (!survey) throw new TRPCError({ code: "NOT_FOUND" });

      const results = [];

      for (const question of survey.questions) {
        const answers = await ctx.db
          .select({ answer: surveyAnswers.answer })
          .from(surveyAnswers)
          .innerJoin(
            surveyResponses,
            eq(surveyAnswers.responseId, surveyResponses.id)
          )
          .where(
            and(
              eq(surveyAnswers.questionId, question.id),
              eq(surveyResponses.surveyId, input.surveyId)
            )
          );

        if (question.type === "text") {
          results.push({
            questionId: question.id,
            question: question.question,
            type: question.type,
            answers: answers.map((a) => a.answer),
            count: answers.length,
          });
        } else if (question.type === "rating") {
          const scores = answers
            .map((a) => Number(a.answer))
            .filter((n) => !isNaN(n));
          const avg =
            scores.length > 0
              ? scores.reduce((sum, s) => sum + s, 0) / scores.length
              : 0;

          results.push({
            questionId: question.id,
            question: question.question,
            type: question.type,
            avgScore: Math.round(avg * 100) / 100,
            count: scores.length,
          });
        } else if (question.type === "nps") {
          const scores = answers
            .map((a) => Number(a.answer))
            .filter((n) => !isNaN(n));
          const avg =
            scores.length > 0
              ? scores.reduce((sum, s) => sum + s, 0) / scores.length
              : 0;

          const promoters = scores.filter((s) => s >= 9).length;
          const detractors = scores.filter((s) => s <= 6).length;
          const npsScore =
            scores.length > 0
              ? Math.round(
                  ((promoters - detractors) / scores.length) * 100
                )
              : 0;

          results.push({
            questionId: question.id,
            question: question.question,
            type: question.type,
            avgScore: Math.round(avg * 100) / 100,
            npsScore,
            count: scores.length,
          });
        }
      }

      return results;
    }),
});
