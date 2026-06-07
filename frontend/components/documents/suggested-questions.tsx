import { Card } from "@/components/ui/card";
import { normalizeUtf8Text } from "@/lib/text";

type SuggestedQuestionsProps = {
  questions?: string[];
  onQuestionClick: (question: string) => void;
};

export function SuggestedQuestions({
  questions = [],
  onQuestionClick,
}: SuggestedQuestionsProps) {
  return (
    <Card className="rounded-[20px] bg-[#F7F8FA] p-6">
      <h3 className="heading-4 text-[#1A1A1A]">Perguntas sugeridas</h3>
      {questions.length > 0 ? (
        <div className="mt-4 space-y-2">
          {questions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onQuestionClick(question)}
              className="block w-full cursor-pointer rounded-lg bg-white p-3 text-left text-sm text-[#1A1A1A] transition hover:text-[#2F6F6D]"
            >
              {normalizeUtf8Text(question)}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#666666]">
          Não há perguntas sugeridas para este documento.
        </p>
      )}
    </Card>
  );
}
