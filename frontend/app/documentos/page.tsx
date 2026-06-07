"use client";

import { useState } from "react";

import { AdminLogin } from "@/components/admin-login";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { useAdminSession } from "@/hooks/use-admin-session";

export default function DocumentosPage() {
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

      <main className="min-h-screen bg-[#fafafa] pb-16 pt-28 text-[#1A1A1A]">
        <section className="bg-[#fafafa] py-10">
          <DocumentWorkspace adminUser={adminUser} />
        </section>
      </main>

      <AppFooter
        links={[
          { label: "Home", href: "/" },
          { label: "Documentos", href: "/documentos" },
          { label: "Arquitetura", href: "/#arquitetura" },
          { label: "Deploy", href: "/#deploy" },
        ]}
      />
    </>
  );
}
