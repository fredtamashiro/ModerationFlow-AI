import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, FileSearch, ScanText } from "lucide-react";

import { PublicDemoShell } from "@/components/demo/public-demo-shell";
import { Badge } from "@/components/ui/badge";

const title = "Outros projetos de IA | ModerationFlow AI";
const description =
  "Projetos de IA de Fred Tamashiro: SmartDocs AI, leitura de receitas médicas no Grupo Nissei e Base Viva IA, com a assistente Lia, em desenvolvimento.";

const nisseiTechnologies = [
  "Python",
  "FastAPI",
  "Pydantic",
  "AWS Lambda",
  "SQS",
  "S3",
  "Amazon Bedrock",
  "CloudWatch",
  "GitHub Actions",
] as const;

const baseVivaTechnologies = [
  "Python",
  "FastAPI",
  "Next.js",
  "TypeScript",
  "PostgreSQL",
  "pgvector",
  "Redis",
  "Celery",
  "Docker",
] as const;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/outros-projetos",
  },
  twitter: { title, description },
};

export default function OtherProjectsPage() {
  return (
    <PublicDemoShell contentClassName="gap-5 py-6 sm:py-10">
      <section className="grid gap-3 pb-1" aria-labelledby="projects-title">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-secondary)]">
          Portfólio · Fred Tamashiro
        </p>
        <h1 id="projects-title" className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Outros projetos de IA
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
          Da consulta de documentos à extração estruturada de informações,
          conheça outros projetos de inteligência artificial aplicada.
        </p>
      </section>

      <div className="grid gap-5 [&_strong]:font-semibold [&_strong]:text-[var(--foreground)]">
        <article className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 lg:grid-cols-[0.65fr_1.35fr] lg:gap-8" aria-labelledby="smartdocs-title">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-secondary)]">
              <FileSearch className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--accent-secondary)]">
              Inteligência artificial aplicada
            </p>
            <h2 id="smartdocs-title" className="mt-2 text-2xl font-semibold tracking-tight">
              SmartDocs AI
            </h2>
            <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
              Consulta inteligente de documentos
            </p>
          </div>
          <div>
            <p className="text-base leading-7 text-[var(--muted-foreground)]">
              Aplicação de consulta inteligente de documentos com IA. Permite
              fazer perguntas sobre o conteúdo de <strong>PDFs</strong> e utiliza <strong>RAG</strong> para buscar
              trechos relevantes e contextualizar as respostas.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Temas do SmartDocs AI">
              <Badge>RAG</Badge>
              <Badge>Documentos PDF</Badge>
              <Badge>Busca semântica</Badge>
            </div>
            <div className="pt-5">
              <a
                href="https://smartdocs.fredtamashiro.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2"
              >
                Conhecer o SmartDocs
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </div>
          </div>
        </article>

        <article className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="nissei-title">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--accent-secondary)]">
              <ScanText className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-secondary)]">
                Grupo Nissei
              </p>
              <h2 id="nissei-title" className="mt-2 text-2xl font-semibold tracking-tight">
                Leitura inteligente de receitas médicas
              </h2>
            </div>
          </div>
          <p className="text-base leading-7 text-[var(--muted-foreground)]">
            Solução de <strong>IA generativa</strong> que transforma receitas médicas
            e imagens em <strong>informações estruturadas</strong> para integração
            com sistemas de farmácias.
          </p>
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
            <div>
              <h3 className="text-base font-semibold">Minha contribuição</h3>
              <p className="mt-1 text-base leading-7 text-[var(--muted-foreground)]">
                Desenho da <strong>arquitetura</strong> e dos <strong>prompts</strong>,
                implementação, validação, testes automatizados e observabilidade,
                com otimização dos modelos e do custo operacional.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">Como os modelos são avaliados</h3>
              <p className="mt-1 text-base leading-7 text-[var(--muted-foreground)]">
                A <strong>avaliação de modelos</strong> usa receitas reais previamente
                rotuladas. Os critérios são precisão, recall, acurácia por campo,
                custo e latência.
              </p>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-base font-semibold">Principais tecnologias</h3>
            <div className="flex flex-wrap gap-2">
              {nisseiTechnologies.map((technology) => (
                <Badge key={technology}>{technology}</Badge>
              ))}
            </div>
          </div>
          <details className="border-t border-[var(--border)] pt-2">
            <summary className="min-h-11 cursor-pointer content-center rounded-sm py-2 text-base font-semibold text-[var(--accent-secondary)] transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2">
              Ver detalhes técnicos
            </summary>
            <div className="grid gap-4 pt-3 lg:grid-cols-2 lg:gap-8">
              <div>
                <h3 className="text-base font-semibold">Extração e validação</h3>
                <p className="mt-1 text-base leading-7 text-[var(--muted-foreground)]">
                  Os <strong>modelos multimodais</strong> identificam paciente, médico,
                  CRM, data da prescrição, medicamentos e posologias. Regras de
                  <strong> validação</strong> ajudam a reduzir interpretações incorretas
                  e a tratar informações ausentes ou ilegíveis.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">Arquitetura serverless</h3>
                <p className="mt-1 text-base leading-7 text-[var(--muted-foreground)]">
                  A arquitetura combina <strong>Python</strong>, <strong>FastAPI</strong> e
                  serviços <strong>AWS</strong> para executar o fluxo de leitura.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  O <strong>processamento assíncrono</strong> utiliza filas de mensagens
                  e execução serverless, com acesso aos modelos pelo <strong>Amazon Bedrock</strong>.
                </p>
              </div>
            </div>
          </details>
        </article>

        <article className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7" aria-labelledby="base-viva-title">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-secondary)]">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h2 id="base-viva-title" className="text-2xl font-semibold tracking-tight">
                  Base Viva IA
                </h2>
                <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-secondary)]">
                  Em desenvolvimento
                </Badge>
              </div>
              <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                Lia — Assistente corporativa com RAG e gestão do conhecimento
              </p>
            </div>
          </div>
          <p className="text-base leading-7 text-[var(--muted-foreground)]">
            Plataforma corporativa de IA cuja assistente, Lia, consulta documentos
            internos com <strong>RAG</strong> e <strong>controle de acesso</strong>,
            apresenta fontes e registra lacunas de conhecimento quando não há
            evidência suficiente. Integra onboarding e notificações assíncronas,
            com <strong>avaliação de qualidade e segurança</strong> das respostas.
          </p>
          <p className="text-base leading-7 text-[var(--muted-foreground)]">
            Atuação: arquitetura e desenvolvimento full stack, da ingestão de
            documentos à avaliação das respostas.
          </p>
          <div>
            <h3 className="mb-2 text-base font-semibold">Principais tecnologias</h3>
            <div className="flex flex-wrap gap-2">
              {baseVivaTechnologies.map((technology) => (
                <Badge key={technology}>{technology}</Badge>
              ))}
            </div>
          </div>
          <details className="border-t border-[var(--border)] pt-2">
            <summary className="min-h-11 cursor-pointer content-center rounded-sm py-2 text-base font-semibold text-[var(--accent-secondary)] transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)] focus-visible:ring-offset-2">
              Ver detalhes técnicos
            </summary>
            <div className="grid gap-4 pt-3 lg:grid-cols-3 lg:gap-6">
              <div>
                <h3 className="text-base font-semibold">Conhecimento com permissões e rastreabilidade</h3>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  A busca semântica com PostgreSQL/pgvector gera respostas com
                  citações persistidas e revalidadas. RBAC, ACL e isolamento
                  organizacional são aplicados antes da busca vetorial, considerando
                  usuário, departamento, cargo e permissões.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Quando não há evidência suficiente, as lacunas de conhecimento
                  são registradas, classificadas e priorizadas, com atribuição de
                  responsável e acompanhamento até a resolução.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">Onboarding e processamento assíncrono</h3>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Onboarding com programas, trilhas, etapas, progresso e prazos.
                  Consultas determinísticas aos dados estruturados dispensam o
                  uso de LLM quando apropriado.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  A ingestão assíncrona inclui extração, chunking, embeddings,
                  versionamento e publicação controlada. Notificações usam
                  Transactional Outbox, Celery e Redis, com idempotência,
                  agrupamento, retries e dead letter.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">Avaliação de IA e recursos operacionais</h3>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Dataset sintético de 60 cenários para avaliar RAG, fundamentação
                  das respostas, citações, abstenção, ACL e prompt injection.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Recursos implementados incluem rate limiting, health/readiness
                  checks, métricas, heartbeats, backup e restauração, containers
                  non-root, CI/CD e release gates.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Desenvolvimento orientado por especificações e assistido por IA,
                  com documentação técnica, ADRs, critérios de aceite e testes.
                </p>
              </div>
            </div>
          </details>
        </article>
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-[var(--accent-secondary)] transition hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao ModerationFlow AI
        </Link>
      </div>
    </PublicDemoShell>
  );
}
