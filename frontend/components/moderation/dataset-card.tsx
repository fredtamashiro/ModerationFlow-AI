import { Card, CardContent } from "@/components/ui/card";

type DatasetCardItem = {
  key: string;
  label: string;
  benchmarkStatus: string;
  description: string;
  role: string;
  tuningUsage: string;
};

export function DatasetCard({ dataset }: { dataset: DatasetCardItem }) {
  const isWarning =
    dataset.key === "feedback_examples" || dataset.key === "adversarial";

  return (
    <Card
      className={`border-[var(--border)] bg-[var(--surface)] ${
        isWarning ? "ring-1 ring-[var(--accent-border)]" : ""
      }`}
    >
      <CardContent className="grid gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{dataset.label}</h3>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            {dataset.benchmarkStatus}
          </span>
        </div>
        <p className="text-sm leading-6 text-[var(--foreground)]">{dataset.description}</p>
        <dl className="grid gap-2 text-sm text-[var(--muted-foreground)]">
          <div>
            <dt className="font-medium text-[var(--foreground)]">Funcao</dt>
            <dd className="leading-6">{dataset.role}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--foreground)]">Uso em tuning</dt>
            <dd className="leading-6">{dataset.tuningUsage}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
