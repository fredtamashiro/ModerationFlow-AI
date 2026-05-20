"use client";

import { FormEvent, useState } from "react";

import { uploadDocument } from "@/services/api";

type DocumentUploadProps = {
  onUploadSuccess: () => void;
};

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setMessage("Selecione um PDF antes de enviar.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setMessage("Apenas arquivos PDF são permitidos.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage("Enviando e processando o manual. Isso pode levar alguns segundos...");

      await uploadDocument(selectedFile);

      setSelectedFile(null);
      setMessage("Manual enviado e indexado com sucesso.");
      onUploadSuccess();
    } catch {
      setMessage("Não foi possível enviar o manual.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <h2 className="text-xl font-semibold">Adicionar manual</h2>
      <p className="mt-1 text-sm text-slate-400">
        Envie um PDF para que ele seja processado, dividido em chunks e indexado no vector store.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          disabled={isUploading}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:text-slate-200 hover:file:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isUploading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Processando..." : "Enviar PDF"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-sm text-slate-400">{message}</p>
      )}
    </section>
  );
}
