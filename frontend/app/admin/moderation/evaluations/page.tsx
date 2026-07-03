import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EvaluationDashboard } from "@/components/moderation/evaluation-dashboard";

export default function ModerationEvaluationsPage() {
  return (
    <AdminPageShell
      title="Avaliacoes e experimentos"
      description="Comparacao offline de estrategias de moderacao para orientar decisoes tecnicas."
    >
      <EvaluationDashboard />
    </AdminPageShell>
  );
}

