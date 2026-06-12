"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatLabel, formatMetadata } from "@/lib/moderation";
import {
  getModerationGuideline,
  type ModerationGuideline,
} from "@/services/moderationApi";

export default function GuidelineDetailPage() {
  const params = useParams<{ id: string }>();
  const guidelineId = typeof params.id === "string" ? params.id : "";
  const [guideline, setGuideline] = useState<ModerationGuideline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!guidelineId) {
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const nextGuideline = await getModerationGuideline(guidelineId);

        if (!isMounted) {
          return;
        }

        setGuideline(nextGuideline);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a diretriz de moderacao.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [guidelineId]);

  return (
    <AdminPageShell
      title="Detalhe da diretriz"
      description="Consulta administrativa de uma politica de moderacao cadastrada."
    >
      <Link
        href="/admin/moderation/guidelines"
        className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
      >
        Voltar para diretrizes
      </Link>

      {isLoading ? (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Carregando diretriz...
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card className="border-[var(--danger-border)] bg-[var(--danger-soft)]">
          <CardContent className="p-6 text-sm text-[var(--danger)]">
            {errorMessage}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && guideline ? (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
                {guideline.code}
              </Badge>
              <Badge>{formatLabel(guideline.severity)}</Badge>
            </div>

            <div>
              <CardTitle>{guideline.title}</CardTitle>
              <CardDescription>
                Atualizada em {formatDateTime(guideline.updated_at)}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Descricao
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {guideline.description}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Exemplos
              </p>
              {guideline.examples.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                  Nenhum exemplo registrado ainda.
                </p>
              ) : (
                <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-soft)] p-4 text-xs leading-6">
                  {formatMetadata(guideline.examples)}
                </pre>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Metadata
              </p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-soft)] p-4 text-xs leading-6">
                {formatMetadata(guideline.metadata)}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </AdminPageShell>
  );
}
