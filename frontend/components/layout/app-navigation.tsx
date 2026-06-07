"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const appNavItems = [
  { label: "Início", href: "/" },
  { label: "Documentos", href: "/documentos" },
] as const;

function isActiveItem(href: string, pathname: string): boolean {
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
                ? "text-[#2F6F6D]"
                : "text-[#1A1A1A] hover:text-[#2F6F6D]",
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
