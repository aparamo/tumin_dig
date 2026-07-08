import {
  createTRPCRouter,
  protectedProcedure,
  regionalCoordinatorProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import { jobs, users, transactions } from "../../db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  buildJurisdictionCondition,
  isInJurisdiction,
  isGlobalCoordinator,
  type UserRole,
} from "../../lib/trpc/authorization";
import { ensureSystemUser } from "../../lib/system-user";
import { logAdminAction } from "../../lib/admin-log";

export const jobsRouter = createTRPCRouter({
  requestJob: protectedProcedure
    .input(
      z.object({
        description: z.string().min(10).max(500),
        minutes: z.int().min(1).max(480), // máximo 8 horas
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [newJob] = await db
        .insert(jobs)
        .values({
          requesterId: userId,
          description: input.description,
          minutes: input.minutes,
          amount: input.minutes, // 1 minuto = 1 Ŧ, calculado siempre en backend
          status: "PENDIENTE",
        })
        .returning();

      return newJob;
    }),

  getPendingJobs: regionalCoordinatorProcedure
    .input(z.object({ region: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userRole = ctx.session.user.role as UserRole;
      const userId = ctx.session.user.id;
      const isGlobal = isGlobalCoordinator(userRole);

      const targetRegion = isGlobal
        ? input?.region && input.region !== "Todas"
          ? input.region
          : null
        : ctx.session.user.region;

      const jurisdiction = buildJurisdictionCondition({
        role: userRole,
        region: targetRegion ?? ctx.session.user.region,
      });

      const condition = and(
        eq(jobs.status, "PENDIENTE"),
        ne(jobs.requesterId, userId),
        jurisdiction
      );

      return await db
        .select({
          job: jobs,
          requester: {
            id: users.id,
            name: users.name,
            region: users.region,
            residenceState: users.residenceState,
          },
        })
        .from(jobs)
        .innerJoin(users, eq(jobs.requesterId, users.id))
        .where(condition);
    }),

  verifyJob: regionalCoordinatorProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        status: z.enum(["PAGADO", "RECHAZADO"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const verifierId = ctx.session.user.id;
      const userRole = ctx.session.user.role as UserRole;
      const userRegion = ctx.session.user.region;

      return await db.transaction(async (tx) => {
        const [job] = await tx.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);

        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });
        }

        if (job.status !== "PENDIENTE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este trabajo ya ha sido verificado" });
        }

        if (job.requesterId === verifierId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "No puedes verificar tu propio trabajo" });
        }

        const [requester] = await tx.select().from(users).where(eq(users.id, job.requesterId)).limit(1);

        if (!requester || !isInJurisdiction({ role: userRole, region: userRegion }, requester)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes verificar trabajos de tu jurisdicción" });
        }

        const [updatedJob] = await tx
          .update(jobs)
          .set({
            status: input.status,
            verifierId: verifierId,
          })
          .where(eq(jobs.id, input.jobId))
          .returning();

        if (input.status === "PAGADO") {
          await ensureSystemUser(tx);

          await tx.insert(transactions).values({
            fromId: "SYSTEM",
            toId: job.requesterId,
            amount: job.amount,
            concept: `Pago por Trabajo: ${job.description}`,
            type: "PAGO_TRABAJO",
          });
        }

        await logAdminAction(tx, {
          actorId: verifierId,
          targetUserId: job.requesterId,
          action: input.status === "PAGADO" ? "VERIFY_JOB" : "REJECT_JOB",
          metadata: { jobId: job.id, status: input.status, amount: job.amount },
        });

        return updatedJob;
      });
    }),
});
