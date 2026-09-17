/** Postgres unique_violation — used as a second line of defense for daily mining. */
export function isPgUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const code =
    "code" in err && typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : null;
  if (code === "23505") return true;

  const cause = "cause" in err ? (err as { cause: unknown }).cause : null;
  if (cause && typeof cause === "object" && "code" in cause) {
    return (cause as { code: unknown }).code === "23505";
  }

  return false;
}
