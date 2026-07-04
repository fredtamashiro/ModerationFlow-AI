import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusLabelMap: Record<string, string> = {
  pending: "Pendente",
  analyzing: "Em análise",
  waiting_human_review: "Aguardando revisão humana",
  approved: "Aprovado",
  removed: "Removido",
  edit_requested: "Edição solicitada",
  failed: "Falhou",
  completed: "Concluido",
};

const statusClassMap: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  analyzing: "border-sky-200 bg-sky-50 text-sky-800",
  waiting_human_review: "border-orange-200 bg-orange-50 text-orange-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  removed: "border-rose-200 bg-rose-50 text-rose-800",
  edit_requested: "border-purple-200 bg-purple-50 text-purple-800",
  failed: "border-red-200 bg-red-50 text-red-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "border font-medium",
        statusClassMap[status] ?? "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {statusLabelMap[status] ?? status}
    </Badge>
  );
}
