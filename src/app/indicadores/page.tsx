import { requireUser } from "@/lib/auth-utils";
import { DashboardShell } from "@/components/DashboardShell";
import { Indicadores } from "@/components/screens/Indicadores";

export default async function IndicadoresPage() {
  await requireUser();

  return (
    <DashboardShell activeScreen="indicadores">
      <Indicadores />
    </DashboardShell>
  );
}
