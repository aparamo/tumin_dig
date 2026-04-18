import { createTRPCRouter, protectedProcedure } from "../../lib/trpc/server";
import { db } from "../../db";
import { jobs, users, transactions } from "../../db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const jobsRouter = createTRPCRouter({
  requestJob: protectedProcedure
    .input(
      z.object({
        description: z.string().min(10),
        minutes: z.number().min(1),
        amount: z.number().min(1),
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
          amount: input.amount,
          status: "PENDIENTE",
        })
        .returning();

      return newJob;
    }),

  getPendingJobs: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.role;
    const userRegion = ctx.session.user.region;
    const userId = ctx.session.user.id;

    if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los coordinadores pueden ver trabajos pendientes" });
    }

    const pendingJobs = await db
      .select({
        job: jobs,
        requester: {
          id: users.id,
          name: users.name,
          region: users.region,
        },
      })
      .from(jobs)
      .innerJoin(users, eq(jobs.requesterId, users.id))
      .where(
        and(
          eq(jobs.status, "PENDIENTE"),
          eq(users.region, userRegion),
          ne(jobs.requesterId, userId)
        )
      );

    return pendingJobs;
  }),

  verifyJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        status: z.enum(["PAGADO", "RECHAZADO"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const verifierId = ctx.session.user.id;
      const userRole = ctx.session.user.role;
      const userRegion = ctx.session.user.region;

      if (userRole !== "COORDINADOR" && userRole !== "COORDINADOR_LOCAL") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo los coordinadores pueden verificar trabajos" });
      }

      return await db.transaction(async (tx) => {
        const [job] = await tx
          .select()
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });
        }

        if (job.status !== "PENDIENTE") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este trabajo ya ha sido verificado" });
        }

        // Check if requester is in the same region as verifier
        const [requester] = await tx
          .select()
          .from(users)
          .where(eq(users.id, job.requesterId))
          .limit(1);

        if (!requester || requester.region !== userRegion) {
           throw new TRPCError({ code: "UNAUTHORIZED", message: "Solo puedes verificar trabajos de tu región" });
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
          // Ensure SYSTEM user exists
          const [systemUser] = await tx.select().from(users).where(eq(users.id, "SYSTEM")).limit(1);
          if (!systemUser) {
             await tx.insert(users).values({
               id: "SYSTEM",
               name: "Sistema Tumin",
               phone: "0000000000",
               nip: "SYSTEM", 
               region: "SYSTEM",
               status: "ACTIVO",
               role: "COORDINADOR",
             });
          }

          await tx.insert(transactions).values({
            fromId: "SYSTEM",
            toId: job.requesterId,
            amount: job.amount,
            concept: `Pago por Trabajo: ${job.description}`,
            type: "PAGO_TRABAJO",
          });
        }

        return updatedJob;
      });
    }),
});
