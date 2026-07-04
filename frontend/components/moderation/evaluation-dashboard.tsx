"use client";

import { useState } from "react";
import { BarChart3, FileText, ShieldCheck } from "lucide-react";

import { AdminModerationNav } from "@/components/moderation/admin-moderation-nav";
import { DatasetCard } from "@/components/moderation/dataset-card";
import { MetricCard } from "@/components/moderation/metric-card";
import { StrategyComparisonTable } from "@/components/moderation/strategy-comparison-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  evaluationDatasets,
  evaluationSnapshotKind,
  getDataset,
  getFeaturedResult,
  getStrategy,
  methodologyCards,
} from "@/data/moderation-evaluation-snapshot";
import { cn } from "@/lib/utils";
import type { EvaluationDatasetKey } from "@/types/moderation-evaluation";

const learningPoints = [
  "O heurístico é rápido, determinístico e auditável.",
  "O baseline LLM generalizou bem em validação adversarial.",
  "Few-shot estático não trouxe ganho consistente.",
  "Dynamic few-shot ajudou em alguns cenários, mas não mostrou ganho universal.",
  "O guardrail R-004 melhorou o dataset safety, com trade-offs fora dele.",
  "Human-in-the-Loop continua obrigatório.",
];

const errorPatterns = [
  "offensive_language -> personal_attack",
  "medium -> high em spam explícito",
  "hate_or_discrimination -> personal_attack",
];

export function EvaluationDashboard() {
  const [selectedDataset, setSelectedDataset] = useState<EvaluationDatasetKey>("blind");
  const dataset = getDataset(selectedDataset);
  const featuredResult = getFeaturedResult(selectedDataset);
  const featuredStrategy = getStrategy(featuredResult.strategy);

  return (
    <div className="grid gap-6">
      <AdminModerationNav />

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-2">
            <Badge className="w-fit border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
              Snapshot de avaliação
            </Badge>
            <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
              Comparação offline de estratégias de moderação. Estes resultados orientam
              decisões técnicas, mas não substituem a revisão humana.
            </p>
          </div>
          <Badge className="w-fit border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-foreground)]">
            {evaluationSnapshotKind}
          </Badge>
        </div>
      </section>

      <Card className="border-[var(--accent-border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--accent-secondary)]" />
            <CardTitle>Estratégia atual do projeto</CardTitle>
          </div>
          <CardDescription>
            A decisão registrada no ADR-001 separa operação, pesquisa e experimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <DecisionBlock label="Fluxo principal" value="Heuristico + Human-in-the-Loop" />
          <DecisionBlock label="Pesquisa principal" value="Baseline LLM" />
          <DecisionBlock label="Experimentos" value="Dynamic few-shot e guardrail R-004" />
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted-foreground)] md:col-span-3">
            Referência técnica: docs/architecture/adr-001-moderation-strategy-decision.md.
            A regra central permanece: o modelo recomenda; o moderador decide.
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader className="grid gap-4">
          <div>
            <CardTitle>Metricas principais</CardTitle>
            <CardDescription>
              Dataset selecionado: {dataset.label}. Estratégia exibida: {featuredStrategy.label}.
            </CardDescription>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Selecionar dataset">
            {evaluationDatasets.map((item) => {
              const active = selectedDataset === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedDataset(item.key)}
                  className={cn(
                    "min-h-10 shrink-0 cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition",
                    active
                      ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]",
                  )}
                >
                  {item.shortLabel}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Action accuracy"
              value={featuredResult.accuracyAction}
              helper="Acerto da ação recomendada no snapshot documentado."
            />
            <MetricCard
              label="Risk accuracy"
              value={featuredResult.accuracyRiskLevel}
              helper="Acerto do nivel de risco no dataset selecionado."
            />
            <MetricCard
              label="Category accuracy"
              value={featuredResult.accuracyCategory}
              helper="Acerto da categoria de moderação."
            />
            <MetricCard
              label="Policy match rate"
              value={featuredResult.policyMatchRate}
              helper="Aderencia da regra/policy esperada."
            />
            <MetricCard
              label="Average latency"
              value={featuredResult.averageLatencyMs}
              unit="ms"
              helper="Latencia media quando documentada."
            />
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-7 text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)]">{featuredStrategy.label}</strong>:{" "}
            {featuredResult.observations} Fonte: {featuredResult.source}.
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent-secondary)]" />
            <CardTitle>Tabela comparativa de estrategias</CardTitle>
          </div>
          <CardDescription>
            Lacunas aparecem como Não avaliado. A variante guardrailed não é tratada como melhor modelo geral.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StrategyComparisonTable dataset={selectedDataset} />
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">Datasets e metodologia</h2>
          <p className="mt-1 text-sm leading-7 text-[var(--muted-foreground)]">
            Cada conjunto tem função diferente. Feedback examples não é benchmark, e adversarial
            pós-tuning não deve virar fonte imediata de novo tuning.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {methodologyCards.map((item) => (
            <DatasetCard key={item.key} dataset={item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <CardTitle>Principais aprendizados</CardTitle>
            <CardDescription>Leitura consolidada do ADR e das avaliações offline.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm leading-6 text-[var(--muted-foreground)]">
              {learningPoints.map((point) => (
                <li key={point} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--accent-secondary)]" />
              <CardTitle>Padroes observados</CardTitle>
            </div>
            <CardDescription>
              Resumo da taxonomia offline de erros, sem reproduzir o runner.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              {errorPatterns.map((pattern) => (
                <div
                  key={pattern}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium"
                >
                  {pattern}
                </div>
              ))}
            </div>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Esses padrões vêm da análise offline e ajudam a orientar calibração futura.
              Eles não promovem uma estratégia automaticamente nem removem a revisão humana.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DecisionBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
