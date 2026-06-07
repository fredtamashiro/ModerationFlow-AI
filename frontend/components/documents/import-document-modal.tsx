"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AlertTriangle, FileText, Loader2, UploadCloud, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProcessingStatus } from "@/components/documents/processing-status";
import {
  getProcessingJob,
  getThemes,
  ProcessingJob,
  startSmartIngest,
  Theme,
} from "@/services/api";

type ImportDocumentModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCompleted?: () => void;
};

export function ImportDocumentModal({
  isOpen,
  onOpenChange,
  onCompleted,
}: ImportDocumentModalProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState("generic_pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    async function loadThemes() {
      try {
        const result = await getThemes();
        setThemes(result.themes);

        const defaultTheme =
          result.themes.find((theme) => theme.theme_id === "generic_pdf") ??
          result.themes[0];

        if (defaultTheme) {
          setSelectedThemeId(defaultTheme.theme_id);
        }
      } catch {
        setErrorMessage("Não foi possível carregar os temas.");
      }
    }

    if (isOpen) {
      void loadThemes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const updatedJob = await getProcessingJob(job.job_id);
        setJob(updatedJob);

        if (updatedJob.status === "completed") {
          onCompleted?.();
        }
      } catch {
        setErrorMessage("Não foi possível atualizar o status do processamento.");
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [job, onCompleted]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Selecione um arquivo PDF.");
      return;
    }

    try {
      setIsStarting(true);
      setErrorMessage("");
      setShowTechnicalDetails(false);

      const result = await startSmartIngest({
        file: selectedFile,
        themeId: selectedThemeId,
        chunkSize: 1000,
        chunkOverlap: 200,
        batchSize: 10,
      });

      setJob(result.job);
      setSelectedFile(null);
    } catch {
      setErrorMessage("Não foi possível iniciar o processamento inteligente.");
    } finally {
      setIsStarting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  const isProcessing = job?.status === "pending" || job?.status === "processing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/45 px-4 py-8 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto p-0">
        <CardHeader className="mb-0 border-b border-[#d9dde3] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Importar documento</CardTitle>
              <CardDescription>
                Envie um PDF e escolha um tema para o processamento inteligente.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar modal de importação"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
                Tema do documento
              </label>

              <Select
                value={selectedThemeId}
                onChange={(event) => setSelectedThemeId(event.target.value)}
              >
                {themes.map((theme) => (
                  <option key={theme.theme_id} value={theme.theme_id}>
                    {theme.name}
                  </option>
                ))}
              </Select>

              {themes.length > 0 && (
                <p className="mt-2 text-xs text-[#666666]">
                  {
                    themes.find((theme) => theme.theme_id === selectedThemeId)
                      ?.description
                  }
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
                Arquivo PDF
              </label>

              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={isStarting || isProcessing}
                className="cursor-pointer"
              />

              {selectedFile && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#666666]">
                  <FileText className="h-3.5 w-3.5" />
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isStarting || isProcessing}>
              {isStarting || isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {isStarting || isProcessing
                ? "Processando..."
                : "Iniciar Smart Ingest"}
            </Button>
          </form>

          {errorMessage && (
            <Alert className="mt-4 border-red-200 bg-red-50 text-red-700">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {errorMessage}
              </span>
            </Alert>
          )}

          {job && (
            <ProcessingStatus
              job={job}
              showTechnicalDetails={showTechnicalDetails}
              onToggleTechnicalDetails={() =>
                setShowTechnicalDetails((current) => !current)
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
