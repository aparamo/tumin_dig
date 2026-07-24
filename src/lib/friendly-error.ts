/**
 * Turns UploadThing FileSizeMismatch cause / message into Spanish.
 * Cause shape: "You uploaded a image file that was 5.20MB, but the limit for that type is 4MB"
 */
function friendlyUploadThingSizeMessage(raw: string): string | null {
  const sizeMismatch = raw.match(
    /uploaded a (\S+) file that was ([^,]+), but the limit for that type is (\S+)/i,
  );
  if (sizeMismatch) {
    const [, type, actual, limit] = sizeMismatch;
    const typeLabel =
      type === "image" ? "imagen" : type === "video" ? "video" : type;
    return `El archivo (${typeLabel}) pesa ${actual} y el máximo permitido es ${limit}. Elige uno más ligero o comprímelo.`;
  }

  if (/FileSizeMismatch/i.test(raw) || /Invalid config:\s*FileSizeMismatch/i.test(raw)) {
    return "El archivo excede el tamaño máximo permitido (imágenes hasta 4 MB; avatar hasta 1 MB; videos según tu plan).";
  }

  if (/FileCountMismatch/i.test(raw) || /Invalid config:\s*FileCountMismatch/i.test(raw)) {
    return "Seleccionaste más archivos de los permitidos para este tipo de subida.";
  }

  return null;
}

/**
 * Turns tRPC / Zod / raw JSON error strings into a short Spanish message
 * safe to show in UI dialogs.
 */
export function toFriendlyErrorMessage(message: unknown): string {
  const raw = typeof message === "string" ? message.trim() : "";
  if (!raw) return "Algo salió mal. Intenta de nuevo.";

  const uploadThingMsg = friendlyUploadThingSizeMessage(raw);
  if (uploadThingMsg) return uploadThingMsg;

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
