"use client";

import { useCallback, useEffect, useState } from "react";

import { AuthUser, getCurrentAdmin, logoutAdmin } from "@/services/api";

export function useAdminSession() {
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const reloadSession = useCallback(async () => {
    try {
      setIsCheckingSession(true);
      const user = await getCurrentAdmin();
      setAdminUser(user);
      setAuthErrorMessage("");
    } catch {
      setAdminUser(null);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentAdmin() {
      try {
        setIsCheckingSession(true);
        const user = await getCurrentAdmin();

        if (!isMounted) {
          return;
        }

        setAdminUser(user);
        setAuthErrorMessage("");
      } catch {
        if (!isMounted) {
          return;
        }

        setAdminUser(null);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void loadCurrentAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoggedIn = useCallback((user: AuthUser) => {
    setAdminUser(user);
    setAuthErrorMessage("");
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logoutAdmin();
      setAdminUser(null);
      setAuthErrorMessage("");
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar a sessão.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  return {
    adminUser,
    isCheckingSession,
    authErrorMessage,
    isLoggingOut,
    setAuthErrorMessage,
    handleLoggedIn,
    handleLogout,
    reloadSession,
  };
}
