import Link from "next/link";

import { GithubIcon } from "@/components/icons/github-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";
import { PageContainer } from "@/components/layout/page-container";

type FooterLink = {
  label: string;
  href: string;
};

type AppFooterProps = {
  links?: FooterLink[];
};

export function AppFooter({ links = [] }: AppFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10">
      <PageContainer className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="heading-4 text-[var(--foreground)]">ModerationFlow AI</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
            Aplicação full stack de moderação assistida por IA com LangGraph,
            análise de comentários, revisão humana e trilha de auditoria.
          </p>
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            © {currentYear} Fred Tamashiro. Projeto em desenvolvimento.
          </p>
        </div>

        <div className="grid gap-6 md:justify-items-end">
          {links.length > 0 && (
            <nav aria-label="Links do rodape" className="flex flex-wrap gap-4 text-sm">
              {links.map((link) => {
                const isInternalRoute = link.href.startsWith("/");

                if (isInternalRoute) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-[var(--accent-secondary)] transition hover:text-[var(--foreground)]"
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[var(--accent-secondary)] transition hover:text-[var(--foreground)]"
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/fredtamashiro"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub de Fred Tamashiro"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/fredtamashiro/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Fred Tamashiro"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]"
            >
              <LinkedinIcon className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
