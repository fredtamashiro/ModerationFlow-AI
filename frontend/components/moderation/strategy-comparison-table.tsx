import {
  evaluationStrategies,
  getResult,
} from "@/data/moderation-evaluation-snapshot";
import { cn } from "@/lib/utils";
import type {
  EvaluationDatasetKey,
  EvaluationResult,
  EvaluationStrategy,
  MetricValue,
} from "@/types/moderation-evaluation";

function formatPercent(value: MetricValue): string {
  if (value === null) {
    return "Nao avaliado";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function formatLatency(value: MetricValue): string {
  if (value === null) {
    return "Nao avaliado";
  }

  return `${Math.round(value)}ms`;
}

function roleLabel(strategy: EvaluationStrategy): string {
  if (strategy.role === "main_flow") {
    return "Fluxo principal";
  }

  if (strategy.role === "research_baseline") {
    return "Baseline de pesquisa";
  }

  if (strategy.role === "historical_experiment") {
    return "Experimento historico";
  }

  return "Experimento";
}

function roleClass(strategy: EvaluationStrategy): string {
  if (strategy.role === "main_flow") {
    return "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]";
  }

  if (strategy.role === "research_baseline") {
    return "border-[#b7d4ea] bg-[#edf7ff] text-[#0f5d7a]";
  }

  return "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-foreground)]";
}

function ObservationCell({ result }: { result: EvaluationResult | null }) {
  if (!result) {
    return <span className="text-[var(--muted-foreground)]">Sem metrica documentada nesta combinacao.</span>;
  }

  return (
    <span>
      {result.observations} <span className="text-[var(--muted-foreground)]">({result.source})</span>
    </span>
  );
}

export function StrategyComparisonTable({ dataset }: { dataset: EvaluationDatasetKey }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="min-w-[920px] divide-y divide-[var(--border)] text-left text-sm">
        <thead className="bg-[var(--surface-soft)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Estrategia</th>
            <th className="px-4 py-3 font-semibold">Action</th>
            <th className="px-4 py-3 font-semibold">Risk</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Policy</th>
            <th className="px-4 py-3 font-semibold">Latencia</th>
            <th className="px-4 py-3 font-semibold">Failed runs</th>
            <th className="px-4 py-3 font-semibold">Leitura</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
          {evaluationStrategies.map((strategy) => {
            const result = getResult(dataset, strategy.key);

            return (
              <tr key={strategy.key} className="align-top">
                <td className="px-4 py-4">
                  <div className="grid gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{strategy.label}</span>
                    <span
                      className={cn(
                        "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                        roleClass(strategy),
                      )}
                    >
                      {roleLabel(strategy)}
                    </span>
                    <span className="text-xs leading-5 text-[var(--muted-foreground)]">
                      {strategy.summary}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">{formatPercent(result?.accuracyAction ?? null)}</td>
                <td className="px-4 py-4">{formatPercent(result?.accuracyRiskLevel ?? null)}</td>
                <td className="px-4 py-4">{formatPercent(result?.accuracyCategory ?? null)}</td>
                <td className="px-4 py-4">{formatPercent(result?.policyMatchRate ?? null)}</td>
                <td className="px-4 py-4">{formatLatency(result?.averageLatencyMs ?? null)}</td>
                <td className="px-4 py-4">
                  {result?.failedRuns === null || result?.failedRuns === undefined
                    ? "Nao avaliado"
                    : result.failedRuns}
                </td>
                <td className="max-w-[24rem] px-4 py-4 leading-6">
                  <ObservationCell result={result} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

