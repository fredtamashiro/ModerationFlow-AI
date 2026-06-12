"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { AdminLogin } from "@/components/admin-login";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSession } from "@/hooks/use-admin-session";

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminPageShell({
  title,
  description,
  children,
}: AdminPageShellProps) {
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
        <PageContainer className="grid gap-6 py-12">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-secondary)]">
              Area administrativa
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>

          {authErrorMessage ? (
            <Card className="border-[var(--danger-border)] bg-[var(--danger-soft)]">
              <CardContent className="p-4 text-sm text-[var(--danger)]">
                {authErrorMessage}
              </CardContent>
            </Card>
          ) : null}

          {isCheckingSession ? (
            <Card className="border-[var(--border)] bg-[var(--surface)]">
              <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
                Verificando sessao administrativa...
              </CardContent>
            </Card>
          ) : null}

          {!isCheckingSession && !adminUser ? (
            <Card className="border-[var(--border)] bg-[var(--surface)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Login admin necessario
                </CardTitle>
                <CardDescription>
                  Estas telas consomem endpoints administrativos protegidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setIsLoginModalOpen(true)}>
                  Fazer login
                </Button>
                <Link
                  href="/"
                  className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
                >
                  Voltar para a pagina inicial
                </Link>
              </CardContent>
            </Card>
          ) : null}

          {!isCheckingSession && adminUser ? children : null}
        </PageContainer>
      </main>

      <AppFooter />
    </>
  );
}
