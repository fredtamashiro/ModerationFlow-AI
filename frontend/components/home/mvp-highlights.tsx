import {
  Brain,
  Bot,
  Database,
  LayoutPanelTop,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const items = [
  {
    title: "Frontend",
    description: "Next.js, React e TypeScript",
    icon: LayoutPanelTop,
  },
  {
    title: "API",
    description: "FastAPI, auth admin, rate limit e endpoints REST",
    icon: Workflow,
  },
  {
    title: "Worker",
    description: "RQ + Redis para processamento assíncrono",
    icon: Bot,
  },
  {
    title: "Banco",
    description: "PostgreSQL + pgvector para dados, chunks e embeddings",
    icon: Database,
  },
  {
    title: "IA",
    description: "OpenAI, LangChain e LangGraph para RAG e enriquecimento",
    icon: Brain,
  },
  {
    title: "Operação",
    description: "Usage logs, migrations, bootstrap e deploy no Railway",
    icon: ShieldCheck,
  },
] as const;

export function MvpHighlights() {
  return (
    <section id="arquitetura" className="scroll-mt-28 bg-white py-14">
      <PageContainer className="grid gap-8">
        <div className="text-center">
          <h2 className="heading-2 text-[var(--foreground)]">Arquitetura técnica</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-6 text-center"
              >
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center text-[var(--accent)]">
                  <Icon className="h-10 w-10" />
                </span>
                <h3 className="heading-4 mt-4 text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
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
