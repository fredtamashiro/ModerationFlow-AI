import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ClipboardList, Eye, ShieldCheck } from "lucide-react";

import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { StatusBadge } from "@/components/moderation/status-badge";
import { ValueBadge } from "@/components/moderation/value-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicDemoComments } from "@/data/public-demo-moderation";
import { formatDateTime, formatLabel } from "@/lib/moderation";

const scenarioLinks = [
  {
    title: "Crítica ambígua",
    id: "ambiguous-sarcasm",
    description: "Mostra por que a decisão humana evita remoção indevida.",
  },
  {
    title: "Spam explícito",
    id: "clear-spam",
    description: "Mostra recomendação apoiada por regra de autopromoção.",
  },
  {
    title: "Conteúdo discriminatório",
    id: "potentially-discriminatory",
    description: "Mostra cuidado com risco alto, R-004 e auditoria.",
  },
] as const;

export default function PublicModerationDemoPage() {
  return (
    <PublicDemoShell>
      <section className="grid gap-4">
        <Badge className="w-fit border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
          Demonstração somente leitura
        </Badge>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">Fila demonstrativa</h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Explore como a moderação assistida por IA apresenta recomendações,
            regras relacionadas, decisão humana e auditoria. Nenhuma ação
            operacional está disponível nesta área pública.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo da demonstração">
        <SummaryCard label="Comentários demo" value={publicDemoComments.length} icon={ClipboardList} />
        <SummaryCard label="Decisões registradas" value={publicDemoComments.length} icon={ShieldCheck} />
        <SummaryCard label="Ações disponíveis" value={0} icon={Eye} helper="Somente leitura" />
      </section>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle>Cenários públicos</CardTitle>
          <CardDescription>
            Cada cenário reforça a diferença entre recomendação da IA e decisão humana.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {scenarioLinks.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/demo/moderation/comments/${scenario.id}`}
              className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]"
            >
              <span className="font-semibold">{scenario.title}</span>
              <span className="text-sm leading-6 text-[var(--muted-foreground)]">
                {scenario.description}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-secondary)]">
                Visualizar decisão
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle>Comentários demonstrativos</CardTitle>
          <CardDescription>
            Dados sintéticos e seguros para navegação pública. A decisão final exige
            acesso de moderador autenticado na área administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {publicDemoComments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={comment.status} />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{comment.scenarioTitle}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {comment.courseName} / {comment.lessonName}
                    </p>
                  </div>
                  <p className="text-sm leading-7">{comment.content}</p>
                </div>

                <div className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
                  <QueueFact
                    label="Categoria sugerida"
                    value={formatLabel(comment.aiRecommendation.category)}
                  />
                  <QueueFact
                    label="Risco sugerido"
                    value={
                      <ValueBadge
                        value={comment.aiRecommendation.riskLevel}
                        label={formatLabel(comment.aiRecommendation.riskLevel)}
                      />
                    }
                  />
                  <QueueFact
                    label="Decisão humana"
                    value={
                      <ValueBadge
                        value={comment.humanDecision.decision}
                        label={formatLabel(comment.humanDecision.decision)}
                      />
                    }
                  />
                  <Link
                    href={`/demo/moderation/comments/${comment.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                  >
                    Visualizar decisão
                  </Link>
                  <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                    Esta demonstração é somente leitura.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </PublicDemoShell>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  helper?: string;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="grid gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
          <Icon className="h-4 w-4 text-[var(--accent-secondary)]" />
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
          {helper ?? "Dados sintéticos"}
        </p>
      </CardContent>
    </Card>
  );
}

function QueueFact({
  label,
  value,
}: {
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
