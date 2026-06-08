import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QuestionBoxProps = {
  question: string;
  isLoading: boolean;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  children?: ReactNode;
};

export function QuestionBox({
  question,
  isLoading,
  onQuestionChange,
  onSubmit,
  children,
}: QuestionBoxProps) {
  return (
    <Card className="rounded-[20px] bg-white p-6">
      <h3 className="heading-4 text-[#1A1A1A]">Pergunte sobre o documento</h3>
      <div className="mt-4">
        <textarea
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Digite uma pergunta sobre este documento"
          rows={2}
          className={cn(
            "block w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[#8A8F98] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60",
            "min-h-[96px] md:min-h-[120px]",
          )}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-b border-[#d9dde3] pb-6">
        <div className="min-h-5 text-sm text-[#666666]">
          {isLoading && (
            <span className="inline-flex items-center gap-2 text-[#2F6F6D]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando a resposta...
            </span>
          )}
        </div>

        <Button
          type="button"
          disabled={isLoading}
          onClick={onSubmit}
          className="min-w-[140px]"
        >
          Perguntar
        </Button>
      </div>

      {children && <div className="mt-6">{children}</div>}
    </Card>
  );
}
