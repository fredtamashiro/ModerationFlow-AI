"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const appNavItems = [
  { label: "Inicio", href: "/" },
  { label: "Runbook", href: "/#runbook" },
  { label: "Moderacao", href: "/admin/moderation" },
] as const;

function isActiveItem(href: string, pathname: string): boolean {
  if (href.startsWith("/#")) {
    return pathname === "/";
  }

  if (href !== "/" && pathname.startsWith(`${href}/`)) {
    return true;
  }

  return pathname === href;
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-8 md:flex">
      {appNavItems.map((item) => {
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
