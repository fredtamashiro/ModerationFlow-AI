"use client";

import { type ReactNode, useState } from "react";

import { AdminLogin } from "@/components/admin-login";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { useAdminSession } from "@/hooks/use-admin-session";

export function PublicDemoShell({
  children,
  contentClassName,
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const {
    adminUser,
    isCheckingSession,
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
      <main className="min-h-screen bg-[var(--background)] pt-44 text-[var(--foreground)] sm:pt-28">
        <PageContainer className={`grid gap-6 py-12 ${contentClassName ?? ""}`}>{children}</PageContainer>
      </main>
      <AppFooter
        links={[
          { label: "Demonstração", href: "/demo/moderation" },
          { label: "Avaliações", href: "/demo/evaluations" },
          { label: "Outros projetos de IA", href: "/outros-projetos" },
        ]}
      />
    </>
  );
}

