import Link from "next/link";
import { FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EmptyDocumentsStateProps = {
  isAdmin: boolean;
  onImport: () => void;
};

export function EmptyDocumentsState({
  isAdmin,
  onImport,
}: EmptyDocumentsStateProps) {
  return (
    <Card className="rounded-[24px] border-[#d9dde3] bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#efffdd]">
        <FileSearch className="h-6 w-6 text-[#1A1A1A]" />
      </div>
      <h2 className="heading-3 mt-5 text-[#1A1A1A]">Nenhum documento disponível</h2>
      <p className="mt-3 max-w-xl mx-auto text-sm leading-7 text-[#666666]">
        Importe um PDF para iniciar o Smart Ingest e transformar o conteúdo em
        uma base consultável com resumo, tópicos, embeddings e respostas com
        fontes.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {isAdmin ? (
          <Button type="button" onClick={onImport}>
            Importar primeiro documento
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-md border border-[#d9dde3] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A]"
          >
            Voltar para a Home
          </Link>
        )}
      </div>
    </Card>
  );
}
