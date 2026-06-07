import { normalizeUtf8Text } from "@/lib/text";

type DocumentSummaryCardProps = {
  summary?: string;
};

export function DocumentSummaryCard({ summary }: DocumentSummaryCardProps) {
  return (
    <div>
      <h2 className="heading-4 text-[#1A1A1A]">Resumo do documento</h2>
      <p className="mt-4 text-sm leading-7 text-[#666666]">
        {summary
          ? normalizeUtf8Text(summary)
          : "Este documento ainda não possui resumo gerado."}
      </p>
    </div>
  );
}
