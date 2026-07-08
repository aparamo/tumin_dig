import { users } from "@/db/schema";
import { eq, or, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const ROLE_HIERARCHY = {
  SOCIO: 0,
  COORDINADOR_LOCAL: 1,
  COORDINADOR: 2,
  COORDINADOR_GENERAL: 3,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export function isCoordinator(role: UserRole): boolean {
  return role !== "SOCIO";
}

/**
 * Roles accepted by `regionalCoordinatorProcedure` (historical name).
 * Geographic scope is NOT implied here: `COORDINADOR` is global in jurisdiction
 * helpers (`isGlobalCoordinator` / `buildJurisdictionCondition`). Only
 * `COORDINADOR_LOCAL` is region-limited.
 */
export function isRegionalCoordinator(role: UserRole): boolean {
  return role === "COORDINADOR" || role === "COORDINADOR_LOCAL";
}

export function isGlobalCoordinator(role: UserRole): boolean {
  return role === "COORDINADOR" || role === "COORDINADOR_GENERAL";
}

/**
 * Determines whether the caller can assign the target role.
 *
 * Rules:
 * - Nobody can assign a role above their own.
 * - A coordinator local can only manage SOCIO.
 * - COORDINADOR is global in scope (no region limit), but cannot
 *   assign COORDINADOR_GENERAL.
 * - COORDINADOR_GENERAL can assign any role except COORDINADOR_GENERAL
 *   (protection for an existing CG target lives in `assertCanUpdateUserRole`).
 */
export function canManageRole(callerRole: UserRole, targetRole: UserRole): boolean {
  // Nobody can assign a role above their own.
  if (ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[callerRole]) return false;

  // Coordinator local can only manage regular members.
  if (callerRole === "COORDINADOR_LOCAL" && targetRole !== "SOCIO") return false;

  // Regional coordinator cannot assign the general coordinator role.
  if (callerRole === "COORDINADOR" && targetRole === "COORDINADOR_GENERAL") return false;

  // General coordinator cannot manage other general coordinators.
  if (callerRole === "COORDINADOR_GENERAL" && targetRole === "COORDINADOR_GENERAL") return false;

  return true;
}

export function assertCanManageRole(callerRole: UserRole, targetRole: UserRole): void {
  if (!canManageRole(callerRole, targetRole)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `No tienes permiso para asignar el rol ${targetRole}`,
    });
  }
}

/**
 * Full guard for role updates: blocks any in-app change to an existing
 * COORDINADOR_GENERAL (super-admin / ops only), and checks both current and new roles.
 */
export function assertCanUpdateUserRole(
  callerRole: UserRole,
  targetCurrentRole: UserRole,
  newRole: UserRole
): void {
  if (targetCurrentRole === "COORDINADOR_GENERAL") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Los Coordinadores Generales solo pueden modificarse fuera de la aplicación",
    });
  }
  if (!canManageRole(callerRole, targetCurrentRole)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `No tienes permiso para gestionar el rol ${targetCurrentRole}`,
    });
  }
  if (!canManageRole(callerRole, newRole)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `No tienes permiso para asignar el rol ${newRole}`,
    });
  }
}

export function assertNotSelf(callerId: string, targetId: string): void {
  if (callerId === targetId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No puedes modificar tu propio rol/estado" });
  }
}

/**
 * Builds a jurisdiction SQL condition.
 *
 * - COORDINADOR_GENERAL and COORDINADOR are global; no region filter.
 * - COORDINADOR_LOCAL is limited to their enrollment region OR residence state.
 */
export function buildJurisdictionCondition(
  caller: { role: UserRole; region: string },
  tableAlias = users
): SQL | undefined {
  if (caller.role === "COORDINADOR_GENERAL" || caller.role === "COORDINADOR") return undefined;
  return or(
    eq(tableAlias.region, caller.region),
    eq(tableAlias.residenceState, caller.region)
  );
}

/**
 * Checks whether a target user is under the caller's jurisdiction.
 *
 * - Global coordinators (COORDINADOR, COORDINADOR_GENERAL) can act on any user.
 * - COORDINADOR_LOCAL is limited to their enrollment region or residence state.
 */
export function isInJurisdiction(
  caller: { role: UserRole; region: string },
  target: { region: string | null; residenceState: string | null }
): boolean {
  if (caller.role === "COORDINADOR_GENERAL" || caller.role === "COORDINADOR") return true;
  return target.region === caller.region || target.residenceState === caller.region;
}

export function assertInJurisdiction(
  caller: { id: string; role: UserRole; region: string },
  target: { id: string; region: string | null; residenceState: string | null }
): void {
  if (caller.id === target.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No puedes modificar tu propia cuenta" });
  }
  if (!isInJurisdiction(caller, target)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "El socio está fuera de tu jurisdicción" });
  }
}
