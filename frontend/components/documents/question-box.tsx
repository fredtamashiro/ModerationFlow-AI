import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <Input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Digite uma pergunta sobre este documento"
          className="min-h-11 flex-1"
        />
        <Button type="button" disabled={isLoading} onClick={onSubmit}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Consultando..." : "Perguntar"}
        </Button>
      </div>

      {children && <div className="mt-6">{children}</div>}
    </Card>
  );
}
