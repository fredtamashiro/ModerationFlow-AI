import {
  ArrowRight,
  Bot,
  Database,
  FileText,
  MessageCircle,
  Workflow,
} from "lucide-react";

import { RedisIcon } from "@/components/icons/redis-icon";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const flowItems = [
  {
    title: "PDF",
    description: "Admin envia o documento",
    icon: FileText,
  },
  {
    title: "API",
    description: "Registra job e salva arquivo temporário",
    icon: Workflow,
  },
  {
    title: "Redis Queue",
    description: "Fila recebe o job para processamento",
    icon: RedisIcon,
  },
  {
    title: "Worker",
    description: "Extrai texto, gera chunks e enriquece com IA",
    icon: Bot,
  },
  {
    title: "PostgreSQL + pgvector",
    description: "Persistência de embeddings e dados",
    icon: Database,
  },
  {
    title: "Chat com fontes",
    description: "Usuário consulta e recebe respostas rastreáveis",
    icon: MessageCircle,
  },
] as const;

export function ArchitectureFlow() {
  return (
    <section id="fluxo" className="scroll-mt-28 bg-[var(--background)] py-14">
      <PageContainer className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div>
            <h2 className="heading-2 text-[var(--foreground)]">Fluxo operacional</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
              O projeto separa ingestão, indexação e consulta em etapas claras,
              facilitando observabilidade, deploy independente e evolução da
              arquitetura.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:hidden">
            {flowItems.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-5 text-center"
                >
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center text-[var(--accent)]">
                    <Icon className="h-10 w-10" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="hidden xl:flex xl:items-stretch xl:justify-end">
            {flowItems.map((item, index) => {
              const Icon = item.icon;
              const isLastItem = index === flowItems.length - 1;

              return (
                <div key={item.title} className="flex items-stretch">
                  <Card className="w-[118px] rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-5 text-center">
                    <span className="mx-auto inline-flex h-12 w-12 items-center justify-center text-[var(--accent)]">
                      <Icon className="h-10 w-10" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-[var(--muted-foreground)]">
                      {item.description}
                    </p>
                  </Card>

                  {!isLastItem && (
                    <span className="inline-flex items-center text-[var(--accent)]">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </PageContainer>
    </section>
  );
}
