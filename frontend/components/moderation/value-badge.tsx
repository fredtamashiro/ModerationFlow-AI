import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const valueClassMap: Record<string, string> = {
  approve: "border-emerald-200 bg-emerald-50 text-emerald-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  flag: "border-amber-200 bg-amber-50 text-amber-800",
  remove: "border-rose-200 bg-rose-50 text-rose-800",
  removed: "border-rose-200 bg-rose-50 text-rose-800",
  request_edit: "border-purple-200 bg-purple-50 text-purple-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
  agreement: "border-emerald-200 bg-emerald-50 text-emerald-800",
  divergence: "border-rose-200 bg-rose-50 text-rose-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ValueBadge({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "border font-medium",
        valueClassMap[value] ?? "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
