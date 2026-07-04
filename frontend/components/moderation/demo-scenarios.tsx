import Link from "next/link";
import { ArrowRight, MessageSquareWarning } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModerationComment } from "@/services/moderationApi";

type DemoScenario = {
  seedCase: string;
  title: string;
  summary: string;
  demonstrates: string;
};

const demoScenarios: DemoScenario[] = [
  {
    seedCase: "ambiguous_sarcasm",
    title: "Crítica ambígua",
    summary: "Comentário com tom negativo e sarcasmo, mas sem violação óbvia.",
    demonstrates: "Mostra por que casos limítrofes precisam de revisão humana.",
  },
  {
    seedCase: "clear_spam",
    title: "Spam explícito",
    summary: "Comentário promocional que tenta puxar atenção para outro curso ou perfil.",
    demonstrates: "Mostra recomendação apoiada por regras de spam e autopromoção.",
  },
  {
    seedCase: "potentially_discriminatory",
    title: "Conteúdo discriminatório",
    summary: "Comentário sensível com generalização sobre um grupo.",
    demonstrates: "Mostra cuidado com risco, regra relacionada e decisão auditável.",
  },
];

function getSeedCase(comment: ModerationComment): string | null {
  const seedCase = comment.metadata.seed_case;
  return typeof seedCase === "string" ? seedCase : null;
}

export function DemoScenarios({ comments }: { comments: ModerationComment[] }) {
  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-[var(--accent-secondary)]" />
          Cenários para demonstração
        </CardTitle>
        <CardDescription>
          Atalhos para explicar a jornada: comentário, recomendação da IA, decisão humana e auditoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {demoScenarios.map((scenario) => {
          const comment = comments.find((item) => getSeedCase(item) === scenario.seedCase);

          return (
            <article
              key={scenario.seedCase}
              className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <div>
                <h2 className="text-base font-semibold">{scenario.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {scenario.summary}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                  O que demonstra
                </p>
                <p className="mt-1 text-sm leading-6">{scenario.demonstrates}</p>
              </div>

              {comment ? (
                <Link
                  href={`/admin/moderation/comments/${comment.id}`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium transition hover:bg-[var(--surface-alt)] hover:text-[var(--accent-secondary)]"
                >
                  Abrir comentário
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  Comentário demonstrável não encontrado nos dados atuais.
                </p>
              )}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
