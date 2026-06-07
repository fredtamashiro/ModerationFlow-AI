import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HeroSection() {
  return (
    <div>
      <span className="inline-flex rounded-full border border-[#cfeea6] bg-[#efffdd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]">
        IA aplicada a documentos
      </span>
      <h1 className="heading-1 mt-5 max-w-3xl text-[#1A1A1A]">
        Consulta inteligente de PDFs com ingestão assíncrona, embeddings e
        respostas com fontes.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[#666666]">
        O SmartDocs AI transforma documentos em uma base consultável com
        enriquecimento semântico, busca vetorial, rate limit e trilha de
        auditoria pronta para evoluir para um produto real.
      </p>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/documentos"
          className="inline-flex h-12 items-center gap-2 rounded-md bg-[#99FF33] px-5 py-2.5 font-medium text-[#1A1A1A]"
        >
          Abrir workspace
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <a
          href="#deploy"
          className="inline-flex h-12 items-center gap-2 rounded-md border border-[#d9dde3] bg-white px-5 py-2.5 font-medium text-[#1A1A1A]"
        >
          Planejamento de deploy
        </a>
      </div>
    </div>
  );
}
