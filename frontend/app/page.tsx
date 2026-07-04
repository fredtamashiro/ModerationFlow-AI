"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  GitBranch,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import { AdminLogin } from "@/components/admin-login";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminSession } from "@/hooks/use-admin-session";

const moderationFlow = [
  "Comentario",
  "Analise e recomendacao",
  "Regras relacionadas",
  "Decisao humana",
  "Auditoria",
] as const;

const demoScenarios = [
  {
    title: "Critica ambigua",
    seedCase: "ambiguous_sarcasm",
    demonstrates: "Distingue critica forte, sarcasmo e risco de remocao indevida.",
    decision: "A decisao em jogo e aprovar, sinalizar ou pedir revisao com contexto.",
  },
  {
    title: "Spam explicito",
    seedCase: "clear_spam",
    demonstrates: "Mostra sinais de promocao externa, regras relacionadas e acao sugerida.",
    decision: "O risco em jogo e diferenciar flag e remove sem automatizar a decisao final.",
  },
  {
    title: "Conteudo discriminatorio",
    seedCase: "potentially_discriminatory",
    demonstrates: "Evidencia casos sensiveis em que falso positivo e falso negativo importam.",
    decision: "O moderador revisa R-004, justificativa, risco e trilha de auditoria.",
  },
] as const;

const strategyCards = [
  {
    title: "Heuristico",
    description: "Fluxo principal atual: deterministico, rapido e auditavel.",
  },
  {
    title: "Baseline LLM",
    description: "Estrategia principal de pesquisa para comparar generalizacao sem exemplos.",
  },
  {
    title: "Few-shot",
    description: "Experimento isolado com exemplos humanos curados, sem promocao automatica.",
  },
  {
    title: "Dynamic few-shot",
    description: "Seleciona exemplos de forma deterministica e ajuda a analisar cenarios especificos.",
  },
  {
    title: "Guardrail R-004",
    description: "Camada experimental forte em safety, com trade-offs avaliados separadamente.",
  },
] as const;

const technologyItems = [
  "FastAPI",
  "Next.js",
  "TypeScript",
  "PostgreSQL",
  "LangGraph",
  "LangSmith",
  "Docker",
  "Avaliacao offline",
  "Human-in-the-Loop",
] as const;

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const {
    adminUser,
    isCheckingSession,
    authErrorMessage,
    isLoggingOut,
    handleLoggedIn,
    handleLogout,
  } = useAdminSession();

  return (
    <>
      <AppHeader
        adminUser={adminUser}
        isCheckingSession={isCheckingSession}
        isLoggingOut={isLoggingOut}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <AdminLogin
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoggedIn={handleLoggedIn}
      />

      <main className="min-h-screen bg-[var(--background)] pt-24 text-[var(--foreground)]">
        <section id="home" className="border-b border-[var(--border)] bg-[var(--surface)] py-14 md:py-20">
          <PageContainer className="grid gap-10">
            <div className="grid max-w-4xl gap-5">
              <Badge className="w-fit rounded-full border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-1 text-xs uppercase text-[var(--accent-foreground)]">
                Portfolio tecnico
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                ModerationFlow AI
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
                Sistema de moderacao assistida por IA com revisao humana, auditoria
                e avaliacao comparativa de estrategias.
              </p>
              <div className="flex flex-wrap gap-3">
                <LandingButton href="/admin/moderation" label="Ver demonstracao" />
                <LandingButton href="/admin/moderation/evaluations" label="Explorar avaliacoes" variant="secondary" />
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Os links abrem a area administrativa de demonstracao. Se a sessao nao estiver
                autenticada, use o login local configurado para o ambiente de desenvolvimento.
              </p>
            </div>

            {authErrorMessage ? (
              <Card className="rounded-lg border-red-200 bg-red-50">
                <CardContent className="p-4 text-sm text-red-700">
                  {authErrorMessage}
                </CardContent>
              </Card>
            ) : null}

            <ProductPreview />
          </PageContainer>
        </section>

        <section id="problem" className="py-14">
          <PageContainer className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionTitle
              eyebrow="Problema"
              title="Moderacao precisa de escala sem perder julgamento humano."
            />
            <div className="grid gap-4 text-base leading-8 text-[var(--muted-foreground)]">
              <p>
                Comentarios em plataformas educacionais podem conter spam, ataques pessoais,
                linguagem ofensiva, discriminacao, criticas legitimas ou pedidos de suporte.
              </p>
              <p>
                Automatizar tudo aumenta o risco de falsos positivos. Depender apenas de
                revisao manual reduz escala. O projeto organiza uma recomendacao assistida,
                fundamentada por regras, antes da decisao humana final.
              </p>
            </div>
          </PageContainer>
        </section>

        <section id="flow" className="border-y border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Fluxo de moderacao"
              title="A IA recomenda. O moderador decide."
              description="A interface operacional foi desenhada para manter a decisao humana acima da recomendacao automatizada."
            />
            <div className="grid gap-3 md:grid-cols-5">
              {moderationFlow.map((step, index) => (
                <div
                  key={step}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                >
                  <span className="text-xs font-semibold text-[var(--accent-secondary)]">
                    Etapa {index + 1}
                  </span>
                  <p className="mt-2 text-sm font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="demo" className="py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Demo guiada"
              title="Tres cenarios demonstraveis"
              description="Os cards apontam para a fila operacional, onde os comentarios existentes podem ser abertos pelos cenarios da etapa 043."
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {demoScenarios.map((scenario) => (
                <Card key={scenario.seedCase} className="rounded-lg border-[var(--border)] bg-[var(--surface)]">
                  <CardContent className="grid h-full gap-4 p-5">
                    <div>
                      <p className="text-lg font-semibold">{scenario.title}</p>
                      <p className="mt-1 text-xs font-medium text-[var(--accent-secondary)]">
                        seed_case: {scenario.seedCase}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                      {scenario.demonstrates}
                    </p>
                    <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                      {scenario.decision}
                    </p>
                    <Link
                      href="/admin/moderation"
                      className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]"
                    >
                      Abrir na fila
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageContainer>
        </section>

        <section id="hitl" className="border-y border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionTitle
              eyebrow="Human-in-the-Loop"
              title="A recomendacao nao executa a decisao final."
              description="O sistema ajuda a priorizar e justificar, mas a decisao operacional fica com o moderador."
            />
            <div className="grid gap-3">
              <Principle icon={UserCheck} text="O moderador pode aprovar, sinalizar, remover ou solicitar edicao." />
              <Principle icon={ClipboardCheck} text="Divergencias entre IA e moderador sao registradas como evidencia auditavel." />
              <Principle icon={FileSearch} text="Feedback humano vira insumo para avaliacao futura, sem automatizar novas regras." />
            </div>
          </PageContainer>
        </section>

        <section id="evaluation" className="py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Avaliacao e experimentacao"
              title="Estrategias medidas fora da fila operacional"
              description="A landing mostra a leitura tecnica resumida; os detalhes ficam no dashboard de avaliacoes."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {strategyCards.map((strategy) => (
                <Card key={strategy.title} className="rounded-lg border-[var(--border)] bg-[var(--surface)]">
                  <CardContent className="grid gap-3 p-5">
                    <p className="font-semibold">{strategy.title}</p>
                    <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                      {strategy.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <LandingButton href="/admin/moderation/evaluations" label="Ver avaliacoes e experimentos" variant="secondary" />
          </PageContainer>
        </section>

        <section id="decision" className="border-y border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Decisao tecnica"
              title="ADR-001 resume a estrategia atual"
              description="A decisao separa fluxo principal, pesquisa e experimentos para evitar promover LLM por uma metrica isolada."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <DecisionCard label="Fluxo principal" value="Heuristico + Human-in-the-Loop" icon={Scale} />
              <DecisionCard label="Pesquisa" value="Baseline LLM" icon={GitBranch} />
              <DecisionCard label="Experimentos" value="Dynamic few-shot e guardrail R-004" icon={ShieldAlert} />
            </div>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Referencia: docs/architecture/adr-001-moderation-strategy-decision.md.
              O modelo recomenda; o moderador decide.
            </p>
          </PageContainer>
        </section>

        <section id="technology" className="py-14">
          <PageContainer className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionTitle
              eyebrow="Tecnologias"
              title="Stack usado no projeto"
              description="A lista reflete o que existe no repositorio e na documentacao tecnica."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {technologyItems.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </PageContainer>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-2xl font-semibold">Explore o produto em funcionamento</p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
                Comece pela fila operacional e depois abra as avaliacoes para discutir a decisao tecnica.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LandingButton href="/admin/moderation" label="Explorar a fila de moderacao" />
              <LandingButton href="/admin/moderation/evaluations" label="Ver avaliacoes e experimentos" variant="secondary" />
            </div>
          </PageContainer>
        </section>
      </main>

      <AppFooter
        links={[
          { label: "Fila de moderacao", href: "/admin/moderation" },
          { label: "Avaliacoes", href: "/admin/moderation/evaluations" },
        ]}
      />
    </>
  );
}

function LandingButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary"
          ? "inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          : "inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]"
      }
    >
      {label}
    </Link>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold uppercase text-[var(--accent-secondary)]">{eyebrow}</p>
      <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <p className="text-sm font-semibold">Fila de moderacao</p>
            <p className="text-xs text-[var(--muted-foreground)]">Recomendacao assistida e decisao humana</p>
          </div>
          <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
            HITL obrigatorio
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_18rem]">
          <div className="grid gap-3">
            <PreviewRow title="Comentario com sarcasmo" value="Risco medio | critica ambigua" />
            <PreviewRow title="Convite para grupo externo" value="Spam | policy R-001" />
            <PreviewRow title="Ataque a grupo protegido" value="Safety review | policy R-004" />
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold">Decisao humana</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Aprovar, sinalizar, remover ou solicitar edicao. Divergencias ficam auditaveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-[var(--muted-foreground)]">{value}</span>
    </div>
  );
}

function Principle({
  icon: Icon,
  text,
}: {
  icon: typeof UserCheck;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-secondary)]" />
      <p className="text-sm leading-7 text-[var(--muted-foreground)]">{text}</p>
    </div>
  );
}

function DecisionCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Scale;
}) {
  return (
    <Card className="rounded-lg border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="grid gap-3 p-5">
        <Icon className="h-5 w-5 text-[var(--accent-secondary)]" />
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
