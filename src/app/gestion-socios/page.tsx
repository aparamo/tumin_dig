import { requireCoordinator } from "@/lib/auth-utils";
import { DashboardShell } from "@/components/DashboardShell";
import { GestionRoles } from "@/components/screens/GestionRoles";

export default async function GestionSociosPage() {
  await requireCoordinator();

  return (
    <DashboardShell activeScreen="gestion-roles">
      <GestionRoles />
    </DashboardShell>
  );
}
