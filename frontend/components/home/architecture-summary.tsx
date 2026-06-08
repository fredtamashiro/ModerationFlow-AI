import { Brain, LockKeyhole, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";

const items = [
  {
    title: "Projeto em produção",
    description:
      "Frontend, API, worker, PostgreSQL, Redis e domínio próprio.",
    icon: ShieldCheck,
    className: "bg-white p-6 md:col-span-2",
  },
  {
    title: "IA aplicada",
    description:
      "RAG, embeddings, pgvector, LangGraph e respostas com fontes.",
    icon: Brain,
    className: "bg-white p-6",
  },
  {
    title: "Operação segura",
    description:
      "Login admin, rate limit, usage logs e processamento assíncrono.",
    icon: LockKeyhole,
    className: "bg-white p-6",
  },
] as const;

export function ArchitectureSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className={`rounded-[20px] border-[var(--border)] ${item.className}`}
          >
            <div className="grid gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[var(--accent)]">
                <Icon className="h-10 w-10" />
              </span>
              <div>
                <h2 className="heading-4 text-[var(--foreground)]">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
