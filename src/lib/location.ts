import { z } from "zod";

/** Canonical country name for Mexico in residence fields */
export const MEXICO_COUNTRY = "México" as const;

/** Sentinel for "other" enrollment region (DB + registration) */
export const ENROLLMENT_OTHER = "Otro" as const;

/** Filter sentinel: núcleos emergentes / no consolidados */
export const ENROLLMENT_FILTER_OTHERS = "Otras" as const;

/**
 * Regiones autónomas consolidadas + emergentes (valores canónicos en DB nueva).
 * Orden: consolidadas históricas, luego emergentes, luego Otro.
 */
export const ENROLLMENT_REGIONS = [
  "Túmin Totonacapan",
  "Túmin Chiapas",
  "Túmin Oaxaca",
  "Túmin Morelos",
  "Túmin Huasteca",
  "Túmin Tenoxca",
  "Túmin Náhuatl",
  "Túmin Tolteca",
  ENROLLMENT_OTHER,
] as const;

export type EnrollmentRegion = (typeof ENROLLMENT_REGIONS)[number];

/** Pre-migration / alternate labels still present in DB rows */
export const LEGACY_ENROLLMENT_REGIONS = [
  "Totonacapan - Veracruz",
  "Tolteca - Hidalgo",
  "Náhuatl - Morelos",
  "Huaxteca - San Luis/Tamaulipas",
  "Tenoxca - CDMX/EdoMex",
  "Chiapas",
  "Oaxaca",
  "Veracruz",
  "Hidalgo",
  "Morelos",
  "Estado de México",
  "Ciudad de México",
  "CDMX",
  "Puebla",
  "Yucatán",
  "Espinal",
  "Jalisco",
  "Guerrero",
  "Michoacán",
  "Tabasco",
  "Querétaro",
  "Toluca",
] as const;

/**
 * Filtros de región sin duplicados: Todas + consolidadas + Otras.
 * No lista legacy (se resuelven vía alias en el backend).
 */
export const ENROLLMENT_REGION_FILTER_OPTIONS = [
  "Todas",
  ...ENROLLMENT_REGIONS.filter((r) => r !== ENROLLMENT_OTHER),
  ENROLLMENT_FILTER_OTHERS,
] as const;

/** Optional short hint shown under each region in register (key = canonical value) */
export const ENROLLMENT_REGION_HINTS: Partial<Record<string, string>> = {
  "Túmin Totonacapan": "Sierra Norte de Veracruz y zonas limítrofes de Puebla",
  "Túmin Chiapas": "Red autónoma en Chiapas",
  "Túmin Oaxaca": "Oaxaca, Mazunte, Teotitlán del Valle",
  "Túmin Morelos": "Estado de Morelos",
  "Túmin Huasteca": "Huasteca Veracruzana, Tampico, SLP e Hidalgo",
  "Túmin Tenoxca": "CDMX y Estado de México",
  "Túmin Náhuatl": "Comunidades náhuatl (Puebla, Veracruz, Hidalgo)",
  "Túmin Tolteca": "Estado de México (p. ej. Texcoco)",
  [ENROLLMENT_OTHER]: "Otros núcleos (Jalisco, Guerrero, Michoacán, etc.)",
};

/** 32 Mexican states / entities */
export const MEXICO_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export type MexicoState = (typeof MEXICO_STATES)[number];

export const MEXICO_STATE_LABELS: Record<string, string> = {
  "Aguascalientes": "Ags",
  "Baja California": "BC",
  "Baja California Sur": "BCS",
  "Campeche": "Camp",
  "Chiapas": "Chps",
  "Chihuahua": "Chih",
  "Ciudad de México": "CDMX",
  "Coahuila": "Coah",
  "Colima": "Col",
  "Durango": "Dgo",
  "Estado de México": "EdoMex",
  "Guanajuato": "Gto",
  "Guerrero": "Gro",
  "Hidalgo": "Hgo",
  "Jalisco": "Jal",
  "Michoacán": "Mich",
  "Morelos": "Mor",
  "Nayarit": "Nay",
  "Nuevo León": "NL",
  "Oaxaca": "Oax",
  "Puebla": "Pue",
  "Querétaro": "Qro",
  "Quintana Roo": "Q.Roo",
  "San Luis Potosí": "SLP",
  "Sinaloa": "Sin",
  "Sonora": "Son",
  "Tabasco": "Tab",
  "Tamaulipas": "Tamps",
  "Tlaxcala": "Tlax",
  "Veracruz": "Ver",
  "Yucatán": "Yuc",
  "Zacatecas": "Zac",
};

/** Legacy / alternate labels → canonical enrollment region names */
const ENROLLMENT_REGION_ALIASES: Record<string, string> = {
  // Consolidadas (nombres previos)
  "Totonacapan - Veracruz": "Túmin Totonacapan",
  Veracruz: "Túmin Totonacapan",
  Espinal: "Túmin Totonacapan",
  Chiapas: "Túmin Chiapas",
  Oaxaca: "Túmin Oaxaca",
  Morelos: "Túmin Morelos",
  "Náhuatl - Morelos": "Túmin Morelos",
  "Huaxteca - San Luis/Tamaulipas": "Túmin Huasteca",
  Huasteca: "Túmin Huasteca",
  "Tenoxca - CDMX/EdoMex": "Túmin Tenoxca",
  CDMX: "Túmin Tenoxca",
  "Ciudad de México": "Túmin Tenoxca",
  "Ciudad de Mexico": "Túmin Tenoxca",
  "Estado de México": "Túmin Tenoxca",
  "Estado de Mexico": "Túmin Tenoxca",
  "Tolteca - Hidalgo": "Túmin Tolteca",
  Hidalgo: "Túmin Tolteca",
  // Prefijos cortos / variantes
  Totonacapan: "Túmin Totonacapan",
  Tenoxca: "Túmin Tenoxca",
  Tolteca: "Túmin Tolteca",
  Náhuatl: "Túmin Náhuatl",
  Nahuatl: "Túmin Náhuatl",
};

/** Residence / postal label aliases (not enrollment) */
const REGION_ALIASES: Record<string, string> = {
  Yucatan: "Yucatán",
  Michoacan: "Michoacán",
  Queretaro: "Querétaro",
  "San Luis Potosi": "San Luis Potosí",
};

export type EnrollmentMethod = "REGION" | "OTHER";

export interface ResidenceLocation {
  residenceCountry: string | null;
  residenceState: string | null;
  residenceCity: string | null;
  residencePostalCode: string | null;
}

export function normalizeEnrollmentRegion(value: string): string {
  const trimmed = value.trim();
  if ((ENROLLMENT_REGIONS as readonly string[]).includes(trimmed)) return trimmed;
  return ENROLLMENT_REGION_ALIASES[trimmed] ?? trimmed;
}

/**
 * All DB string values that belong to a consolidated region (canonical + aliases).
 * Used for directory/admin filters so legacy rows still match.
 */
export function getEnrollmentRegionDbValues(canonicalOrFilter: string): string[] {
  const canonical = normalizeEnrollmentRegion(canonicalOrFilter);
  const values = new Set<string>([canonical]);
  for (const [alias, target] of Object.entries(ENROLLMENT_REGION_ALIASES)) {
    if (target === canonical) values.add(alias);
  }
  return Array.from(values);
}

/** Every DB value that maps to a consolidated (non-Otro) region */
export function getAllConsolidatedEnrollmentDbValues(): string[] {
  const values = new Set<string>();
  for (const r of ENROLLMENT_REGIONS) {
    if (r === ENROLLMENT_OTHER) continue;
    for (const v of getEnrollmentRegionDbValues(r)) values.add(v);
  }
  return Array.from(values);
}

export function isEnrollmentFilterOthers(value: string): boolean {
  return value === ENROLLMENT_FILTER_OTHERS || value === ENROLLMENT_OTHER;
}

export function normalizeRegionLabel(value: string): string {
  const trimmed = value.trim();
  return REGION_ALIASES[trimmed] ?? trimmed;
}

export function isSystemUserRegion(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toUpperCase();
  return v === "SISTEMA" || v === "SYSTEM";
}

export function isKnownEnrollmentRegion(value: string): boolean {
  if (value === ENROLLMENT_OTHER) return true;
  const normalized = normalizeEnrollmentRegion(value);
  if ((ENROLLMENT_REGIONS as readonly string[]).includes(normalized)) return true;
  return (LEGACY_ENROLLMENT_REGIONS as readonly string[]).includes(value.trim());
}

export function isValidEnrollmentRegionForMethod(
  region: string,
  method: EnrollmentMethod
): boolean {
  if (method === "OTHER") {
    return region === ENROLLMENT_OTHER || region.trim().length >= 2;
  }
  const normalized = normalizeEnrollmentRegion(region);
  return (
    normalized !== ENROLLMENT_OTHER &&
    (ENROLLMENT_REGIONS as readonly string[]).includes(normalized)
  );
}

export function isMexicoCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  const c = country.trim().toLowerCase();
  return c === "méxico" || c === "mexico" || c === "mx";
}

export function formatPublicLocation(loc: ResidenceLocation): string | null {
  const { residenceCountry, residenceState, residenceCity } = loc;
  if (!residenceCountry && !residenceState && !residenceCity) return null;

  if (isMexicoCountry(residenceCountry)) {
    const parts: string[] = [];
    if (residenceCity?.trim()) parts.push(residenceCity.trim());
    if (residenceState?.trim()) parts.push(residenceState.trim());
    if (parts.length === 0) return MEXICO_COUNTRY;
    return `${parts.join(", ")}, ${MEXICO_COUNTRY}`;
  }

  const parts: string[] = [];
  if (residenceCity?.trim()) parts.push(residenceCity.trim());
  if (residenceCountry?.trim()) parts.push(residenceCountry.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

export function formatCompactLocation(loc: ResidenceLocation): string {
  if (isMexicoCountry(loc.residenceCountry) && loc.residenceState) {
    return (
      MEXICO_STATE_LABELS[loc.residenceState] ??
      MEXICO_STATE_LABELS[normalizeRegionLabel(loc.residenceState)] ??
      loc.residenceState
    );
  }
  if (loc.residenceCountry && !isMexicoCountry(loc.residenceCountry)) {
    const country = loc.residenceCountry.trim();
    if (country.length <= 12) return country;
    return country.slice(0, 10) + "…";
  }
  if (loc.residenceState) {
    return (
      MEXICO_STATE_LABELS[loc.residenceState] ?? loc.residenceState.slice(0, 8)
    );
  }
  return "—";
}

export function formatEnrollmentDisplay(
  region: string,
  method: EnrollmentMethod | string | null,
  methodOther: string | null
): string {
  if (method === "OTHER" || region === ENROLLMENT_OTHER) {
    return methodOther?.trim()
      ? `Otro: ${methodOther.trim()}`
      : "Otro (sin detalle)";
  }
  return normalizeEnrollmentRegion(region);
}

const enrollmentMethodSchema = z.enum(["REGION", "OTHER"]);

type ResidenceFieldsInput = {
  residenceCountry?: string | null;
  residenceState?: string | null;
  residenceCity?: string | null;
  residencePostalCode?: string | null;
};

function refineResidence(
  data: ResidenceFieldsInput,
  ctx: z.RefinementCtx,
  options?: { requireResidence?: boolean }
) {
  const country = data.residenceCountry?.trim() || null;
  const state = data.residenceState?.trim() || null;

  if (options?.requireResidence && !country) {
    ctx.addIssue({
      code: "custom",
      message: "Indica dónde vives actualmente.",
      path: ["residenceCountry"],
    });
    return;
  }

  if (country && isMexicoCountry(country) && !state) {
    ctx.addIssue({
      code: "custom",
      message: "Selecciona el estado donde vives.",
      path: ["residenceState"],
    });
    return;
  }

  if (
    country &&
    isMexicoCountry(country) &&
    state &&
    !(MEXICO_STATES as readonly string[]).includes(state)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Estado no válido.",
      path: ["residenceState"],
    });
  }

  if (country && !isMexicoCountry(country) && country.length < 2) {
    ctx.addIssue({
      code: "custom",
      message: "El país debe tener al menos 2 caracteres.",
      path: ["residenceCountry"],
    });
  }
}

function refineEnrollment(
  data: {
    region: string;
    enrollmentMethod: EnrollmentMethod;
    enrollmentMethodOther?: string | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.enrollmentMethod === "OTHER") {
    const other = data.enrollmentMethodOther?.trim() ?? "";
    if (other.length < 5) {
      ctx.addIssue({
        code: "custom",
        message: "Cuéntanos brevemente cómo te inscribiste (mín. 5 caracteres).",
        path: ["enrollmentMethodOther"],
      });
    }
    return;
  }

  if (!isValidEnrollmentRegionForMethod(data.region, "REGION")) {
    ctx.addIssue({
      code: "custom",
      message: "Selecciona la región donde te inscribiste.",
      path: ["region"],
    });
  }
}

/** Registration payload (includes personal fields + location) */
export const registerLocationSchema = z
  .object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal("")),
    region: z.string().min(2),
    enrollmentMethod: enrollmentMethodSchema,
    enrollmentMethodOther: z.string().trim().max(240).optional().nullable(),
    residenceCountry: z.string().trim().max(80).optional().nullable(),
    residenceState: z.string().trim().max(80).optional().nullable(),
    residenceCity: z.string().trim().max(120).optional().nullable(),
    residencePostalCode: z.string().trim().max(24).optional().nullable(),
    nip: z
      .string()
      .min(4, "El NIP debe tener entre 4 y 6 caracteres")
      .max(6, "El NIP debe tener entre 4 y 6 caracteres"),
    referrerId: z.string().optional(),
    inviteToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    refineEnrollment(data, ctx);
    refineResidence(data, ctx, { requireResidence: true });
  });

export type RegisterLocationInput = z.infer<typeof registerLocationSchema>;

/** Profile location update */
export const updateLocationSchema = z
  .object({
    region: z.string().min(2).optional(),
    enrollmentMethod: enrollmentMethodSchema.optional(),
    enrollmentMethodOther: z.string().trim().max(240).nullable().optional(),
    residenceCountry: z.string().trim().max(80).nullable().optional(),
    residenceState: z.string().trim().max(80).nullable().optional(),
    residenceCity: z.string().trim().max(120).nullable().optional(),
    residencePostalCode: z.string().trim().max(24).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.enrollmentMethod !== undefined || data.region !== undefined) {
      const method = data.enrollmentMethod ?? "REGION";
      const region = data.region ?? "";
      if (region || method === "OTHER") {
        refineEnrollment(
          {
            region: region || ENROLLMENT_OTHER,
            enrollmentMethod: method,
            enrollmentMethodOther: data.enrollmentMethodOther,
          },
          ctx
        );
      }
    }
    refineResidence(data, ctx);
  });

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

export function normalizeResidenceFields(input: {
  residenceCountry?: string | null;
  residenceState?: string | null;
  residenceCity?: string | null;
  residencePostalCode?: string | null;
}): {
  residenceCountry: string | null;
  residenceState: string | null;
  residenceCity: string | null;
  residencePostalCode: string | null;
} {
  const country = input.residenceCountry?.trim() || null;
  const state = input.residenceState?.trim() || null;
  const city = input.residenceCity?.trim() || null;
  const postal = input.residencePostalCode?.trim() || null;

  return {
    residenceCountry: country,
    residenceState: isMexicoCountry(country) ? state : null,
    residenceCity: city,
    residencePostalCode: postal,
  };
}

export function resolveEnrollmentRegionForStorage(
  region: string,
  method: EnrollmentMethod
): string {
  if (method === "OTHER") return ENROLLMENT_OTHER;
  return normalizeEnrollmentRegion(region);
}
