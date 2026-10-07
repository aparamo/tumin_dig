import { auth } from "@/auth";
import { redirect, forbidden } from "next/navigation";

const COORDINATOR_ROLES = new Set([
  "COORDINADOR_LOCAL",
  "COORDINADOR",
  "COORDINADOR_GENERAL",
]);

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireCoordinator() {
  const session = await requireUser();

  if (!COORDINATOR_ROLES.has(session.user.role)) {
    forbidden();
  }

  return session;
}
