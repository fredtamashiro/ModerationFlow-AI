import { RefreshCw, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DocumentItem } from "@/services/api";

type DocumentSelectorProps = {
  documents: DocumentItem[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  onChange: (documentId: string) => void;
  onRefresh: () => void;
  onImport: () => void;
  onDelete: () => void;
};

export function DocumentSelector({
  documents,
  selectedDocumentId,
  isLoading,
  isAdmin,
  onChange,
  onRefresh,
  onImport,
  onDelete,
}: DocumentSelectorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_auto] lg:items-end">
      <div className="w-full">
        <h2 className="mb-2 heading-4 text-[#1A1A1A]">
          Documentos disponíveis
        </h2>
        <Select
          value={selectedDocumentId ?? ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading || documents.length === 0}
          className="h-12 w-full"
        >
          {documents.map((document) => (
            <option key={document.document_id} value={document.document_id}>
              {document.original_filename}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-3 lg:justify-end">
        {isAdmin && (
          <Button type="button" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        )}
        {isAdmin && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Apagar
          </Button>
        )}
        {isAdmin && (
          <Button type="button" onClick={onImport}>
            <Upload className="h-4 w-4" />
            Importar documento
          </Button>
        )}
      </div>
    </div>
  );
}
