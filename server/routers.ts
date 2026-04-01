import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createTeam,
  getTeamById,
  getUserTeams,
  addTeamMember,
  getTeamMembers,
  isTeamMember,
  createStudent,
  getStudentById,
  getTeamStudents,
  updateStudent,
  deleteStudent,
  createGroup,
  getTeamGroups,
  deleteGroup,
  createGroupingSuggestion,
  getTeamGroupingSuggestions,
} from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check team membership
async function ensureTeamMember(teamId: number, userId: number) {
  const isMember = await isTeamMember(teamId, userId);
  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this team",
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Team management
  teams: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await createTeam(input.name, input.description, ctx.user.id);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTeams(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await getTeamById(input.teamId);
      }),

    getMembers: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await getTeamMembers(input.teamId);
      }),

    addMember: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          userId: z.number(),
          role: z.enum(["admin", "member"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await addTeamMember(input.teamId, input.userId, input.role);
      }),
  }),

  // Student management
  students: router({
    create: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          name: z.string().min(1),
          photoUrl: z.string().optional(),
          photoKey: z.string().optional(),
          personalityData: z.record(z.string(), z.number()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await createStudent(
          input.teamId,
          input.name,
          input.photoUrl,
          input.photoKey,
          input.personalityData,
          input.notes
        );
      }),

    getById: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const student = await getStudentById(input.studentId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await ensureTeamMember(student.teamId, ctx.user.id);
        return student;
      }),

    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await getTeamStudents(input.teamId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          name: z.string().optional(),
          photoUrl: z.string().optional(),
          photoKey: z.string().optional(),
          personalityData: z.record(z.string(), z.number()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const student = await getStudentById(input.studentId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await ensureTeamMember(student.teamId, ctx.user.id);

        const updates: any = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.photoUrl !== undefined) updates.photoUrl = input.photoUrl;
        if (input.photoKey !== undefined) updates.photoKey = input.photoKey;
        if (input.personalityData !== undefined)
          updates.personalityData = input.personalityData;
        if (input.notes !== undefined) updates.notes = input.notes;

        return await updateStudent(input.studentId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const student = await getStudentById(input.studentId);
        if (!student) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await ensureTeamMember(student.teamId, ctx.user.id);
        await deleteStudent(input.studentId);
        return { success: true };
      }),
  }),

  // Group management
  groups: router({
    create: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          studentIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await createGroup(
          input.teamId,
          input.name,
          ctx.user.id,
          input.studentIds,
          input.description
        );
      }),

    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await getTeamGroups(input.teamId);
      }),

    delete: protectedProcedure
      .input(z.object({ groupId: z.number(), teamId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        await deleteGroup(input.groupId);
        return { success: true };
      }),
  }),

  // Grouping suggestions
  groupingSuggestions: router({
    create: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          groupSize: z.number().min(1),
          suggestions: z.array(
            z.object({
              groupName: z.string(),
              studentIds: z.array(z.number()),
              reasoning: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await createGroupingSuggestion(
          input.teamId,
          ctx.user.id,
          input.groupSize,
          input.suggestions
        );
      }),

    listByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input, ctx }) => {
        await ensureTeamMember(input.teamId, ctx.user.id);
        return await getTeamGroupingSuggestions(input.teamId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
