import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <div>
      <span className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]">
        IA aplicada a documentos
      </span>

      <h1 className="heading-1 mt-5 max-w-4xl text-[var(--foreground)]">
        Transformando PDFs
        <br />
        em uma base inteligente
        <br />
        de consulta com <span className="text-[var(--accent)]">IA.</span>
      </h1>

      <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
        O SmartDocs AI é uma aplicação full stack que processa documentos,
        gera embeddings, realiza busca semântica e responde perguntas com
        fontes rastreáveis.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/documentos"
          className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"
        >
          Ver demo
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <a
          href="#arquitetura"
          className="inline-flex h-12 items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
        >
          Entender arquitetura
        </a>
      </div>
    </div>
  );
}
