const DEFAULT_COUNTRY_CODE = "52"; // México

/** Normalizes a raw phone string to E.164 format (e.g. "+529611234567"). Assumes MX if no country code detected. */
export function toE164(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  const withCountry = digits.startsWith(DEFAULT_COUNTRY_CODE)
    ? digits
    : `${DEFAULT_COUNTRY_CODE}${digits}`;
  return `+${withCountry}`;
}
