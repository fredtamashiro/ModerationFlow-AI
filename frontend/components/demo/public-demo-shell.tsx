"use client";

import { type ReactNode, useState } from "react";

import { AdminLogin } from "@/components/admin-login";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { useAdminSession } from "@/hooks/use-admin-session";

export function PublicDemoShell({
  children,
}: {
  children: ReactNode;
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
      <main className="min-h-screen bg-[var(--background)] pt-28 text-[var(--foreground)]">
        <PageContainer className="grid gap-6 py-12">{children}</PageContainer>
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

