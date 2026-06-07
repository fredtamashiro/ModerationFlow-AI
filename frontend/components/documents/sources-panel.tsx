import { Card } from "@/components/ui/card";
import { normalizeUtf8Text } from "@/lib/text";
import { ChatSource } from "@/services/api";

type SourcesPanelProps = {
  sources?: ChatSource[];
};

export function SourcesPanel({ sources = [] }: SourcesPanelProps) {
  return (
    <Card className="rounded-[20px] bg-[#F7F8FA] p-6">
      <h3 className="heading-4 text-[#1A1A1A]">Fontes da última resposta</h3>

      {sources.length > 0 ? (
        <div className="mt-4 space-y-3">
          {sources.map((source, index) => (
            <div
              key={`${source.page}-${source.chunk_index}-${index}`}
              className="rounded-lg bg-white p-4"
            >
              <div className="flex flex-wrap gap-3 text-xs text-[#666666]">
                <span>Página: {source.page}</span>
                <span>Chunk: {source.chunk_index}</span>
                <span>Score: {source.score.toFixed(4)}</span>
                {source.relevance_score !== undefined && (
                  <span>Relevância: {source.relevance_score.toFixed(2)}</span>
                )}
              </div>

              {source.matched_query && (
                <p className="mt-3 text-xs leading-5 text-[#2F6F6D]">
                  Query usada: {normalizeUtf8Text(source.matched_query)}
                </p>
              )}

              {source.relevance_reason && (
                <p className="mt-2 text-xs leading-5 text-[#2F6F6D]">
                  Motivo da relevância:{" "}
                  {normalizeUtf8Text(source.relevance_reason)}
                </p>
              )}

              <p className="mt-3 text-xs leading-6 text-[#666666]">
                {normalizeUtf8Text(source.preview)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#666666]">
          As fontes aparecerão aqui após a primeira pergunta.
        </p>
      )}
    </Card>
  );
}
