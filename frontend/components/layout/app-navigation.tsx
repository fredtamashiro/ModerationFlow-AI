"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const appNavItems = [
  { label: "Início", href: "/" },
  { label: "Demonstração", href: "/demo/moderation" },
  { label: "Avaliações", href: "/demo/evaluations" },
  { label: "Outros projetos de IA", href: "/outros-projetos" },
] as const;

const adminNavItems = [
  { label: "Início", href: "/" },
  { label: "Moderação", href: "/admin/moderation" },
  { label: "Avaliações", href: "/admin/moderation/evaluations" },
  { label: "Outros projetos de IA", href: "/outros-projetos" },
] as const;

function isActiveItem(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  if (href === "/admin/moderation") {
    return pathname === href || pathname.startsWith("/admin/moderation/comments/");
  }

  if (href !== "/" && pathname.startsWith(`${href}/`)) {
    return true;
  }

  return pathname === href;
}

export function AppNavigation({
  isAdmin = false,
  mobile = false,
}: {
  isAdmin?: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : appNavItems;

  return (
    <nav
      aria-label="Navegação principal"
      className={mobile
        ? "grid grid-cols-2 gap-x-3 border-t border-[var(--border)] px-4 sm:grid-cols-4 lg:hidden"
        : "hidden items-center gap-6 lg:flex"}
    >
      {navItems.map((item) => {
        const isActive = isActiveItem(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 items-center rounded-sm text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-secondary)]",
              mobile ? "justify-center py-2 text-center" : "shrink-0",
              isActive
                ? "text-[var(--accent-secondary)]"
                : "text-[var(--foreground)] hover:text-[var(--accent-secondary)]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
