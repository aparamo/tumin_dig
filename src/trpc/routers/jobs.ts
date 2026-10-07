import {
  createTRPCRouter,
  protectedProcedure,
  regionalCoordinatorProcedure,
  generalCoordinatorProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import {
  jobs,
  users,
  jobVotes,
  jobDisputes,
  jobDisputeFlags,
  jobDisputeMessages,
} from "../../db/schema";
import { eq, and, ne, lte, desc, isNull, sql, inArray, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  buildJurisdictionCondition,
  isInJurisdiction,
  isGlobalCoordinator,
  isCoordinator,
  type UserRole,
} from "../../lib/trpc/authorization";
import { issueFromSystem } from "../../lib/system-ledger";
import { logAdminAction } from "../../lib/admin-log";
import { formatPublicLocation } from "../../lib/location";
import {
  COMMUNITY_VETO_MIN_VOTES,
  DISPUTE_BLOCK_MIN_FLAGS,
  DISPUTE_MESSAGE_MAX,
  DISPUTE_REASON_MAX,
  DISPUTE_RESOLUTION_NOTE_MAX,
  JOB_VOTE_MESSAGE_MAX,
  isCommunityVetoActive,
  isDisputePaymentBlocked,
  tallyVotes,
} from "../../lib/job-governance";

type Tx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function loadVoteSummary(jobId: string, viewerId: string) {
  const rows = await db
    .select({
      stance: jobVotes.stance,
      message: jobVotes.message,
      voterId: jobVotes.voterId,
      voterName: users.name,
      voterPublicName: users.publicName,
      createdAt: jobVotes.createdAt,
      updatedAt: jobVotes.updatedAt,
    })
    .from(jobVotes)
    .innerJoin(users, eq(jobVotes.voterId, users.id))
    .where(eq(jobVotes.jobId, jobId))
    .orderBy(desc(jobVotes.updatedAt));

  const tally = tallyVotes(rows.map((r) => r.stance));
  const myVote = rows.find((r) => r.voterId === viewerId) ?? null;

  return {
    tally,
    communityVeto: isCommunityVetoActive(tally),
    communityVetoMinVotes: COMMUNITY_VETO_MIN_VOTES,
    myVote: myVote
      ? {
          stance: myVote.stance,
          message: myVote.message,
          updatedAt: myVote.updatedAt,
        }
      : null,
    votes: rows.map((r) => ({
      voterId: r.voterId,
      displayName: r.voterPublicName?.trim() || r.voterName.split(" ")[0],
      stance: r.stance,
      message: r.message,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  };
}

async function countActiveFlags(tx: Tx, disputeId: string): Promise<number> {
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(jobDisputeFlags)
    .where(and(eq(jobDisputeFlags.disputeId, disputeId), isNull(jobDisputeFlags.withdrawnAt)));
  return row?.n ?? 0;
}

async function loadDisputeSummary(jobId: string, viewerId: string) {
  const [dispute] = await db
    .select()
    .from(jobDisputes)
    .where(eq(jobDisputes.jobId, jobId))
    .limit(1);

  if (!dispute) {
    return {
      dispute: null as null,
      activeFlagCount: 0,
      paymentBlocked: false,
      myFlagActive: false,
      flags: [] as Array<{
        coordinatorId: string;
        displayName: string;
        reason: string;
        createdAt: Date;
        withdrawnAt: Date | null;
      }>,
    };
  }

  const flagRows = await db
    .select({
      coordinatorId: jobDisputeFlags.coordinatorId,
      reason: jobDisputeFlags.reason,
      createdAt: jobDisputeFlags.createdAt,
      withdrawnAt: jobDisputeFlags.withdrawnAt,
      name: users.name,
      publicName: users.publicName,
    })
    .from(jobDisputeFlags)
    .innerJoin(users, eq(jobDisputeFlags.coordinatorId, users.id))
    .where(eq(jobDisputeFlags.disputeId, dispute.id))
    .orderBy(desc(jobDisputeFlags.createdAt));

  const activeFlagCount = flagRows.filter((f) => f.withdrawnAt == null).length;
  const paymentBlocked = isDisputePaymentBlocked({
    disputeStatus: dispute.status,
    activeFlagCount,
  });
  const myFlag = flagRows.find((f) => f.coordinatorId === viewerId && f.withdrawnAt == null);

  return {
    dispute: {
      id: dispute.id,
      status: dispute.status,
      openedById: dispute.openedById,
      resolvedById: dispute.resolvedById,
      resolutionNote: dispute.resolutionNote,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt,
    },
    activeFlagCount,
    paymentBlocked,
    myFlagActive: Boolean(myFlag),
    flags: flagRows.map((f) => ({
      coordinatorId: f.coordinatorId,
      displayName: f.publicName?.trim() || f.name.split(" ")[0],
      reason: f.reason,
      createdAt: f.createdAt,
      withdrawnAt: f.withdrawnAt,
    })),
  };
}

function canAccessDisputeThread(input: {
  role: UserRole;
  region: string;
  userId: string;
  requester: { id: string; region: string; residenceState: string | null };
}): boolean {
  if (input.userId === input.requester.id) return true;
  if (!isCoordinator(input.role)) return false;
  return isInJurisdiction(
    { role: input.role, region: input.region },
    input.requester
  );
}

export const jobsRouter = createTRPCRouter({
  requestJob: protectedProcedure
    .input(
      z.object({
        description: z.string().min(10).max(500),
        minutes: z.int().min(1).max(480),
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
          amount: input.minutes,
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

      const rows = await db
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
        .where(condition)
        .orderBy(desc(jobs.createdAt));

      const jobIds = rows.map((r) => r.job.id);
      if (jobIds.length === 0) return [];

      const voterUser = alias(users, "pending_job_voter");
      const voteRows = await db
        .select({
          jobId: jobVotes.jobId,
          stance: jobVotes.stance,
          message: jobVotes.message,
          voterName: voterUser.name,
          voterPublicName: voterUser.publicName,
        })
        .from(jobVotes)
        .innerJoin(voterUser, eq(jobVotes.voterId, voterUser.id))
        .where(inArray(jobVotes.jobId, jobIds));

      const votesByJob = new Map<string, Array<"ACUERDO" | "DESACUERDO">>();
      const commentsByJob = new Map<
        string,
        Array<{ displayName: string; stance: "ACUERDO" | "DESACUERDO"; message: string }>
      >();
      for (const v of voteRows) {
        const list = votesByJob.get(v.jobId) ?? [];
        list.push(v.stance);
        votesByJob.set(v.jobId, list);
        const text = v.message?.trim();
        if (text) {
          const comments = commentsByJob.get(v.jobId) ?? [];
          comments.push({
            displayName: v.voterPublicName?.trim() || v.voterName.split(" ")[0],
            stance: v.stance,
            message: text,
          });
          commentsByJob.set(v.jobId, comments);
        }
      }

      const disputeRows = await db
        .select({
          jobId: jobDisputes.jobId,
          disputeId: jobDisputes.id,
          status: jobDisputes.status,
        })
        .from(jobDisputes)
        .where(inArray(jobDisputes.jobId, jobIds));

      const disputeByJob = new Map(
        disputeRows.map((d) => [d.jobId, d] as const)
      );

      const disputeIds = disputeRows.map((d) => d.disputeId);
      const flagCounts = new Map<string, number>();
      const myActiveFlags = new Set<string>();
      if (disputeIds.length > 0) {
        const flagRows = await db
          .select({
            disputeId: jobDisputeFlags.disputeId,
            coordinatorId: jobDisputeFlags.coordinatorId,
          })
          .from(jobDisputeFlags)
          .where(
            and(
              inArray(jobDisputeFlags.disputeId, disputeIds),
              isNull(jobDisputeFlags.withdrawnAt)
            )
          );
        for (const f of flagRows) {
          flagCounts.set(f.disputeId, (flagCounts.get(f.disputeId) ?? 0) + 1);
          if (f.coordinatorId === userId) myActiveFlags.add(f.disputeId);
        }
      }

      return rows.map((item) => {
        const tally = tallyVotes(votesByJob.get(item.job.id) ?? []);
        const communityVeto = isCommunityVetoActive(tally);
        const dispute = disputeByJob.get(item.job.id) ?? null;
        const activeFlagCount = dispute ? (flagCounts.get(dispute.disputeId) ?? 0) : 0;
        const paymentBlocked = isDisputePaymentBlocked({
          disputeStatus: dispute?.status ?? null,
          activeFlagCount,
        });
        return {
          ...item,
          voteTally: tally,
          voteComments: commentsByJob.get(item.job.id) ?? [],
          communityVeto,
          disputeStatus: dispute?.status ?? null,
          activeFlagCount,
          myFlagActive: dispute ? myActiveFlags.has(dispute.disputeId) : false,
          paymentBlocked,
          canApprove: !communityVeto && !paymentBlocked,
          approveBlockedReason: communityVeto
            ? "Veto comunitario: mayoría en desacuerdo"
            : paymentBlocked
              ? `Controversia activa (${activeFlagCount} señalamientos)`
              : null,
        };
      });
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
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Solo puedes verificar trabajos de tu jurisdicción",
          });
        }

        if (input.status === "PAGADO") {
          const stanceRows = await tx
            .select({ stance: jobVotes.stance })
            .from(jobVotes)
            .where(eq(jobVotes.jobId, job.id));
          const tally = tallyVotes(stanceRows.map((r) => r.stance));
          if (isCommunityVetoActive(tally)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "No se puede aprobar: la comunidad votó en mayoría en desacuerdo. Puedes rechazar la labor.",
            });
          }

          const [dispute] = await tx
            .select()
            .from(jobDisputes)
            .where(eq(jobDisputes.jobId, job.id))
            .limit(1);

          if (dispute) {
            const activeFlagCount = await countActiveFlags(tx, dispute.id);
            if (
              isDisputePaymentBlocked({
                disputeStatus: dispute.status,
                activeFlagCount,
              })
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "No se puede aprobar: hay una controversia activa con al menos dos señalamientos. Espera la resolución.",
              });
            }
          }
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
          await issueFromSystem(tx, {
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

  getProposedJobs: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session.user.id;
      const conditions = [eq(jobs.status, "PENDIENTE")];
      if (input.cursor) {
        conditions.push(lte(jobs.id, input.cursor));
      }

      const rows = await db
        .select({
          id: jobs.id,
          description: jobs.description,
          minutes: jobs.minutes,
          amount: jobs.amount,
          status: jobs.status,
          createdAt: jobs.createdAt,
          requesterId: jobs.requesterId,
          requesterName: users.name,
          requesterPublicName: users.publicName,
          requesterRegion: users.region,
          residenceState: users.residenceState,
          residenceCity: users.residenceCity,
          residenceCountry: users.residenceCountry,
        })
        .from(jobs)
        .innerJoin(users, eq(jobs.requesterId, users.id))
        .where(and(...conditions))
        .orderBy(desc(jobs.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

      const jobIds = items.map((i) => i.id);
      const proposedVoter = alias(users, "proposed_job_voter");
      const voteRows =
        jobIds.length === 0
          ? []
          : await db
              .select({
                jobId: jobVotes.jobId,
                stance: jobVotes.stance,
                voterId: jobVotes.voterId,
                message: jobVotes.message,
                voterName: proposedVoter.name,
                voterPublicName: proposedVoter.publicName,
              })
              .from(jobVotes)
              .innerJoin(proposedVoter, eq(jobVotes.voterId, proposedVoter.id))
              .where(inArray(jobVotes.jobId, jobIds));

      const byJob = new Map<
        string,
        Array<{
          stance: "ACUERDO" | "DESACUERDO";
          voterId: string;
          message: string | null;
          voterName: string;
          voterPublicName: string | null;
        }>
      >();
      for (const v of voteRows) {
        const list = byJob.get(v.jobId) ?? [];
        list.push(v);
        byJob.set(v.jobId, list);
      }

      const disputeRows =
        jobIds.length === 0
          ? []
          : await db
              .select({
                jobId: jobDisputes.jobId,
                status: jobDisputes.status,
                disputeId: jobDisputes.id,
              })
              .from(jobDisputes)
              .where(inArray(jobDisputes.jobId, jobIds));

      const disputeByJob = new Map(disputeRows.map((d) => [d.jobId, d] as const));
      const disputeIds = disputeRows.map((d) => d.disputeId);
      const flagCounts = new Map<string, number>();
      if (disputeIds.length > 0) {
        const flagAgg = await db
          .select({
            disputeId: jobDisputeFlags.disputeId,
            n: sql<number>`count(*)::int`,
          })
          .from(jobDisputeFlags)
          .where(
            and(
              inArray(jobDisputeFlags.disputeId, disputeIds),
              isNull(jobDisputeFlags.withdrawnAt)
            )
          )
          .groupBy(jobDisputeFlags.disputeId);
        for (const f of flagAgg) flagCounts.set(f.disputeId, f.n);
      }

      return {
        items: items.map((item) => {
          const votes = byJob.get(item.id) ?? [];
          const tally = tallyVotes(votes.map((v) => v.stance));
          const my = votes.find((v) => v.voterId === viewerId) ?? null;
          const dispute = disputeByJob.get(item.id) ?? null;
          const activeFlagCount = dispute ? (flagCounts.get(dispute.disputeId) ?? 0) : 0;
          return {
            id: item.id,
            description: item.description,
            minutes: item.minutes,
            amount: item.amount,
            status: item.status,
            createdAt: item.createdAt,
            requesterId: item.requesterId,
            displayName:
              item.requesterPublicName?.trim() || item.requesterName.split(" ")[0],
            requesterRegion: item.requesterRegion,
            location: formatPublicLocation({
              residenceCountry: item.residenceCountry,
              residenceState: item.residenceState,
              residenceCity: item.residenceCity,
              residencePostalCode: null,
            }),
            isOwn: item.requesterId === viewerId,
            tally,
            communityVeto: isCommunityVetoActive(tally),
            myStance: my?.stance ?? null,
            myMessage: my?.message ?? null,
            comments: votes
              .filter((v) => Boolean(v.message?.trim()))
              .map((v) => ({
                voterId: v.voterId,
                displayName: v.voterPublicName?.trim() || v.voterName.split(" ")[0],
                stance: v.stance,
                message: v.message!.trim(),
              })),
            disputeStatus: dispute?.status ?? null,
            activeFlagCount,
            paymentBlocked: isDisputePaymentBlocked({
              disputeStatus: dispute?.status ?? null,
              activeFlagCount,
            }),
          };
        }),
        nextCursor,
      };
    }),

  getJobVotes: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });
      return loadVoteSummary(input.jobId, ctx.session.user.id);
    }),

  voteOnJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        stance: z.enum(["ACUERDO", "DESACUERDO"]),
        message: z.string().trim().max(JOB_VOTE_MESSAGE_MAX).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const voterId = ctx.session.user.id;
      const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });
      if (job.status !== "PENDIENTE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Solo se puede votar labores pendientes",
        });
      }
      if (job.requesterId === voterId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No puedes votar tu propia labor",
        });
      }

      const message = input.message?.trim() ? input.message.trim() : null;
      const now = new Date();

      const [existing] = await db
        .select()
        .from(jobVotes)
        .where(and(eq(jobVotes.jobId, input.jobId), eq(jobVotes.voterId, voterId)))
        .limit(1);

      if (existing) {
        await db
          .update(jobVotes)
          .set({
            stance: input.stance,
            message,
            updatedAt: now,
          })
          .where(eq(jobVotes.id, existing.id));
      } else {
        await db.insert(jobVotes).values({
          jobId: input.jobId,
          voterId,
          stance: input.stance,
          message,
          createdAt: now,
          updatedAt: now,
        });
      }

      return loadVoteSummary(input.jobId, voterId);
    }),

  flagJobDispute: regionalCoordinatorProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        reason: z.string().trim().min(10).max(DISPUTE_REASON_MAX),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const coordinatorId = ctx.session.user.id;
      const role = ctx.session.user.role as UserRole;
      const region = ctx.session.user.region;

      return await db.transaction(async (tx) => {
        const [job] = await tx.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
        if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });
        if (job.status !== "PENDIENTE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Solo se puede señalar labores pendientes",
          });
        }
        if (job.requesterId === coordinatorId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No puedes señalar tu propia labor",
          });
        }

        const [requester] = await tx
          .select()
          .from(users)
          .where(eq(users.id, job.requesterId))
          .limit(1);
        if (!requester || !isInJurisdiction({ role, region }, requester)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Solo puedes señalar labores de tu jurisdicción",
          });
        }

        let [dispute] = await tx
          .select()
          .from(jobDisputes)
          .where(eq(jobDisputes.jobId, job.id))
          .limit(1);

        if (dispute?.status === "RESUELTA") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Esta controversia ya fue resuelta. Si el desacuerdo continúa, rechaza la labor.",
          });
        }

        const reason = input.reason.trim();
        let createdDispute = false;

        if (!dispute) {
          [dispute] = await tx
            .insert(jobDisputes)
            .values({
              jobId: job.id,
              status: "ABIERTA",
              openedById: coordinatorId,
            })
            .returning();
          createdDispute = true;
        }

        const [existingFlag] = await tx
          .select()
          .from(jobDisputeFlags)
          .where(
            and(
              eq(jobDisputeFlags.disputeId, dispute.id),
              eq(jobDisputeFlags.coordinatorId, coordinatorId)
            )
          )
          .limit(1);

        if (existingFlag && existingFlag.withdrawnAt == null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ya señalaste esta labor",
          });
        }

        if (existingFlag) {
          await tx
            .update(jobDisputeFlags)
            .set({
              reason,
              withdrawnAt: null,
              createdAt: new Date(),
            })
            .where(eq(jobDisputeFlags.id, existingFlag.id));
        } else {
          await tx.insert(jobDisputeFlags).values({
            disputeId: dispute.id,
            coordinatorId,
            reason,
          });
        }

        await tx.insert(jobDisputeMessages).values({
          disputeId: dispute.id,
          authorId: coordinatorId,
          body: createdDispute
            ? `Señalamiento de controversia: ${reason}`
            : existingFlag
              ? `Volvió a señalar controversia: ${reason}`
              : `Señalamiento de controversia: ${reason}`,
        });

        await logAdminAction(tx, {
          actorId: coordinatorId,
          targetUserId: job.requesterId,
          action: "FLAG_JOB_DISPUTE",
          metadata: { jobId: job.id, disputeId: dispute.id },
        });

        const activeFlagCount = await countActiveFlags(tx, dispute.id);
        return {
          disputeId: dispute.id,
          activeFlagCount,
          paymentBlocked: isDisputePaymentBlocked({
            disputeStatus: "ABIERTA",
            activeFlagCount,
          }),
          blockThreshold: DISPUTE_BLOCK_MIN_FLAGS,
        };
      });
    }),

  withdrawJobDisputeFlag: regionalCoordinatorProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const coordinatorId = ctx.session.user.id;

      return await db.transaction(async (tx) => {
        const [dispute] = await tx
          .select()
          .from(jobDisputes)
          .where(eq(jobDisputes.jobId, input.jobId))
          .limit(1);

        if (!dispute) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No hay controversia" });
        }
        if (dispute.status === "RESUELTA") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "La controversia ya fue resuelta",
          });
        }

        const [flag] = await tx
          .select()
          .from(jobDisputeFlags)
          .where(
            and(
              eq(jobDisputeFlags.disputeId, dispute.id),
              eq(jobDisputeFlags.coordinatorId, coordinatorId),
              isNull(jobDisputeFlags.withdrawnAt)
            )
          )
          .limit(1);

        if (!flag) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No tienes un señalamiento activo",
          });
        }

        await tx
          .update(jobDisputeFlags)
          .set({ withdrawnAt: new Date() })
          .where(eq(jobDisputeFlags.id, flag.id));

        await tx.insert(jobDisputeMessages).values({
          disputeId: dispute.id,
          authorId: coordinatorId,
          body: "Retiró su señalamiento de controversia.",
        });

        const activeFlagCount = await countActiveFlags(tx, dispute.id);
        return {
          activeFlagCount,
          paymentBlocked: isDisputePaymentBlocked({
            disputeStatus: dispute.status,
            activeFlagCount,
          }),
        };
      });
    }),

  resolveJobDispute: generalCoordinatorProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        note: z.string().trim().min(10).max(DISPUTE_RESOLUTION_NOTE_MAX),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resolverId = ctx.session.user.id;

      return await db.transaction(async (tx) => {
        const [dispute] = await tx
          .select()
          .from(jobDisputes)
          .where(eq(jobDisputes.jobId, input.jobId))
          .limit(1);

        if (!dispute) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No hay controversia" });
        }
        if (dispute.status === "RESUELTA") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "La controversia ya está resuelta",
          });
        }

        const [job] = await tx.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);

        const [updated] = await tx
          .update(jobDisputes)
          .set({
            status: "RESUELTA",
            resolvedById: resolverId,
            resolutionNote: input.note.trim(),
            resolvedAt: new Date(),
          })
          .where(eq(jobDisputes.id, dispute.id))
          .returning();

        await tx.insert(jobDisputeMessages).values({
          disputeId: dispute.id,
          authorId: resolverId,
          body: `Controversia resuelta: ${input.note.trim()}`,
        });

        await logAdminAction(tx, {
          actorId: resolverId,
          targetUserId: job?.requesterId ?? resolverId,
          action: "RESOLVE_JOB_DISPUTE",
          metadata: { jobId: input.jobId, disputeId: dispute.id },
        });

        return updated;
      });
    }),

  getJobDispute: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.session.user.role as UserRole;
      const userId = ctx.session.user.id;
      const region = ctx.session.user.region;

      const [job] = await db
        .select({
          id: jobs.id,
          requesterId: jobs.requesterId,
          status: jobs.status,
          description: jobs.description,
        })
        .from(jobs)
        .where(eq(jobs.id, input.jobId))
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });

      const [requester] = await db
        .select({
          id: users.id,
          region: users.region,
          residenceState: users.residenceState,
        })
        .from(users)
        .where(eq(users.id, job.requesterId))
        .limit(1);

      if (
        !requester ||
        !canAccessDisputeThread({
          role,
          region,
          userId,
          requester,
        })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes acceso a esta controversia",
        });
      }

      const summary = await loadDisputeSummary(input.jobId, userId);
      if (!summary.dispute) {
        return { ...summary, messages: [], job };
      }

      const messages = await db
        .select({
          id: jobDisputeMessages.id,
          body: jobDisputeMessages.body,
          createdAt: jobDisputeMessages.createdAt,
          authorId: jobDisputeMessages.authorId,
          authorName: users.name,
          authorPublicName: users.publicName,
        })
        .from(jobDisputeMessages)
        .innerJoin(users, eq(jobDisputeMessages.authorId, users.id))
        .where(eq(jobDisputeMessages.disputeId, summary.dispute.id))
        .orderBy(asc(jobDisputeMessages.createdAt));

      return {
        ...summary,
        job,
        messages: messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt,
          authorId: m.authorId,
          displayName: m.authorPublicName?.trim() || m.authorName.split(" ")[0],
        })),
      };
    }),

  postJobDisputeMessage: protectedProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        body: z.string().trim().min(1).max(DISPUTE_MESSAGE_MAX),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role as UserRole;
      const userId = ctx.session.user.id;
      const region = ctx.session.user.region;

      const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Trabajo no encontrado" });

      const [requester] = await db
        .select({
          id: users.id,
          region: users.region,
          residenceState: users.residenceState,
        })
        .from(users)
        .where(eq(users.id, job.requesterId))
        .limit(1);

      if (
        !requester ||
        !canAccessDisputeThread({ role, region, userId, requester })
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes acceso a esta controversia",
        });
      }

      const [dispute] = await db
        .select()
        .from(jobDisputes)
        .where(eq(jobDisputes.jobId, input.jobId))
        .limit(1);

      if (!dispute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aún no hay controversia abierta para esta labor",
        });
      }

      const [msg] = await db
        .insert(jobDisputeMessages)
        .values({
          disputeId: dispute.id,
          authorId: userId,
          body: input.body.trim(),
        })
        .returning();

      return msg;
    }),

  getJobsHistory: protectedProcedure
    .input(
      z.object({
        allRegions: z.boolean().default(false),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRegion = ctx.session.user.region;
      const isGlobal = isGlobalCoordinator(ctx.session.user.role as UserRole);

      const conditions = [];
      if (!input.allRegions || !isGlobal) {
        conditions.push(eq(users.region, userRegion));
      }
      if (input.cursor) {
        conditions.push(lte(jobs.id, input.cursor));
      }

      const rows = await db
        .select({
          id: jobs.id,
          description: jobs.description,
          minutes: jobs.minutes,
          amount: jobs.amount,
          status: jobs.status,
          createdAt: jobs.createdAt,
          requesterName: users.name,
          requesterPublicName: users.publicName,
          requesterRegion: users.region,
          residenceState: users.residenceState,
          residenceCity: users.residenceCity,
          residenceCountry: users.residenceCountry,
          isVerified: users.isVerified,
        })
        .from(jobs)
        .innerJoin(users, eq(jobs.requesterId, users.id))
        .where(and(...conditions))
        .orderBy(desc(jobs.createdAt))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, input.limit) : rows;
      const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

      return {
        items: items.map((item) => ({
          ...item,
          displayName: item.requesterPublicName?.trim() || item.requesterName.split(" ")[0],
          location: formatPublicLocation({
            residenceCountry: item.residenceCountry,
            residenceState: item.residenceState,
            residenceCity: item.residenceCity,
            residencePostalCode: null,
          }),
        })),
        nextCursor,
      };
    }),
});
