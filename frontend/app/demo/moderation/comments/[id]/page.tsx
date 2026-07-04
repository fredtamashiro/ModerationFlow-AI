import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, FileClock, ShieldCheck } from "lucide-react";

import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { StatusBadge } from "@/components/moderation/status-badge";
import { ValueBadge } from "@/components/moderation/value-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicDemoComment, publicDemoComments } from "@/data/public-demo-moderation";
import { formatDateTime, formatLabel } from "@/lib/moderation";

export function generateStaticParams() {
  return publicDemoComments.map((comment) => ({ id: comment.id }));
}

export default async function PublicDemoCommentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comment = getPublicDemoComment(id);

  if (!comment) {
    notFound();
  }

  const comparison = comment.humanDecision.wasAiCorrect
    ? "A decisão humana confirmou a recomendação da IA."
    : "O moderador escolheu uma ação diferente da recomendação.";

  return (
    <PublicDemoShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/demo/moderation"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a fila demo
        </Link>
        <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
          Demonstração somente leitura
        </Badge>
      </div>

      <section className="grid gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">{comment.scenarioTitle}</h1>
        <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
          {comment.scenarioSummary} Esta tela mostra dados sintéticos e não permite
          executar análise, salvar decisão ou editar conteúdo.
        </p>
      </section>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={comment.status} />
            <span className="text-sm text-[var(--muted-foreground)]">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          <CardTitle>Comentário original</CardTitle>
          <CardDescription>
            {comment.authorName} / {comment.courseName} / {comment.lessonName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-base leading-8">{comment.content}</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--accent-secondary)]" />
              <CardTitle>Recomendação da IA</CardTitle>
            </div>
            <CardDescription>
              A recomendação ajuda a priorizar a revisão. Ela não decide pelo moderador.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact label="Ação recomendada" value={formatLabel(comment.aiRecommendation.recommendedAction)} />
              <Fact label="Categoria" value={formatLabel(comment.aiRecommendation.category)} />
              <Fact label="Risco" value={formatLabel(comment.aiRecommendation.riskLevel)} />
              <Fact label="Confiança" value={`${Math.round(comment.aiRecommendation.confidence * 100)}%`} />
              <Fact label="Rota" value={comment.aiRecommendation.route} />
              <Fact label="Critic agent" value={comment.aiRecommendation.criticApplied ? "Aplicado" : "Não aplicado"} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Regras relacionadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {comment.aiRecommendation.policyReferences.map((rule) => (
                  <Badge key={rule} className="border-[var(--border)] bg-[var(--surface-soft)]">
                    {rule}
                  </Badge>
                ))}
              </div>
            </div>
            <TextBlock label="Justificativa" value={comment.aiRecommendation.justification} />
          </CardContent>
        </Card>

        <Card className="border-[var(--accent-border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Decisão humana final</CardTitle>
            <CardDescription>
              Resultado já registrado para a demonstração. Novas decisões exigem acesso admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Fact
                label="Decisão"
                value={
                  <ValueBadge
                    value={comment.humanDecision.decision}
                    label={formatLabel(comment.humanDecision.decision)}
                  />
                }
              />
              <Fact label="Categoria final" value={formatLabel(comment.humanDecision.category)} />
              <Fact label="Risco final" value={formatLabel(comment.humanDecision.riskLevel)} />
              <Fact label="Decidido em" value={formatDateTime(comment.humanDecision.decidedAt)} />
            </div>
            <TextBlock label="Nota do moderador" value={comment.humanDecision.moderatorNote} />
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold">Comparação entre IA e humano</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{comparison}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <summary className="flex cursor-pointer items-center gap-2 p-5 text-base font-semibold">
          <FileClock className="h-5 w-5 text-[var(--accent-secondary)]" />
          Auditoria resumida
        </summary>
        <div className="grid gap-3 border-t border-[var(--border)] p-5">
          {comment.auditSteps.map((step) => (
            <div
              key={step.nodeName}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{step.nodeName}</p>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {step.status} / {step.durationMs}ms
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {step.summary}
              </p>
            </div>
          ))}
        </div>
      </details>
    </PublicDemoShell>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string | ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-7">
        {value}
      </p>
    </div>
  );
}
