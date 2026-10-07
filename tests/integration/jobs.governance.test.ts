import { describe, expect, it } from "vitest";
import { createTestCaller } from "../helpers/caller";
import { makeUser } from "../helpers/factories";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SYSTEM_USER_ID } from "@/lib/system-ids";
import { balanceOf } from "../helpers/ledger";

async function makePendingJob(requesterId: string, minutes = 30) {
  const [job] = await db
    .insert(jobs)
    .values({
      requesterId,
      description: "Labor comunitaria de prueba con descripción suficiente",
      minutes,
      amount: minutes,
      status: "PENDIENTE",
    })
    .returning();
  return job;
}

describe("system accounts excluded from verification queues", () => {
  it("hides SYSTEM from getUnverifiedUsers and rejects verifyUserIdentity", async () => {
    await db
      .update(users)
      .set({ isVerified: false })
      .where(eq(users.id, SYSTEM_USER_ID));

    const human = await makeUser({
      role: "SOCIO",
      region: "VERACRUZ",
      isVerified: false,
    });
    const coord = await makeUser({
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });
    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });

    const unverified = await caller.user.getUnverifiedUsers();
    expect(unverified.some((u) => u.id === SYSTEM_USER_ID)).toBe(false);
    expect(unverified.some((u) => u.id === human.id)).toBe(true);

    await expect(
      caller.user.verifyUserIdentity({ userId: SYSTEM_USER_ID, verified: true })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/sistema/i),
    });

    const advanced = await caller.user.getUsersAdvanced({ limit: 50 });
    expect(advanced.items.some((u) => u.id === SYSTEM_USER_ID)).toBe(false);
  });
});

describe("community vote veto", () => {
  it("blocks self-vote and blocks pay on majority disagreement with quorum", async () => {
    const requester = await makeUser({ region: "VERACRUZ" });
    const voter1 = await makeUser({ region: "VERACRUZ" });
    const voter2 = await makeUser({ region: "OAXACA" });
    const voter3 = await makeUser({ region: "CHIAPAS" });
    const coord = await makeUser({
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
    });
    const job = await makePendingJob(requester.id, 40);

    const requesterCaller = createTestCaller({
      id: requester.id,
      role: "SOCIO",
      region: requester.region,
      isVerified: true,
    });
    await expect(
      requesterCaller.jobs.voteOnJob({
        jobId: job.id,
        stance: "ACUERDO",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    for (const v of [voter1, voter2, voter3]) {
      const c = createTestCaller({
        id: v.id,
        role: "SOCIO",
        region: v.region,
        isVerified: true,
      });
      await c.jobs.voteOnJob({
        jobId: job.id,
        stance: "DESACUERDO",
        message: "No me parece labor comunitaria",
      });
    }

    const coordCaller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });

    await expect(
      coordCaller.jobs.verifyJob({ jobId: job.id, status: "PAGADO" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/mayoría|desacuerdo|comunidad/i),
    });

    expect(await balanceOf(requester.id)).toBe(0);

    await coordCaller.jobs.verifyJob({ jobId: job.id, status: "RECHAZADO" });
    const [after] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    expect(after.status).toBe("RECHAZADO");
  });

  it("allows pay without quorum", async () => {
    const requester = await makeUser({ region: "VERACRUZ" });
    const voter = await makeUser({ region: "VERACRUZ" });
    const coord = await makeUser({
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
    });
    const job = await makePendingJob(requester.id, 15);

    const voterCaller = createTestCaller({
      id: voter.id,
      role: "SOCIO",
      region: voter.region,
      isVerified: true,
    });
    await voterCaller.jobs.voteOnJob({
      jobId: job.id,
      stance: "DESACUERDO",
    });

    const coordCaller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    await coordCaller.jobs.verifyJob({ jobId: job.id, status: "PAGADO" });
    expect(await balanceOf(requester.id)).toBe(15);
  });
});

describe("coordinator dispute", () => {
  it("one flag does not block; two flags block; withdraw unblocks; CG resolves", async () => {
    const requester = await makeUser({ region: "VERACRUZ" });
    const c1 = await makeUser({ role: "COORDINADOR_LOCAL", region: "VERACRUZ" });
    const c2 = await makeUser({ role: "COORDINADOR", region: "OAXACA" });
    const cg = await makeUser({
      role: "COORDINADOR_GENERAL",
      region: "VERACRUZ",
    });
    const outsider = await makeUser({ role: "SOCIO", region: "CHIAPAS" });
    const job = await makePendingJob(requester.id, 20);

    const caller1 = createTestCaller({
      id: c1.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    const caller2 = createTestCaller({
      id: c2.id,
      role: "COORDINADOR",
      region: "OAXACA",
      isVerified: true,
    });
    const cgCaller = createTestCaller({
      id: cg.id,
      role: "COORDINADOR_GENERAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    const outsiderCaller = createTestCaller({
      id: outsider.id,
      role: "SOCIO",
      region: "CHIAPAS",
      isVerified: true,
    });

    const first = await caller1.jobs.flagJobDispute({
      jobId: job.id,
      reason: "La descripción no coincide con labor comunitaria real",
    });
    expect(first.paymentBlocked).toBe(false);
    expect(first.activeFlagCount).toBe(1);

    await expect(
      outsiderCaller.jobs.getJobDispute({ jobId: job.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      outsiderCaller.jobs.flagJobDispute({
        jobId: job.id,
        reason: "Intento de socio sin rol de coordinación",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Approving still allowed with one flag
    // (use a separate job for the two-flag block path)
    const job2 = await makePendingJob(requester.id, 25);
    await caller1.jobs.flagJobDispute({
      jobId: job2.id,
      reason: "Duda razonable sobre la veracidad del taller",
    });
    const second = await caller2.jobs.flagJobDispute({
      jobId: job2.id,
      reason: "Segundo señalamiento: no hay evidencia del evento",
    });
    expect(second.paymentBlocked).toBe(true);
    expect(second.activeFlagCount).toBe(2);

    await expect(
      caller1.jobs.verifyJob({ jobId: job2.id, status: "PAGADO" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/controversia/i),
    });

    const afterWithdraw = await caller2.jobs.withdrawJobDisputeFlag({
      jobId: job2.id,
    });
    expect(afterWithdraw.paymentBlocked).toBe(false);
    expect(afterWithdraw.activeFlagCount).toBe(1);

    // Re-flag to block again, then CG resolves
    await caller2.jobs.flagJobDispute({
      jobId: job2.id,
      reason: "Mantengo la controversia tras revisar nuevamente",
    });
    await expect(
      caller1.jobs.resolveJobDispute({
        jobId: job2.id,
        note: "No debería poder resolver un local",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await cgCaller.jobs.resolveJobDispute({
      jobId: job2.id,
      note: "Tras el hilo, se aclara que sí hubo taller documentado.",
    });

    await caller1.jobs.verifyJob({ jobId: job2.id, status: "PAGADO" });
    expect(await balanceOf(requester.id)).toBe(25);

    // First job (single flag) can still be paid
    await caller1.jobs.verifyJob({ jobId: job.id, status: "PAGADO" });
    expect(await balanceOf(requester.id)).toBe(45);
  });
});
