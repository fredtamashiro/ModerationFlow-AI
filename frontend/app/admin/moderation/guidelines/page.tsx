"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatLabel } from "@/lib/moderation";
import {
  listModerationGuidelines,
  type ModerationGuideline,
  type PaginatedModerationGuidelines,
} from "@/services/moderationApi";

const severityOptions = [
  { label: "Todas", value: "all" },
  { label: "Baixa", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
] as const;

export default function ModerationGuidelinesPage() {
  return (
    <Suspense fallback={<GuidelinesFallback />}>
      <AdminPageShell
        title="Diretrizes de moderacao"
        description="Catalogo administrativo das regras de comunidade usadas pela plataforma."
      >
        <ModerationGuidelinesContent />
      </AdminPageShell>
    </Suspense>
  );
}

function ModerationGuidelinesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const severity = searchParams.get("severity") ?? "all";
  const limit = Number(searchParams.get("limit") ?? "20");
  const offset = Number(searchParams.get("offset") ?? "0");

  const [data, setData] = useState<PaginatedModerationGuidelines | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const nextData = await listModerationGuidelines({
          severity: severity === "all" ? undefined : severity,
          limit,
          offset,
        });

        if (!isMounted) {
          return;
        }

        setData(nextData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as diretrizes de moderacao.",
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
  }, [limit, offset, severity]);

  function updateQuery(next: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  const hasPreviousPage = offset > 0;
  const hasNextPage = data ? offset + data.items.length < data.total : false;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/moderation"
          className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
        >
          Voltar para comentarios
        </Link>

        <div className="flex items-center gap-3">
          <label className="text-sm text-[var(--muted-foreground)]" htmlFor="severity-filter">
            Severidade
          </label>
          <select
            id="severity-filter"
            value={severity}
            onChange={(event) =>
              updateQuery({
                severity: event.target.value,
                offset: 0,
              })
            }
            className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle>Lista de diretrizes</CardTitle>
          <CardDescription>
            Consulta em leitura da base seedada de politicas da comunidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Carregando diretrizes...
            </p>
          ) : null}

          {!isLoading && errorMessage ? (
            <p className="text-sm text-[var(--danger)]">{errorMessage}</p>
          ) : null}

          {!isLoading && !errorMessage && data?.items.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Nenhuma diretriz encontrada para o filtro selecionado.
            </p>
          ) : null}

          {!isLoading && !errorMessage && data?.items.length ? (
            <>
              <div className="grid gap-4">
                {data.items.map((guideline) => (
                  <GuidelineCard key={guideline.id} guideline={guideline} />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Exibindo {offset + 1} a {Math.min(offset + data.items.length, data.total)} de{" "}
                  {data.total} diretrizes.
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateQuery({ offset: Math.max(offset - limit, 0) })}
                    disabled={!hasPreviousPage}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateQuery({ offset: offset + limit })}
                    disabled={!hasNextPage}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

function GuidelinesFallback() {
  return (
    <AdminPageShell
      title="Diretrizes de moderacao"
      description="Catalogo administrativo das regras de comunidade usadas pela plataforma."
    >
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
          Carregando diretrizes...
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function GuidelineCard({ guideline }: { guideline: ModerationGuideline }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]">
              {guideline.code}
            </Badge>
            <Badge>{formatLabel(guideline.severity)}</Badge>
          </div>
          <h2 className="text-lg font-semibold">{guideline.title}</h2>
        </div>

        <Link
          href={`/admin/moderation/guidelines/${guideline.id}`}
          className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
        >
          Ver detalhes
        </Link>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
        {guideline.description}
      </p>

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        Atualizada em {formatDateTime(guideline.updated_at)}
      </p>
    </div>
  );
}
