import { describe, expect, it } from "vitest";
import {
  canManageRole,
  assertCanManageRole,
  assertCanUpdateUserRole,
  assertNotSelf,
  isCoordinator,
  isRegionalCoordinator,
  isGlobalCoordinator,
  isInJurisdiction,
  assertInJurisdiction,
  type UserRole,
} from "@/lib/trpc/authorization";
import { TRPCError } from "@trpc/server";

const ROLES: UserRole[] = [
  "SOCIO",
  "COORDINADOR_LOCAL",
  "COORDINADOR",
  "COORDINADOR_GENERAL",
];

describe("isCoordinator / isRegionalCoordinator / isGlobalCoordinator", () => {
  it.each([
    ["SOCIO", false],
    ["COORDINADOR_LOCAL", true],
    ["COORDINADOR", true],
    ["COORDINADOR_GENERAL", true],
  ] as const)("isCoordinator(%s) → %s", (role, expected) => {
    expect(isCoordinator(role)).toBe(expected);
  });

  it("COORDINADOR is regional-procedure-eligible but globally scoped", () => {
    expect(isRegionalCoordinator("COORDINADOR")).toBe(true);
    expect(isGlobalCoordinator("COORDINADOR")).toBe(true);
  });

  it("only COORDINADOR_LOCAL is region-limited among regional-procedure roles", () => {
    expect(isRegionalCoordinator("COORDINADOR_LOCAL")).toBe(true);
    expect(isGlobalCoordinator("COORDINADOR_LOCAL")).toBe(false);
  });
});

describe("canManageRole matrix", () => {
  const cases: Array<[UserRole, UserRole, boolean]> = [
    ["SOCIO", "SOCIO", true],
    ["SOCIO", "COORDINADOR_LOCAL", false],
    ["COORDINADOR_LOCAL", "SOCIO", true],
    ["COORDINADOR_LOCAL", "COORDINADOR_LOCAL", false],
    ["COORDINADOR_LOCAL", "COORDINADOR", false],
    ["COORDINADOR", "SOCIO", true],
    ["COORDINADOR", "COORDINADOR_LOCAL", true],
    ["COORDINADOR", "COORDINADOR", true],
    ["COORDINADOR", "COORDINADOR_GENERAL", false],
    ["COORDINADOR_GENERAL", "SOCIO", true],
    ["COORDINADOR_GENERAL", "COORDINADOR", true],
    ["COORDINADOR_GENERAL", "COORDINADOR_GENERAL", false],
  ];

  it.each(cases)("%s → %s = %s", (caller, target, expected) => {
    expect(canManageRole(caller, target)).toBe(expected);
  });

  it("nobody can assign a role above their own", () => {
    for (const caller of ROLES) {
      for (const target of ROLES) {
        if (
          // hierarchy check is the first gate
          ({ SOCIO: 0, COORDINADOR_LOCAL: 1, COORDINADOR: 2, COORDINADOR_GENERAL: 3 } as const)[
            target
          ] >
          ({ SOCIO: 0, COORDINADOR_LOCAL: 1, COORDINADOR: 2, COORDINADOR_GENERAL: 3 } as const)[
            caller
          ]
        ) {
          expect(canManageRole(caller, target)).toBe(false);
        }
      }
    }
  });
});

describe("assertCanUpdateUserRole", () => {
  it("blocks any in-app change to an existing COORDINADOR_GENERAL", () => {
    expect(() =>
      assertCanUpdateUserRole("COORDINADOR_GENERAL", "COORDINADOR_GENERAL", "SOCIO")
    ).toThrow(TRPCError);
  });

  it("allows COORDINADOR to demote a COORDINADOR_LOCAL to SOCIO", () => {
    expect(() =>
      assertCanUpdateUserRole("COORDINADOR", "COORDINADOR_LOCAL", "SOCIO")
    ).not.toThrow();
  });

  it("assertCanManageRole throws when canManageRole is false", () => {
    expect(() => assertCanManageRole("SOCIO", "COORDINADOR")).toThrow(TRPCError);
  });
});

describe("assertNotSelf / jurisdiction", () => {
  it("assertNotSelf throws on same id", () => {
    expect(() => assertNotSelf("a", "a")).toThrow(TRPCError);
    expect(() => assertNotSelf("a", "b")).not.toThrow();
  });

  it("COORDINADOR is global regardless of region", () => {
    expect(
      isInJurisdiction(
        { role: "COORDINADOR", region: "VERACRUZ" },
        { region: "OAXACA", residenceState: "Oaxaca" }
      )
    ).toBe(true);
  });

  it("COORDINADOR_LOCAL matches enrollment region or residence state", () => {
    const caller = { role: "COORDINADOR_LOCAL" as const, region: "VERACRUZ" };
    expect(isInJurisdiction(caller, { region: "VERACRUZ", residenceState: null })).toBe(true);
    expect(isInJurisdiction(caller, { region: "OAXACA", residenceState: "VERACRUZ" })).toBe(true);
    expect(isInJurisdiction(caller, { region: "OAXACA", residenceState: "Oaxaca" })).toBe(false);
  });

  it("assertInJurisdiction blocks self and out-of-jurisdiction", () => {
    const caller = { id: "me", role: "COORDINADOR_LOCAL" as const, region: "VERACRUZ" };
    expect(() =>
      assertInJurisdiction(caller, {
        id: "me",
        region: "VERACRUZ",
        residenceState: null,
      })
    ).toThrow(/propia cuenta/);
    expect(() =>
      assertInJurisdiction(caller, {
        id: "other",
        region: "OAXACA",
        residenceState: "Oaxaca",
      })
    ).toThrow(/jurisdicción/);
  });
});
