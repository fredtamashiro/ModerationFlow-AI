import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { EvaluationDashboard } from "@/components/moderation/evaluation-dashboard";

export default function ModerationEvaluationsPage() {
  return (
    <AdminPageShell
      title="Avaliações e experimentos"
      description="Comparação offline de estratégias de moderação para orientar decisões técnicas."
    >
      <EvaluationDashboard />
    </AdminPageShell>
  );
}
