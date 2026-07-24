import { TRPCClientError } from "@trpc/client";
import { toFriendlyErrorMessage } from "./friendly-error";

const ZOD_CODE_MAP: Record<string, string> = {
  too_big: "es demasiado largo",
  too_small: "es demasiado corto",
  invalid_string: "no tiene un formato válido",
  invalid_type: "no es del tipo esperado",
  invalid_enum_value: "no es un valor permitido",
  custom: "no es válido",
};

const FIELD_MAP: Record<string, string> = {
  nip: "El NIP",
  phone: "El teléfono",
  email: "El correo",
  name: "El nombre",
  description: "La descripción",
  minutes: "Los minutos",
  region: "La región",
  residenceState: "El estado",
  residenceCountry: "El país",
  title: "El título",
  body: "El mensaje",
  imageUrl: "La imagen",
  linkUrl: "El link",
  token: "El código de invitación",
  referrerId: "El referido",
};

function looksLikeZodIssues(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.code) return true;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.issues)) return true;
    return false;
  } catch {
    return false;
  }
}

function parseZodIssues(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const issues = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && "issues" in parsed
        ? (parsed as { issues: unknown[] }).issues
        : null;

    if (!issues || issues.length === 0) return null;

    const texts = issues
      .map((issue) => {
        if (!issue || typeof issue !== "object") return null;
        const { code, path, message } = issue as { code?: string; path?: unknown[]; message?: string };
        const fieldKey = Array.isArray(path) && path.length > 0 ? String(path[0]) : null;
        const fieldLabel = fieldKey ? FIELD_MAP[fieldKey] ?? fieldKey : null;
        const codeMsg = code && ZOD_CODE_MAP[code] ? ZOD_CODE_MAP[code] : message;
        if (fieldLabel && codeMsg) {
          return `${fieldLabel} ${codeMsg}`;
        }
        return codeMsg || null;
      })
      .filter((m): m is string => !!m);

    return texts.length > 0 ? texts.join(". ") : null;
  } catch {
    return null;
  }
}

type UploadThingErrorData = {
  cause?: unknown;
  zodError?: unknown;
};

function getUploadThingCause(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const data = (err as { data?: UploadThingErrorData }).data;
  if (!data || typeof data !== "object") return null;
  const cause = data.cause;
  if (typeof cause === "string" && cause.trim()) return cause.trim();
  if (cause instanceof Error && cause.message) return cause.message;
  return null;
}

/**
 * Convierte cualquier error de tRPC/Zod/UploadThing/mensaje raw en un texto legible
 * y seguro para mostrar en la UI.
 */
export function parseErrorMessage(err: unknown): string {
  const utCause = getUploadThingCause(err);
  if (utCause) {
    return toFriendlyErrorMessage(utCause);
  }

  if (typeof err === "string") {
    if (looksLikeZodIssues(err)) {
      return parseZodIssues(err) ?? toFriendlyErrorMessage(err);
    }
    return toFriendlyErrorMessage(err);
  }

  if (err instanceof TRPCClientError) {
    const msg = err.message;
    if (looksLikeZodIssues(msg)) {
      return parseZodIssues(msg) ?? toFriendlyErrorMessage(msg);
    }
    if (err.data && typeof err.data === "object" && (err.data as { zodError?: unknown }).zodError) {
      const zodError = (err.data as { zodError: unknown }).zodError;
      if (typeof zodError === "string" && looksLikeZodIssues(zodError)) {
        return parseZodIssues(zodError) ?? toFriendlyErrorMessage(msg);
      }
    }
    return toFriendlyErrorMessage(msg);
  }

  if (err instanceof Error) {
    return toFriendlyErrorMessage(err.message);
  }

  return "Algo salió mal. Intenta de nuevo.";
}
