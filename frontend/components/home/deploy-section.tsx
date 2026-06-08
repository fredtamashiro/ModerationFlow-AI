import Link from "next/link";
import { ArrowUpRight, Check, MessageCircle } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

const resources = [
  "Upload administrativo de PDFs",
  "Smart Ingest assíncrono",
  "Enriquecimento de chunks com IA",
  "Embeddings e busca vetorial",
  "Consulta com respostas e fontes",
  "Perguntas sugeridas",
  "Histórico local por documento",
  "Login admin com cookie HttpOnly",
  "Rate limit do chat público",
  "Usage logs e auditoria",
  "Deploy em produção com serviços separados",
] as const;

const operationItems = [
  "Frontend",
  "API",
  "Worker",
  "Banco PostgreSQL + pgvector",
  "Redis",
  "Domínio próprio",
  "Bootstrap com migrations e seeds",
] as const;

export function DeploySection() {
  return (
    <section id="deploy" className="scroll-mt-28 bg-[var(--surface-soft)] py-14">
      <PageContainer className="grid gap-10">
        <div className="grid gap-8 xl:grid-cols-[0.58fr_0.42fr]">
          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="heading-2 text-[var(--foreground)]">
              Recursos implementados
            </h2>
            <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
              {resources.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--foreground)]">
                    <Check className="h-3 w-3" />
                  </span>
                  <p className="text-sm leading-7 text-[var(--foreground)]">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="heading-2 text-[var(--foreground)]">Deploy e operação</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              O projeto roda em produção com frontend, API, worker,
              PostgreSQL + pgvector, Redis, domínio próprio e bootstrap com
              migrations e seeds.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {operationItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <Card className="rounded-[20px] border-[var(--accent-border)] bg-[var(--accent-soft)] p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1">
              <span className="row-span-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]">
                <MessageCircle className="h-[30px] w-[30px] text-[var(--accent-soft)]" />
              </span>
              <h2 className="heading-3 text-[var(--foreground)]">
                Teste a consulta inteligente
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-[var(--muted-foreground)]">
                Acesse o workspace para selecionar um documento,
                <br />
                fazer perguntas e visualizar respostas com fontes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/documentos"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
              >
                Abrir workspace
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </PageContainer>
    </section>
  );
}
