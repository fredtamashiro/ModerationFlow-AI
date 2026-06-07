"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { ProcessingJob } from "@/services/api";

type ProcessingStatusProps = {
  job: ProcessingJob;
  showTechnicalDetails: boolean;
  onToggleTechnicalDetails: () => void;
};

function getStatusLabel(status: ProcessingJob["status"]): string {
  switch (status) {
    case "pending":
      return "Na fila";
    case "processing":
      return "Processando";
    case "completed":
      return "Concluído";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
}

function StatusIcon({ status }: { status: ProcessingJob["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-[#2F6F6D]" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-[#2F6F6D]" />;
    default:
      return <Info className="h-4 w-4 text-[#2F6F6D]" />;
  }
}

export function ProcessingStatus({
  job,
  showTechnicalDetails,
  onToggleTechnicalDetails,
}: ProcessingStatusProps) {
  const processedChunks = job.partial_result?.processed_chunks;
  const totalChunks = job.partial_result?.total_chunks;
  const hasChunkProgress =
    processedChunks !== undefined &&
    processedChunks !== null &&
    totalChunks !== undefined &&
    totalChunks !== null;

  return (
    <div className="mt-5 rounded-lg border border-[#d9dde3] bg-[#F7F8FA] p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h5 className="heading-5 text-[#1A1A1A]">Status do processamento</h5>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#1A1A1A]">
            <StatusIcon status={job.status} />
            {job.current_step}
          </p>
        </div>

        <span className="rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-xs text-[#666666]">
          {getStatusLabel(job.status)}
        </span>
      </div>

      <Progress className="mt-4" value={job.progress} />

      <p className="mt-2 text-xs text-[#666666]">
        Progresso: {job.progress}% concluído
      </p>

      {hasChunkProgress && (
        <p className="mt-1 text-xs text-[#666666]">
          Chunks processados: {String(processedChunks)} de {String(totalChunks)}
        </p>
      )}

      {job.partial_result && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onToggleTechnicalDetails}
            className="text-xs font-medium text-[#2F6F6D] transition hover:text-[#1A1A1A]"
          >
            {showTechnicalDetails
              ? "Ocultar detalhes técnicos"
              : "Ver detalhes técnicos"}
          </button>

          {showTechnicalDetails && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-[#d9dde3] bg-white p-3 text-xs text-[#666666]">
              {JSON.stringify(job.partial_result, null, 2)}
            </pre>
          )}
        </div>
      )}

      {job.status === "completed" && job.result?.document && (
        <div className="mt-3 rounded-lg border border-[#cfeea6] bg-[#efffdd] p-3">
          <p className="flex items-center gap-2 text-sm text-[#1A1A1A]">
            <CheckCircle2 className="h-4 w-4 text-[#2F6F6D]" />
            Documento processado com sucesso.
          </p>
          <p className="mt-1 text-xs text-[#666666]">
            {job.result.document.original_filename}
          </p>
        </div>
      )}

      {job.status === "failed" && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">O processamento falhou.</p>
          {job.error && <p className="mt-1 text-xs text-red-700">{job.error}</p>}
        </div>
      )}
    </div>
  );
}
