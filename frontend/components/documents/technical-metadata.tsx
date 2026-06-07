import { Card } from "@/components/ui/card";
import { DocumentItem } from "@/services/api";

type TechnicalMetadataProps = {
  document: DocumentItem;
};

export function TechnicalMetadata({ document }: TechnicalMetadataProps) {
  const metadata = [
    { label: "Tema", value: document.theme_name || "-" },
    { label: "Tipo", value: document.document_type || "-" },
    { label: "Páginas", value: String(document.total_pages) },
    { label: "Chunks", value: String(document.total_chunks) },
    {
      label: "Criado em",
      value: document.created_at
        ? new Date(document.created_at).toLocaleString("pt-BR")
        : "-",
    },
    { label: "ID", value: document.document_id },
  ];

  return (
    <Card className="rounded-[20px] bg-[#F7F8FA] p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="heading-4 text-[#1A1A1A]">Metadados técnicos</h3>
      </div>

      <div className="mt-4 space-y-3">
        {metadata.map((item) => (
          <div key={item.label} className="rounded-lg bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#666666]">
              {item.label}
            </p>
            <p className="mt-1 break-all text-sm text-[#1A1A1A]">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
