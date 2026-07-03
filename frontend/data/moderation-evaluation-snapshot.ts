import type {
  EvaluationDataset,
  EvaluationDatasetKey,
  EvaluationResult,
  EvaluationStrategy,
  EvaluationStrategyKey,
} from "@/types/moderation-evaluation";

export const evaluationSnapshotKind = "snapshot_documented" as const;

export const evaluationDatasets: EvaluationDataset[] = [
  {
    key: "main",
    label: "Main",
    shortLabel: "Main",
    role: "Baseline principal de tuning heuristico.",
    benchmarkStatus: "Benchmark documentado.",
    tuningUsage: "Ja foi usado para tuning do baseline heuristico; nao mede generalizacao externa.",
    description: "Conjunto principal com 75 exemplos apos retuning do baseline heuristico.",
  },
  {
    key: "holdout",
    label: "Holdout",
    shortLabel: "Holdout",
    role: "Verificacao separada durante tuning heuristico.",
    benchmarkStatus: "Benchmark documentado.",
    tuningUsage: "Nao deve virar alvo de iteracao indefinida.",
    description: "Conjunto de 35 exemplos usado para validar ganho fora do main.",
  },
  {
    key: "blind",
    label: "Blind",
    shortLabel: "Blind",
    role: "Generalizacao fora dos conjuntos conhecidos.",
    benchmarkStatus: "Benchmark documentado.",
    tuningUsage: "Usado para comparacoes offline entre heuristico, LLM e few-shot.",
    description: "Conjunto com 32 exemplos que expõe variacoes lexicais e fronteiras semanticas.",
  },
  {
    key: "safety",
    label: "Safety regression",
    shortLabel: "Safety",
    role: "Regressao sensivel para R-004 e discriminacao.",
    benchmarkStatus: "Benchmark documentado.",
    tuningUsage: "Deve proteger casos de seguranca, sem decidir sozinho a estrategia geral.",
    description: "Conjunto focado em hate_or_discrimination, R-004 e fronteiras de personal_attack.",
  },
  {
    key: "adversarial",
    label: "Adversarial pos-tuning",
    shortLabel: "Adversarial",
    role: "Validacao independente apos ciclos de tuning.",
    benchmarkStatus: "Benchmark documentado.",
    tuningUsage: "Nao deve virar fonte imediata de novo tuning.",
    description: "Conjunto novo com 30 exemplos sinteticos para auditoria externa da versao atual.",
  },
];

export const methodologyCards = [
  ...evaluationDatasets,
  {
    key: "feedback_examples",
    label: "Feedback examples",
    shortLabel: "Feedback",
    role: "Fonte curada de exemplos humanos para experimentos few-shot.",
    benchmarkStatus: "Nao e benchmark.",
    tuningUsage: "Pode orientar experimentos, mas nao deve ser usado como metrica de avaliacao.",
    description: "Exemplos humanos ajudam a construir prompts e cenarios, sem substituir datasets separados.",
  },
];

export const evaluationStrategies: EvaluationStrategy[] = [
  {
    key: "heuristic",
    label: "Heuristico",
    role: "main_flow",
    summary: "Fluxo principal atual: rapido, deterministico, auditavel e sempre seguido de HITL.",
  },
  {
    key: "baseline_llm",
    label: "Baseline LLM",
    role: "research_baseline",
    summary: "Referencia principal de pesquisa para medir generalizacao sem exemplos few-shot.",
  },
  {
    key: "static_few_shot",
    label: "Few-shot estatico",
    role: "historical_experiment",
    summary: "Experimento com exemplos humanos fixos; nao trouxe ganho consistente.",
  },
  {
    key: "dynamic_few_shot",
    label: "Dynamic few-shot",
    role: "experiment",
    summary: "Experimento com selecao deterministica de exemplos; ajudou cenarios especificos.",
  },
  {
    key: "dynamic_few_shot_guardrailed",
    label: "Dynamic few-shot guardrailed",
    role: "experiment",
    summary: "Variante com guardrail R-004; forte no safety, sem superioridade universal.",
  },
];

export const featuredResultByDataset: Record<EvaluationDatasetKey, EvaluationStrategyKey> = {
  main: "heuristic",
  holdout: "heuristic",
  blind: "dynamic_few_shot",
  safety: "dynamic_few_shot_guardrailed",
  adversarial: "baseline_llm",
};

export const evaluationResults: EvaluationResult[] = [
  {
    dataset: "main",
    strategy: "heuristic",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 100,
    policyMatchRate: 100,
    averageLatencyMs: 5,
    failedRuns: 0,
    observations: "Hardened baseline retuning no dataset principal.",
    source: "docs/evaluation.md, Etapa 015",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "holdout",
    strategy: "heuristic",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 94.29,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Retuning melhorou action, risk e policy; restaram desvios finos de categoria.",
    source: "docs/evaluation.md, Etapa 017",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "blind",
    strategy: "heuristic",
    accuracyAction: 68.75,
    accuracyRiskLevel: 68.75,
    accuracyCategory: 71.88,
    policyMatchRate: 100,
    averageLatencyMs: 5,
    failedRuns: 0,
    observations: "Generalizacao parcial fora dos conjuntos conhecidos.",
    source: "docs/evaluation.md, Etapa 018",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "blind",
    strategy: "baseline_llm",
    accuracyAction: 93.75,
    accuracyRiskLevel: 87.5,
    accuracyCategory: 87.5,
    policyMatchRate: 93.75,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Baseline LLM usado como referencia comparativa na etapa de calibragem posterior.",
    source: "docs/evaluation.md, Etapa 039 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "blind",
    strategy: "static_few_shot",
    accuracyAction: 93.75,
    accuracyRiskLevel: 87.5,
    accuracyCategory: 87.5,
    policyMatchRate: 93.75,
    averageLatencyMs: 6721,
    failedRuns: 0,
    observations: "Few-shot estatico empatou com baseline LLM na rodada simples.",
    source: "docs/evaluation.md, Etapa 035",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "blind",
    strategy: "dynamic_few_shot",
    accuracyAction: 96.88,
    accuracyRiskLevel: 90.62,
    accuracyCategory: 87.5,
    policyMatchRate: 96.88,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Rodada simples apos calibragem de spam explicito e fronteira de alvo.",
    source: "docs/evaluation.md, Etapa 039",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "blind",
    strategy: "dynamic_few_shot_guardrailed",
    accuracyAction: 96.88,
    accuracyRiskLevel: 90.62,
    accuracyCategory: 87.5,
    policyMatchRate: 96.88,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Guardrail manteve action/risk, mas nao foi melhor que a variante base no blind.",
    source: "docs/evaluation.md, Etapa 039 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "safety",
    strategy: "baseline_llm",
    accuracyAction: 95.83,
    accuracyRiskLevel: 95.83,
    accuracyCategory: 95.83,
    policyMatchRate: 95.83,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Referencia baseline no conjunto de regressao de seguranca.",
    source: "docs/evaluation.md, Etapa 039 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "safety",
    strategy: "static_few_shot",
    accuracyAction: 95.83,
    accuracyRiskLevel: 95.83,
    accuracyCategory: 95.83,
    policyMatchRate: 95.83,
    averageLatencyMs: 5764,
    failedRuns: 0,
    observations: "Few-shot estatico empatou com baseline LLM na rodada simples.",
    source: "docs/evaluation.md, Etapa 035",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "safety",
    strategy: "dynamic_few_shot",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 100,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Estrategia completa permaneceu estavel no safety apos calibragem.",
    source: "docs/evaluation.md, Etapa 039",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "safety",
    strategy: "dynamic_few_shot_guardrailed",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 100,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Guardrail R-004 foi o componente decisivo para fechar o safety.",
    source: "docs/evaluation.md, Etapas 038-039",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "adversarial",
    strategy: "baseline_llm",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 96.67,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Baseline LLM generalizou bem no dataset adversarial pos-tuning.",
    source: "docs/evaluation.md, Etapa 040 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "adversarial",
    strategy: "dynamic_few_shot",
    accuracyAction: 100,
    accuracyRiskLevel: 100,
    accuracyCategory: 96.67,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Variante base empatou com baseline LLM na comparacao adversarial.",
    source: "docs/evaluation.md, Etapa 040 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
  {
    dataset: "adversarial",
    strategy: "dynamic_few_shot_guardrailed",
    accuracyAction: 96.67,
    accuracyRiskLevel: 96.67,
    accuracyCategory: 96.67,
    policyMatchRate: 100,
    averageLatencyMs: null,
    failedRuns: 0,
    observations: "Guardrailed perdeu action/risk nesta comparacao; nao e melhor modelo geral.",
    source: "docs/evaluation.md, Etapa 040 compare-ablation",
    snapshotKind: evaluationSnapshotKind,
  },
];

export function getDataset(key: EvaluationDatasetKey): EvaluationDataset {
  return evaluationDatasets.find((dataset) => dataset.key === key) ?? evaluationDatasets[0];
}

export function getStrategy(key: EvaluationStrategyKey): EvaluationStrategy {
  return evaluationStrategies.find((strategy) => strategy.key === key) ?? evaluationStrategies[0];
}

export function getResult(
  dataset: EvaluationDatasetKey,
  strategy: EvaluationStrategyKey,
): EvaluationResult | null {
  return (
    evaluationResults.find((result) => result.dataset === dataset && result.strategy === strategy) ??
    null
  );
}

export function getFeaturedResult(dataset: EvaluationDatasetKey): EvaluationResult {
  const strategy = featuredResultByDataset[dataset];
  return getResult(dataset, strategy) ?? evaluationResults[0];
}

