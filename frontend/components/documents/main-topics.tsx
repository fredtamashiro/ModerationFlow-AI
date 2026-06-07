import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { normalizeUtf8Text } from "@/lib/text";

type MainTopicsProps = {
  topics?: string[];
};

export function MainTopics({ topics = [] }: MainTopicsProps) {
  return (
    <Card className="rounded-[20px] bg-white p-6">
      <h3 className="heading-4 text-[#1A1A1A]">Tópicos principais</h3>
      {topics.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge key={topic}>{normalizeUtf8Text(topic)}</Badge>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#666666]">
          Não há tópicos principais disponíveis para este documento.
        </p>
      )}
    </Card>
  );
}
