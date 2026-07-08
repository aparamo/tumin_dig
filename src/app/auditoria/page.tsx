import { requireCoordinator } from "@/lib/auth-utils";
import { DashboardShell } from "@/components/DashboardShell";
import { Auditoria } from "@/components/screens/Auditoria";

export default async function AuditoriaPage() {
  await requireCoordinator();

  return (
    <DashboardShell activeScreen="auditoria">
      <Auditoria />
    </DashboardShell>
  );
}
