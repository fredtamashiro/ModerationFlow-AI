export type EvaluationDatasetKey = "main" | "holdout" | "blind" | "safety" | "adversarial";

export type EvaluationStrategyKey =
  | "heuristic"
  | "baseline_llm"
  | "static_few_shot"
  | "dynamic_few_shot"
  | "dynamic_few_shot_guardrailed";

export type MetricValue = number | null;

export type EvaluationMetricKey =
  | "accuracyAction"
  | "accuracyRiskLevel"
  | "accuracyCategory"
  | "policyMatchRate"
  | "averageLatencyMs";

export type EvaluationDataset = {
  key: EvaluationDatasetKey;
  label: string;
  shortLabel: string;
  role: string;
  benchmarkStatus: string;
  tuningUsage: string;
  description: string;
};

export type EvaluationStrategy = {
  key: EvaluationStrategyKey;
  label: string;
  role: "main_flow" | "research_baseline" | "experiment" | "historical_experiment";
  summary: string;
};

export type EvaluationResult = {
  dataset: EvaluationDatasetKey;
  strategy: EvaluationStrategyKey;
  accuracyAction: MetricValue;
  accuracyRiskLevel: MetricValue;
  accuracyCategory: MetricValue;
  policyMatchRate: MetricValue;
  averageLatencyMs: MetricValue;
  failedRuns: MetricValue;
  observations: string;
  source: string;
  snapshotKind: "snapshot_documented";
};

