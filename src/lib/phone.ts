const DEFAULT_COUNTRY_CODE = "52"; // México

/** Digits only (no +, spaces, dashes). */
export function phoneDigits(rawPhone: string): string {
  return rawPhone.replace(/\D/g, "");
}

/** Normalizes a raw phone string to E.164 format (e.g. "+529611234567"). Assumes MX if no country code detected. */
export function toE164(rawPhone: string): string {
  const digits = phoneDigits(rawPhone);
  const withCountry = digits.startsWith(DEFAULT_COUNTRY_CODE)
    ? digits
    : `${DEFAULT_COUNTRY_CODE}${digits}`;
  return `+${withCountry}`;
}

/**
 * Candidate strings to match against `users.phone` as stored in DB
 * (legacy rows may be 10-digit local, with 52, with +, etc.).
 */
export function phoneLookupCandidates(raw: string): string[] {
  const digits = phoneDigits(raw);
  if (digits.length < 10) return digits ? [digits] : [];

  const local10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const with52 = local10.length === 10 ? `${DEFAULT_COUNTRY_CODE}${local10}` : digits;
  const e164 = `+${with52.startsWith(DEFAULT_COUNTRY_CODE) ? with52 : `${DEFAULT_COUNTRY_CODE}${local10}`}`;

  return [...new Set([raw.trim(), digits, local10, with52, e164, `+${digits}`])];
}

/** True if the identifier looks like a phone rather than an email. */
export function looksLikePhone(identifier: string): boolean {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return false;
  return phoneDigits(trimmed).length >= 10;
}
