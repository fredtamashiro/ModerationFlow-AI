"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, FileClock, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Comentarios",
    href: "/admin/moderation",
    icon: ClipboardList,
  },
  {
    label: "Regras da comunidade",
    href: "/admin/moderation/guidelines",
    icon: ShieldCheck,
  },
] as const;

const technicalNavItems = [
  {
    label: "Avaliacoes",
    href: "/admin/moderation/evaluations",
    icon: BarChart3,
  },
] as const;

function isActive(href: string, pathname: string): boolean {
  const path = href.split("#")[0];

  if (path === "/admin/moderation") {
    return pathname === path || pathname.startsWith("/admin/moderation/comments/");
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AdminModerationNav({
  auditHref = "/admin/moderation#queue-audit-note",
}: {
  auditHref?: string;
}) {
  const pathname = usePathname();
  const items = [
    ...navItems,
    {
      label: "Auditoria",
      href: auditHref,
      icon: FileClock,
    },
  ] as const;

  return (
    <nav
      aria-label="Navegacao de moderacao"
      className="flex flex-wrap gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2"
    >
      {items.map((item) => {
        const active = isActive(item.href, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <span className="mx-1 hidden w-px self-stretch bg-[var(--border)] sm:block" aria-hidden="true" />

      {technicalNavItems.map((item) => {
        const active = isActive(item.href, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
