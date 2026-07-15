/**
 * Generates a URL-safe random invite token.
 * Avoids ambiguous characters (0, O, 1, l, I) for easier manual typing.
 */
export function generateInviteToken(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

/** Returns a date 7 days from now. */
export function getTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}
