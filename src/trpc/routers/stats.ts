import {
  createTRPCRouter,
  coordinatorProcedure,
  protectedProcedure,
} from "../../lib/trpc/server";
import { db } from "../../db";
import { jobs, transactions, users } from "../../db/schema";
import { and, eq, gte, lt, sql, inArray, or, isNotNull, ne } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SYSTEM_ACCOUNT_IDS } from "../../lib/system-ids";
import { excludeTechnicalAccountsCondition } from "../../lib/system-account-filters";
import {
  isGlobalCoordinator,
  type UserRole,
} from "../../lib/trpc/authorization";
import { periodWindow, STATS_PERIODS } from "../../lib/stats-periods";
import {
  ENROLLMENT_REGIONS,
  MEXICO_COUNTRY,
  MEXICO_STATES,
  RESIDENCE_COUNTRIES,
  isMexicoCountry,
} from "../../lib/location";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import {
  emptyTransactionBreakdown,
  sliceFromTotals,
  type ExchangedBreakdown,
  type GeneratedBreakdown,
  type TransactionBreakdown,
} from "../../lib/stats-breakdown";

const periodSchema = z.enum(STATS_PERIODS);

function timeFilters(
  from: Date | null,
  to: Date | null,
  column: typeof transactions.createdAt | typeof jobs.createdAt
) {
  const parts = [];
  if (from) parts.push(gte(column, from));
  if (to) parts.push(lt(column, to));
  return parts;
}

const notSystemParty = and(
  sql`${transactions.fromId} <> ALL(ARRAY[${sql.join(
    SYSTEM_ACCOUNT_IDS.map((id) => sql`${id}`),
    sql`, `
  )}]::text[])`,
  sql`${transactions.toId} <> ALL(ARRAY[${sql.join(
    SYSTEM_ACCOUNT_IDS.map((id) => sql`${id}`),
    sql`, `
  )}]::text[])`
);

async function loadTransactionBreakdown(
  txTime: ReturnType<typeof timeFilters>,
  extra?: ReturnType<typeof and>
): Promise<TransactionBreakdown> {
  const base = and(...txTime, extra);
  const [totals] = await db
    .select({
      count: sql<number>`count(*)::int`,
      amount: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(transactions)
    .where(base);

  const [byType] = await db
    .select({
      transferenciaCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFERENCIA')::int`,
      transferenciaAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'TRANSFERENCIA'), 0)::float`,
      bonoCount: sql<number>`count(*) filter (where ${transactions.type} = 'BONO')::int`,
      bonoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'BONO'), 0)::float`,
      minadoCount: sql<number>`count(*) filter (where ${transactions.type} = 'MINADO')::int`,
      minadoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'MINADO'), 0)::float`,
      pagoCount: sql<number>`count(*) filter (where ${transactions.type} = 'PAGO_TRABAJO')::int`,
      pagoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'PAGO_TRABAJO'), 0)::float`,
      bazarCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NOT NULL)::int`,
      bazarAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NOT NULL), 0)::float`,
      libreCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NULL)::int`,
      libreAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NULL), 0)::float`,
    })
    .from(transactions)
    .where(base);

  const out = emptyTransactionBreakdown();
  out.total = sliceFromTotals(totals?.count, totals?.amount);
  out.transferencia = sliceFromTotals(byType?.transferenciaCount, byType?.transferenciaAmount);
  out.bono = sliceFromTotals(byType?.bonoCount, byType?.bonoAmount);
  out.minado = sliceFromTotals(byType?.minadoCount, byType?.minadoAmount);
  out.pagoTrabajo = sliceFromTotals(byType?.pagoCount, byType?.pagoAmount);
  out.bazar = sliceFromTotals(byType?.bazarCount, byType?.bazarAmount);
  out.envioLibre = sliceFromTotals(byType?.libreCount, byType?.libreAmount);
  return out;
}

async function loadGeneratedBreakdown(
  systemIds: string[],
  txTime: ReturnType<typeof timeFilters>,
  extra?: ReturnType<typeof and>
): Promise<GeneratedBreakdown> {
  const [row] = await db
    .select({
      bonoCount: sql<number>`count(*) filter (where ${transactions.type} = 'BONO')::int`,
      bonoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'BONO'), 0)::float`,
      minadoCount: sql<number>`count(*) filter (where ${transactions.type} = 'MINADO')::int`,
      minadoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'MINADO'), 0)::float`,
      pagoCount: sql<number>`count(*) filter (where ${transactions.type} = 'PAGO_TRABAJO')::int`,
      pagoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'PAGO_TRABAJO'), 0)::float`,
      totalCount: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.fromId, systemIds),
        inArray(transactions.type, ["BONO", "MINADO", "PAGO_TRABAJO"]),
        ...txTime,
        extra
      )
    );

  return {
    bono: { count: row?.bonoCount ?? 0, amount: row?.bonoAmount ?? 0 },
    minado: { count: row?.minadoCount ?? 0, amount: row?.minadoAmount ?? 0 },
    pagoTrabajo: { count: row?.pagoCount ?? 0, amount: row?.pagoAmount ?? 0 },
    total: { count: row?.totalCount ?? 0, amount: row?.totalAmount ?? 0 },
  };
}

async function loadExchangedBreakdown(
  txTime: ReturnType<typeof timeFilters>,
  extra?: ReturnType<typeof and>
): Promise<ExchangedBreakdown> {
  const [row] = await db
    .select({
      bazarCount: sql<number>`count(*) filter (where ${transactions.productId} IS NOT NULL)::int`,
      bazarAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.productId} IS NOT NULL), 0)::float`,
      libreCount: sql<number>`count(*) filter (where ${transactions.productId} IS NULL)::int`,
      libreAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.productId} IS NULL), 0)::float`,
      totalCount: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(transactions)
    .where(and(eq(transactions.type, "TRANSFERENCIA"), notSystemParty, ...txTime, extra));

  return {
    bazar: { count: row?.bazarCount ?? 0, amount: row?.bazarAmount ?? 0 },
    envioLibre: { count: row?.libreCount ?? 0, amount: row?.libreAmount ?? 0 },
    total: { count: row?.totalCount ?? 0, amount: row?.totalAmount ?? 0 },
  };
}

function residenceFilters(
  country: string | null,
  state: string | null,
  countryCol: AnyPgColumn,
  stateCol: AnyPgColumn
) {
  const parts = [];
  if (country) {
    if (isMexicoCountry(country)) {
      parts.push(
        or(
          eq(countryCol, MEXICO_COUNTRY),
          eq(countryCol, "Mexico"),
          eq(countryCol, "México")
        )!
      );
      if (state) {
        parts.push(eq(stateCol, state));
      }
    } else {
      parts.push(eq(countryCol, country));
    }
  } else if (state) {
    // State-only filter (Mexico residence implied)
    parts.push(
      or(
        eq(countryCol, MEXICO_COUNTRY),
        eq(countryCol, "Mexico"),
        eq(countryCol, "México")
      )!
    );
    parts.push(eq(stateCol, state));
  }
  return parts;
}

async function computeScopedNetworkStats(input: {
  period: (typeof STATS_PERIODS)[number];
  regionFilter: string | null;
  countryFilter: string | null;
  stateFilter: string | null;
}) {
  const window = periodWindow(input.period);
  const jobTime = timeFilters(window.from, window.to, jobs.createdAt);
  const txTime = timeFilters(window.from, window.to, transactions.createdAt);
  const systemIds = [...SYSTEM_ACCOUNT_IDS];
  const { regionFilter, countryFilter, stateFilter } = input;

  const memberBase = [
    excludeTechnicalAccountsCondition(),
    ...residenceFilters(
      countryFilter,
      stateFilter,
      users.residenceCountry,
      users.residenceState
    ),
  ];
  if (regionFilter) {
    memberBase.push(eq(users.region, regionFilter));
  }

  const [memberCounts] = await db
    .select({
      activos: sql<number>`count(*) filter (where ${users.status} = 'ACTIVO')::int`,
      sinVerificar: sql<number>`count(*) filter (where ${users.isVerified} = false)::int`,
      congelados: sql<number>`count(*) filter (where ${users.status} = 'CONGELADO')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(and(...memberBase));

  const jobConditions = [
    ...jobTime,
    excludeTechnicalAccountsCondition(),
    ...residenceFilters(
      countryFilter,
      stateFilter,
      users.residenceCountry,
      users.residenceState
    ),
  ];
  if (regionFilter) {
    jobConditions.push(eq(users.region, regionFilter));
  }

  const [jobCounts] = await db
    .select({
      pendientes: sql<number>`count(*) filter (where ${jobs.status} = 'PENDIENTE')::int`,
      pagadas: sql<number>`count(*) filter (where ${jobs.status} = 'PAGADO')::int`,
      rechazadas: sql<number>`count(*) filter (where ${jobs.status} = 'RECHAZADO')::int`,
    })
    .from(jobs)
    .innerJoin(users, eq(jobs.requesterId, users.id))
    .where(and(...jobConditions));

  const toUser = alias(users, "to_user");
  const fromUser = alias(users, "from_user");

  const residenceTo = residenceFilters(
    countryFilter,
    stateFilter,
    toUser.residenceCountry,
    toUser.residenceState
  );
  const residenceFromOrTo =
    countryFilter || stateFilter
      ? or(
          and(
            ...residenceFilters(
              countryFilter,
              stateFilter,
              fromUser.residenceCountry,
              fromUser.residenceState
            )
          ),
          and(
            ...residenceFilters(
              countryFilter,
              stateFilter,
              toUser.residenceCountry,
              toUser.residenceState
            )
          )
        )
      : undefined;

  const generatedJoinConditions = [
    inArray(transactions.fromId, systemIds),
    inArray(transactions.type, ["BONO", "MINADO", "PAGO_TRABAJO"]),
    ...txTime,
    ...residenceTo,
  ];
  if (regionFilter) {
    generatedJoinConditions.push(eq(toUser.region, regionFilter));
  }

  const [generatedRow] = await db
    .select({
      bonoCount: sql<number>`count(*) filter (where ${transactions.type} = 'BONO')::int`,
      bonoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'BONO'), 0)::float`,
      minadoCount: sql<number>`count(*) filter (where ${transactions.type} = 'MINADO')::int`,
      minadoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'MINADO'), 0)::float`,
      pagoCount: sql<number>`count(*) filter (where ${transactions.type} = 'PAGO_TRABAJO')::int`,
      pagoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'PAGO_TRABAJO'), 0)::float`,
      totalCount: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(transactions)
    .innerJoin(toUser, eq(transactions.toId, toUser.id))
    .where(
      and(
        ...generatedJoinConditions,
        sql`UPPER(TRIM(${toUser.region})) NOT IN ('SISTEMA', 'SYSTEM', 'GENERAL')`,
        sql`${toUser.id} NOT IN (${sql.join(
          systemIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    );

  const generatedBreakdown = {
    bono: { count: generatedRow?.bonoCount ?? 0, amount: generatedRow?.bonoAmount ?? 0 },
    minado: { count: generatedRow?.minadoCount ?? 0, amount: generatedRow?.minadoAmount ?? 0 },
    pagoTrabajo: { count: generatedRow?.pagoCount ?? 0, amount: generatedRow?.pagoAmount ?? 0 },
    total: { count: generatedRow?.totalCount ?? 0, amount: generatedRow?.totalAmount ?? 0 },
  } satisfies GeneratedBreakdown;

  const exchangedConditions = [
    eq(transactions.type, "TRANSFERENCIA"),
    notSystemParty,
    ...txTime,
  ];
  if (regionFilter) {
    exchangedConditions.push(
      or(eq(fromUser.region, regionFilter), eq(toUser.region, regionFilter))!
    );
  }
  if (residenceFromOrTo) {
    exchangedConditions.push(residenceFromOrTo);
  }

  const [exchangedRow] = await db
    .select({
      bazarCount: sql<number>`count(*) filter (where ${transactions.productId} IS NOT NULL)::int`,
      bazarAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.productId} IS NOT NULL), 0)::float`,
      libreCount: sql<number>`count(*) filter (where ${transactions.productId} IS NULL)::int`,
      libreAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.productId} IS NULL), 0)::float`,
      totalCount: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)::float`,
    })
    .from(transactions)
    .innerJoin(fromUser, eq(transactions.fromId, fromUser.id))
    .innerJoin(toUser, eq(transactions.toId, toUser.id))
    .where(and(...exchangedConditions));

  const exchangedBreakdown = {
    bazar: { count: exchangedRow?.bazarCount ?? 0, amount: exchangedRow?.bazarAmount ?? 0 },
    envioLibre: { count: exchangedRow?.libreCount ?? 0, amount: exchangedRow?.libreAmount ?? 0 },
    total: { count: exchangedRow?.totalCount ?? 0, amount: exchangedRow?.totalAmount ?? 0 },
  } satisfies ExchangedBreakdown;

  const txScopedConditions = [...txTime];
  if (regionFilter || countryFilter || stateFilter) {
    const memberIds = db
      .select({ id: users.id })
      .from(users)
      .where(and(...memberBase));
    txScopedConditions.push(
      or(
        inArray(transactions.fromId, memberIds),
        inArray(transactions.toId, memberIds)
      )!
    );
  }
  const transactionBreakdown = await loadTransactionBreakdown(txScopedConditions);

  return {
    period: input.period,
    label: window.label,
    from: window.from,
    to: window.to,
    timezone: "America/Mexico_City" as const,
    region: regionFilter ?? "Todas",
    country: countryFilter ?? "Todas",
    state: stateFilter ?? "Todas",
    members: {
      activos: memberCounts?.activos ?? 0,
      sinVerificar: memberCounts?.sinVerificar ?? 0,
      congelados: memberCounts?.congelados ?? 0,
      total: memberCounts?.total ?? 0,
    },
    jobs: {
      pendientes: jobCounts?.pendientes ?? 0,
      pagadas: jobCounts?.pagadas ?? 0,
      rechazadas: jobCounts?.rechazadas ?? 0,
    },
    generated: generatedBreakdown.total,
    exchanged: exchangedBreakdown.total,
    breakdown: {
      transactions: transactionBreakdown,
      generated: generatedBreakdown,
      exchanged: exchangedBreakdown,
    },
  };
}

export const statsRouter = createTRPCRouter({
  /** Aggregate platform indicators — any active socio */
  getSystemStats: protectedProcedure
    .input(z.object({ period: periodSchema.default("month") }).optional())
    .query(async ({ input }) => {
      const period = input?.period ?? "month";
      const window = periodWindow(period);
      const txTime = timeFilters(window.from, window.to, transactions.createdAt);
      const systemIds = [...SYSTEM_ACCOUNT_IDS];

      const breakdown = await loadTransactionBreakdown(txTime);
      const generatedBreakdown = await loadGeneratedBreakdown(systemIds, txTime);
      const exchangedBreakdown = await loadExchangedBreakdown(txTime);

      return {
        period,
        label: window.label,
        from: window.from,
        to: window.to,
        timezone: "America/Mexico_City" as const,
        transactions: { count: breakdown.total.count },
        generated: generatedBreakdown.total,
        exchanged: exchangedBreakdown.total,
        breakdown: {
          transactions: breakdown,
          generated: generatedBreakdown,
          exchanged: exchangedBreakdown,
        },
      };
    }),

  getRegionStats: coordinatorProcedure
    .input(
      z.object({
        period: periodSchema.default("month"),
        region: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const role = ctx.session.user.role as UserRole;
      const isGlobal = isGlobalCoordinator(role);

      let regionFilter: string | null = null;
      if (!isGlobal) {
        regionFilter = ctx.session.user.region;
      } else if (input.region && input.region !== "Todas") {
        regionFilter = input.region;
      }

      if (!isGlobal && input.region && input.region !== ctx.session.user.region) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Solo puedes ver indicadores de tu adscripción",
        });
      }

      const countryFilter =
        input.country && input.country !== "Todas" ? input.country : null;
      let stateFilter =
        input.state && input.state !== "Todas" ? input.state : null;
      if (stateFilter && (!countryFilter || !isMexicoCountry(countryFilter))) {
        stateFilter = null;
      }
      if (
        stateFilter &&
        !(MEXICO_STATES as readonly string[]).includes(stateFilter)
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estado no válido" });
      }

      const scoped = await computeScopedNetworkStats({
        period: input.period,
        regionFilter,
        countryFilter,
        stateFilter,
      });

      const countriesInDb = await db
        .selectDistinct({ country: users.residenceCountry })
        .from(users)
        .where(
          and(
            excludeTechnicalAccountsCondition(),
            isNotNull(users.residenceCountry),
            ne(users.residenceCountry, "")
          )
        );

      const countryOptions = new Set<string>([MEXICO_COUNTRY, ...RESIDENCE_COUNTRIES]);
      for (const row of countriesInDb) {
        const c = row.country?.trim();
        if (c && !isMexicoCountry(c)) countryOptions.add(c);
      }

      return {
        ...scoped,
        canSelectRegion: isGlobal,
        regions: [...ENROLLMENT_REGIONS],
        countries: Array.from(countryOptions).sort((a, b) => a.localeCompare(b, "es")),
        states: [...MEXICO_STATES],
      };
    }),

  /** Indicators by Mexican residence state — any active socio */
  getStateStats: protectedProcedure
    .input(
      z.object({
        period: periodSchema.default("month"),
        state: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let stateFilter =
        input.state && input.state !== "Todas" ? input.state : null;
      if (
        stateFilter &&
        !(MEXICO_STATES as readonly string[]).includes(stateFilter)
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Estado no válido" });
      }

      const scoped = await computeScopedNetworkStats({
        period: input.period,
        regionFilter: null,
        countryFilter: MEXICO_COUNTRY,
        stateFilter,
      });

      return {
        ...scoped,
        states: [...MEXICO_STATES],
      };
    }),

  /** Personal flow indicators for the signed-in socio */
  getMyStats: protectedProcedure
    .input(z.object({ period: periodSchema.default("month") }).optional())
    .query(async ({ ctx, input }) => {
      const period = input?.period ?? "month";
      const window = periodWindow(period);
      const txTime = timeFilters(window.from, window.to, transactions.createdAt);
      const userId = ctx.session.user.id;

      const [row] = await db
        .select({
          earnedCount: sql<number>`count(*) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'TRANSFERENCIA')::int`,
          earnedAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'TRANSFERENCIA'), 0)::float`,
          spentCount: sql<number>`count(*) filter (where ${transactions.fromId} = ${userId} AND ${transactions.type} = 'TRANSFERENCIA')::int`,
          spentAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.fromId} = ${userId} AND ${transactions.type} = 'TRANSFERENCIA'), 0)::float`,
          bazarCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NOT NULL AND (${transactions.fromId} = ${userId} OR ${transactions.toId} = ${userId}))::int`,
          bazarAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NOT NULL AND (${transactions.fromId} = ${userId} OR ${transactions.toId} = ${userId})), 0)::float`,
          libreCount: sql<number>`count(*) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NULL AND (${transactions.fromId} = ${userId} OR ${transactions.toId} = ${userId}))::int`,
          libreAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'TRANSFERENCIA' AND ${transactions.productId} IS NULL AND (${transactions.fromId} = ${userId} OR ${transactions.toId} = ${userId})), 0)::float`,
          bonoCount: sql<number>`count(*) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'BONO')::int`,
          bonoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'BONO'), 0)::float`,
          minadoCount: sql<number>`count(*) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'MINADO')::int`,
          minadoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'MINADO'), 0)::float`,
          pagoCount: sql<number>`count(*) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'PAGO_TRABAJO')::int`,
          pagoAmount: sql<number>`coalesce(sum(${transactions.amount}) filter (where ${transactions.toId} = ${userId} AND ${transactions.type} = 'PAGO_TRABAJO'), 0)::float`,
        })
        .from(transactions)
        .where(
          and(
            or(eq(transactions.fromId, userId), eq(transactions.toId, userId)),
            ...txTime
          )
        );

      const earned = sliceFromTotals(row?.earnedCount, row?.earnedAmount);
      const spent = sliceFromTotals(row?.spentCount, row?.spentAmount);
      const bazar = sliceFromTotals(row?.bazarCount, row?.bazarAmount);
      const envioLibre = sliceFromTotals(row?.libreCount, row?.libreAmount);
      const bonuses = sliceFromTotals(row?.bonoCount, row?.bonoAmount);
      const mining = sliceFromTotals(row?.minadoCount, row?.minadoAmount);
      const laborPay = sliceFromTotals(row?.pagoCount, row?.pagoAmount);
      const exchanged = {
        bazar,
        envioLibre,
        total: {
          count: bazar.count + envioLibre.count,
          amount: bazar.amount + envioLibre.amount,
        },
      };
      const receivedFromSystem = {
        bono: bonuses,
        minado: mining,
        pagoTrabajo: laborPay,
        total: {
          count: bonuses.count + mining.count + laborPay.count,
          amount: bonuses.amount + mining.amount + laborPay.amount,
        },
      };

      return {
        period,
        label: window.label,
        from: window.from,
        to: window.to,
        timezone: "America/Mexico_City" as const,
        earned,
        spent,
        exchanged,
        bonuses,
        mining,
        laborPay,
        receivedFromSystem,
      };
    }),
});
