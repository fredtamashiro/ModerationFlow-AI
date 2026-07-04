import { Card, CardContent } from "@/components/ui/card";
import type { MetricValue } from "@/types/moderation-evaluation";

function formatMetric(value: MetricValue, unit: "percent" | "ms"): string {
  if (value === null) {
    return "Não avaliado";
  }

  if (unit === "ms") {
    return `${Math.round(value)}ms`;
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

export function MetricCard({
  label,
  value,
  unit = "percent",
  helper,
}: {
  label: string;
  value: MetricValue;
  unit?: "percent" | "ms";
  helper: string;
}) {
  const missing = value === null;

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="grid h-full gap-3 p-5">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <p className={missing ? "text-xl font-semibold" : "text-3xl font-semibold"}>
          {formatMetric(value, unit)}
        </p>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{helper}</p>
      </CardContent>
    </Card>
  );
}
