import { Card } from "@/components/ui/card";
import { normalizeUtf8Text } from "@/lib/text";

type LimitationsPanelProps = {
  limitations?: string[];
};

export function LimitationsPanel({
  limitations = [],
}: LimitationsPanelProps) {
  return (
    <Card className="rounded-[20px] bg-[#F7F8FA] p-6">
      <h3 className="heading-4 text-[#1A1A1A]">Limitações identificadas</h3>
      {limitations.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#666666]">
          {limitations.map((limitation) => (
            <li key={limitation}>{normalizeUtf8Text(limitation)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#666666]">
          Não há limitações registradas para este documento.
        </p>
      )}
    </Card>
  );
}
