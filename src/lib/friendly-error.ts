/**
 * Turns tRPC / Zod / raw JSON error strings into a short Spanish message
 * safe to show in UI dialogs.
 */
export function toFriendlyErrorMessage(message: unknown): string {
  const raw = typeof message === "string" ? message.trim() : "";
  if (!raw) return "Algo salió mal. Intenta de nuevo.";

  // Zod issue arrays sometimes arrive as JSON string in error.message
  if (raw.startsWith("[") || raw.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      const issues = Array.isArray(parsed)
        ? parsed
        : parsed &&
            typeof parsed === "object" &&
            "issues" in parsed &&
            Array.isArray((parsed as { issues: unknown }).issues)
          ? (parsed as { issues: unknown[] }).issues
          : null;

      if (issues && issues.length > 0) {
        const texts = issues
          .map((issue) => {
            if (issue && typeof issue === "object" && "message" in issue) {
              return String((issue as { message: unknown }).message);
            }
            return null;
          })
          .filter((m): m is string => !!m && !looksLikeRawZodCode(m));

        if (texts.length > 0) return texts.join(". ");
      }
    } catch {
      // fall through
    }
    return "Los datos enviados no son válidos. Revisa el formulario e intenta de nuevo.";
  }

  if (looksLikeRawZodCode(raw)) {
    return "Los datos enviados no son válidos. Revisa el formulario e intenta de nuevo.";
  }

  return raw;
}

function looksLikeRawZodCode(message: string): boolean {
  return (
    /"code"\s*:/.test(message) ||
    /^Too (big|small):/i.test(message) ||
    /^Invalid (input|type|string|enum)/i.test(message) ||
    /^Expected /i.test(message) ||
    /origin":\s*"string"/.test(message)
  );
}

export const NIP_SCHEMA_MESSAGE = "El NIP debe tener entre 4 y 6 caracteres";
