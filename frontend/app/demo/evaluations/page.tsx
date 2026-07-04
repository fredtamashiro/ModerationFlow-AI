import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { EvaluationDashboard } from "@/components/moderation/evaluation-dashboard";
import { Badge } from "@/components/ui/badge";

export default function PublicDemoEvaluationsPage() {
  return (
    <PublicDemoShell>
      <section className="grid gap-4">
        <Badge className="w-fit border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
          Demonstração somente leitura
        </Badge>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">Avaliações e experimentos</h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Snapshot público documentado. Esta página mostra estratégia principal,
            experimentos, trade-offs e Human-in-the-Loop sem executar runners pelo navegador.
          </p>
        </div>
      </section>

      <EvaluationDashboard showAdminNav={false} />
    </PublicDemoShell>
  );
}

