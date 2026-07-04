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
  "Comentário",
  "Análise e recomendação",
  "Regras relacionadas",
  "Decisão humana",
  "Auditoria",
] as const;

const demoScenarios = [
  {
    title: "Crítica ambígua",
    demoId: "ambiguous-sarcasm",
    seedCase: "ambiguous_sarcasm",
    demonstrates: "Distingue crítica forte, sarcasmo e risco de remoção indevida.",
    decision: "A decisão em jogo é aprovar, sinalizar ou pedir revisão com contexto.",
  },
  {
    title: "Spam explícito",
    demoId: "clear-spam",
    seedCase: "clear_spam",
    demonstrates: "Mostra sinais de promoção externa, regras relacionadas e ação sugerida.",
    decision: "O risco em jogo é diferenciar flag e remove sem automatizar a decisão final.",
  },
  {
    title: "Conteúdo discriminatório",
    demoId: "potentially-discriminatory",
    seedCase: "potentially_discriminatory",
    demonstrates: "Evidencia casos sensíveis em que falso positivo e falso negativo importam.",
    decision: "O moderador revisa R-004, justificativa, risco e trilha de auditoria.",
  },
] as const;

const strategyCards = [
  {
    title: "Heuristico",
    description: "Fluxo principal atual: determinístico, rápido e auditável.",
  },
  {
    title: "Baseline LLM",
    description: "Estratégia principal de pesquisa para comparar generalização sem exemplos.",
  },
  {
    title: "Few-shot",
    description: "Experimento isolado com exemplos humanos curados, sem promoção automática.",
  },
  {
    title: "Dynamic few-shot",
    description: "Seleciona exemplos de forma determinística e ajuda a analisar cenários específicos.",
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
  "Avaliação offline",
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
                Portfólio técnico
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                ModerationFlow AI
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--muted-foreground)]">
                Sistema de moderação assistida por IA com revisão humana, auditoria
                e avaliação comparativa de estratégias.
              </p>
              <div className="flex flex-wrap gap-3">
                <LandingButton href="/demo/moderation" label="Ver demonstração" />
                <LandingButton href="/demo/evaluations" label="Explorar avaliações" variant="secondary" />
              </div>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Os links abrem a demonstração pública somente leitura. Para operar como moderador,
                use o login administrativo e acesse as rotas protegidas.
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
              title="Moderação precisa de escala sem perder julgamento humano."
            />
            <div className="grid gap-4 text-base leading-8 text-[var(--muted-foreground)]">
              <p>
                Comentários em plataformas educacionais podem conter spam, ataques pessoais,
                linguagem ofensiva, discriminação, críticas legítimas ou pedidos de suporte.
              </p>
              <p>
                Automatizar tudo aumenta o risco de falsos positivos. Depender apenas de
                revisão manual reduz escala. O projeto organiza uma recomendação assistida,
                fundamentada por regras, antes da decisão humana final.
              </p>
            </div>
          </PageContainer>
        </section>

        <section id="flow" className="border-y border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Fluxo de moderação"
              title="A IA recomenda. O moderador decide."
              description="A interface operacional foi desenhada para manter a decisão humana acima da recomendação automatizada."
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
              title="Três cenários demonstráveis"
              description="Os cards apontam para a demonstração pública, onde a recomendação da IA pode ser comparada com a decisão humana registrada."
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
                      href={`/demo/moderation/comments/${scenario.demoId}`}
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
              title="A recomendação não executa a decisão final."
              description="O sistema ajuda a priorizar e justificar, mas a decisão operacional fica com o moderador."
            />
            <div className="grid gap-3">
              <Principle icon={UserCheck} text="O moderador pode aprovar, sinalizar, remover ou solicitar edição." />
              <Principle icon={ClipboardCheck} text="Divergências entre IA e moderador são registradas como evidência auditável." />
              <Principle icon={FileSearch} text="Feedback humano vira insumo para avaliação futura, sem automatizar novas regras." />
            </div>
          </PageContainer>
        </section>

        <section id="evaluation" className="py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Avaliação e experimentação"
              title="Estrategias medidas fora da fila operacional"
              description="A landing mostra a leitura técnica resumida; os detalhes ficam no dashboard de avaliações."
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
            <LandingButton href="/demo/evaluations" label="Ver avaliações e experimentos" variant="secondary" />
          </PageContainer>
        </section>

        <section id="decision" className="border-y border-[var(--border)] bg-[var(--surface)] py-14">
          <PageContainer className="grid gap-8">
            <SectionTitle
              eyebrow="Decisão técnica"
              title="ADR-001 resume a estratégia atual"
              description="A decisão separa fluxo principal, pesquisa e experimentos para evitar promover LLM por uma métrica isolada."
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
              description="A lista reflete o que existe no repositório e na documentação técnica."
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
                Comece pela fila demonstrativa e depois abra as avaliações para discutir a decisão técnica.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LandingButton href="/demo/moderation" label="Explorar a fila de moderação" />
              <LandingButton href="/demo/evaluations" label="Ver avaliações e experimentos" variant="secondary" />
            </div>
          </PageContainer>
        </section>
      </main>

      <AppFooter
        links={[
          { label: "Demonstração", href: "/demo/moderation" },
          { label: "Avaliações", href: "/demo/evaluations" },
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
            <p className="text-sm font-semibold">Fila de moderação</p>
            <p className="text-xs text-[var(--muted-foreground)]">Recomendação assistida e decisão humana</p>
          </div>
          <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
            HITL obrigatório
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_18rem]">
          <div className="grid gap-3">
            <PreviewRow title="Comentário com sarcasmo" value="Risco médio | crítica ambígua" />
            <PreviewRow title="Convite para grupo externo" value="Spam | policy R-001" />
            <PreviewRow title="Ataque a grupo protegido" value="Safety review | policy R-004" />
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold">Decisão humana</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Aprovar, sinalizar, remover ou solicitar edição. Divergências ficam auditáveis.
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
