"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const appNavItems = [
  { label: "Início", href: "/" },
  { label: "Demonstração", href: "/demo/moderation" },
  { label: "Avaliações", href: "/demo/evaluations" },
] as const;

const adminNavItems = [
  { label: "Início", href: "/" },
  { label: "Moderação", href: "/admin/moderation" },
  { label: "Avaliações", href: "/admin/moderation/evaluations" },
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
}: {
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : appNavItems;

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {navItems.map((item) => {
        const isActive = isActiveItem(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-semibold transition",
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
