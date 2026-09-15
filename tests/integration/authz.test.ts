import { describe, expect, it } from "vitest";
import { createTestCaller } from "../helpers/caller";
import { makeUser } from "../helpers/factories";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("protectedProcedure revalidation", () => {
  it("rejects when session user is frozen", async () => {
    const user = await makeUser({ status: "CONGELADO" });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });
    await expect(caller.wallet.getBalance()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects when session role/region disagree with DB", async () => {
    const user = await makeUser({ role: "SOCIO", region: "VERACRUZ" });
    const caller = createTestCaller({
      id: user.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });
    await expect(caller.wallet.getBalance()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: expect.stringMatching(/rol o región/i),
    });
  });

  it("rejects SYSTEM account sessions", async () => {
    const caller = createTestCaller({
      id: "SYSTEM",
      role: "SOCIO",
      region: "SISTEMA",
      isVerified: false,
    });
    await expect(caller.wallet.getBalance()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows an active matching session", async () => {
    const user = await makeUser();
    const caller = createTestCaller({
      id: user.id,
      role: user.role as "SOCIO",
      region: user.region,
      isVerified: user.isVerified,
    });
    const bal = await caller.wallet.getBalance();
    expect(bal.balance).toBe(0);
  });
});

describe("user.updateRole jurisdiction", () => {
  it("blocks COORDINADOR_LOCAL from acting outside their region", async () => {
    const local = await makeUser({
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
    });
    const outsider = await makeUser({
      role: "SOCIO",
      region: "OAXACA",
      residenceState: "Oaxaca",
    });
    const caller = createTestCaller({
      id: local.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    await expect(
      caller.user.updateRole({ userId: outsider.id, role: "SOCIO" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks self-promotion attempts", async () => {
    const local = await makeUser({ role: "COORDINADOR_LOCAL", region: "VERACRUZ" });
    const caller = createTestCaller({
      id: local.id,
      role: "COORDINADOR_LOCAL",
      region: "VERACRUZ",
      isVerified: true,
    });
    await expect(
      caller.user.updateRole({ userId: local.id, role: "COORDINADOR" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows COORDINADOR (global) to demote a SOCIO in another region", async () => {
    const coord = await makeUser({ role: "COORDINADOR", region: "VERACRUZ" });
    const target = await makeUser({
      role: "SOCIO",
      region: "OAXACA",
      residenceState: "Oaxaca",
    });
    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });
    // Promoting SOCIO → COORDINADOR_LOCAL is allowed for COORDINADOR
    await caller.user.updateRole({ userId: target.id, role: "COORDINADOR_LOCAL" });
    const [after] = await db.select().from(users).where(eq(users.id, target.id));
    expect(after.role).toBe("COORDINADOR_LOCAL");
  });

  it("blocks COORDINADOR from assigning COORDINADOR_GENERAL", async () => {
    const coord = await makeUser({ role: "COORDINADOR", region: "VERACRUZ" });
    const target = await makeUser({ role: "SOCIO", region: "VERACRUZ" });
    const caller = createTestCaller({
      id: coord.id,
      role: "COORDINADOR",
      region: "VERACRUZ",
      isVerified: true,
    });
    await expect(
      caller.user.updateRole({ userId: target.id, role: "COORDINADOR_GENERAL" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
