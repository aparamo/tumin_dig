import { requireCoordinator } from "@/lib/auth-utils";
import { DashboardShell } from "@/components/DashboardShell";
import { Coordinacion } from "@/components/screens/Coordinacion";

export default async function CoordinacionPage() {
  await requireCoordinator();

  return (
    <DashboardShell activeScreen="coordinacion">
      <Coordinacion />
    </DashboardShell>
  );
}
