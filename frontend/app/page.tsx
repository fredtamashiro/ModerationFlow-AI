"use client";

import { useState } from "react";

import { AdminLogin } from "@/components/admin-login";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminSession } from "@/hooks/use-admin-session";

const conceptCards = [
  {
    title: "Grafo decisorio com LangGraph",
    description:
      "Orquestracao de etapas de analise, classificacao de risco e critica antes da decisao final.",
  },
  {
    title: "Revisao humana obrigatoria",
    description:
      "Fluxos Human-in-the-Loop para aprovar, corrigir ou escalar decisoes sensiveis.",
  },
  {
    title: "Auditoria e feedback",
    description:
      "Registro de eventos, trilha de decisao e captacao de feedback para melhoria continua.",
  },
  {
    title: "Diretrizes de comunidade",
    description:
      "Consulta estruturada a politicas e regras para apoiar a consistencia da moderacao.",
  },
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

      <main className="min-h-screen bg-[var(--background)] pt-28 text-[var(--foreground)]">
        <section id="home" className="scroll-mt-28 py-12">
          <PageContainer className="grid gap-8">
            <div className="max-w-3xl space-y-5">
              <Badge className="w-fit rounded-full bg-[var(--accent)] px-4 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent-foreground)]">
                Projeto em desenvolvimento
              </Badge>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                  ModerationFlow AI
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                  Sistema de moderacao assistida por IA com LangGraph,
                  Human-in-the-Loop e auditoria de decisoes.
                </p>
                <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                  A base atual prepara uma aplicacao full stack para analisar
                  comentarios de uma plataforma de cursos online, consultar
                  diretrizes de comunidade, classificar risco, sugerir decisao e
                  encaminhar casos para revisao humana.
                </p>
              </div>
            </div>

            {authErrorMessage && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-sm text-red-700">
                  {authErrorMessage}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {conceptCards.map((card) => (
                <Card
                  key={card.title}
                  className="border-[var(--border)] bg-[var(--surface)]"
                >
                  <CardContent className="space-y-3 p-6">
                    <p className="text-lg font-semibold">{card.title}</p>
                    <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card
              id="runbook"
              className="border-[var(--border)] bg-[var(--surface)]"
            >
              <CardContent className="grid gap-4 p-6 md:grid-cols-[1.4fr_0.6fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-secondary)]">
                    Base tecnica
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                    Stack inicial: FastAPI, Next.js, PostgreSQL, LangGraph,
                    OpenAI e Docker. A visao tecnica desta etapa esta no arquivo
                    <span className="mx-1 font-medium text-[var(--foreground)]">
                      docs/development-runbook.md
                    </span>
                    do repositorio.
                  </p>
                </div>
                <div className="text-sm text-[var(--muted-foreground)] md:text-right">
                  Placeholder inicial do produto, sem telas de moderacao
                  implementadas nesta etapa.
                </div>
              </CardContent>
            </Card>
          </PageContainer>
        </section>
      </main>

      <AppFooter />
    </>
  );
}
