import {
  Brain,
  Cloud,
  Monitor,
  Server,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const items = [
  {
    title: "Engenharia de IA aplicada",
    description:
      "Uso de LLMs, embeddings, RAG, LangGraph e busca vetorial em um produto funcional.",
    icon: Brain,
  },
  {
    title: "Backend robusto",
    description:
      "FastAPI, PostgreSQL, Redis, worker assíncrono, migrations, bootstrap e logs.",
    icon: Server,
  },
  {
    title: "Produto full stack",
    description:
      "Interface moderna em Next.js, área pública, workspace de consulta e painel admin.",
    icon: Monitor,
  },
  {
    title: "Deploy real",
    description:
      "Aplicação publicada com serviços separados, banco vetorial e domínio próprio.",
    icon: Cloud,
  },
] as const;

export function CapabilityCards() {
  return (
    <section className="bg-white py-14">
      <PageContainer className="grid gap-8">
        <div className="text-center">
          <h2 className="heading-2 text-[var(--foreground)]">
            O que este projeto demonstra
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center text-[var(--accent)]">
                  <Icon className="h-10 w-10" />
                </span>
                <h3 className="heading-4 mt-5 text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}
