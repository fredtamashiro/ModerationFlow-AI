"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { StatusBadge } from "@/components/moderation/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/moderation";
import {
  listModerationComments,
  type ModerationComment,
  type PaginatedModerationComments,
} from "@/services/moderationApi";

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Pendente", value: "pending" },
  { label: "Em analise", value: "analyzing" },
  { label: "Revisao humana", value: "waiting_human_review" },
  { label: "Aprovado", value: "approved" },
  { label: "Removido", value: "removed" },
  { label: "Edicao solicitada", value: "edit_requested" },
  { label: "Falhou", value: "failed" },
] as const;

type SummaryCounts = {
  total: number;
  pending: number;
  waitingHumanReview: number;
  closed: number;
};

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function ModerationDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <AdminPageShell
        title="Moderation Dashboard"
        description="Visao inicial da fila de comentarios e do estado operacional da moderacao."
      >
        <ModerationDashboardContent />
      </AdminPageShell>
    </Suspense>
  );
}

function ModerationDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const limit = Number(searchParams.get("limit") ?? "20");
  const offset = Number(searchParams.get("offset") ?? "0");

  const [data, setData] = useState<PaginatedModerationComments | null>(null);
  const [summary, setSummary] = useState<SummaryCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [comments, allComments, pendingComments, humanReviewComments, approvedComments, removedComments] =
          await Promise.all([
            listModerationComments({
              status: status === "all" ? undefined : status,
              limit,
              offset,
            }),
            listModerationComments({ limit: 1, offset: 0 }),
            listModerationComments({ status: "pending", limit: 1, offset: 0 }),
            listModerationComments({
              status: "waiting_human_review",
              limit: 1,
              offset: 0,
            }),
            listModerationComments({ status: "approved", limit: 1, offset: 0 }),
            listModerationComments({ status: "removed", limit: 1, offset: 0 }),
          ]);

        if (!isMounted) {
          return;
        }

        setData(comments);
        setSummary({
          total: allComments.total,
          pending: pendingComments.total,
          waitingHumanReview: humanReviewComments.total,
          closed: approvedComments.total + removedComments.total,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o dashboard de moderacao.",
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
  }, [limit, offset, status]);

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
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Comentarios"
          value={summary?.total ?? 0}
          description="Total cadastrado na base de moderacao."
        />
        <MetricCard
          label="Pendentes"
          value={summary?.pending ?? 0}
          description="Itens aguardando processamento ou triagem."
        />
        <MetricCard
          label="Revisao humana"
          value={summary?.waitingHumanReview ?? 0}
          description="Casos que exigem decisao manual."
        />
        <MetricCard
          label="Aprovados ou removidos"
          value={summary?.closed ?? 0}
          description="Comentarios ja encerrados no fluxo."
        />
      </div>

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Fila de comentarios</CardTitle>
            <CardDescription>
              Lista administrativa consumindo os endpoints protegidos do backend.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-[var(--muted-foreground)]" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(event) =>
                updateQuery({
                  status: event.target.value,
                  offset: 0,
                })
              }
              className="h-11 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              href="/admin/moderation/guidelines"
              className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
            >
              Ver diretrizes
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Carregando comentarios de moderacao...
            </p>
          ) : null}

          {!isLoading && errorMessage ? (
            <p className="text-sm text-[var(--danger)]">{errorMessage}</p>
          ) : null}

          {!isLoading && !errorMessage && data?.items.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Nenhum comentario encontrado para o filtro selecionado.
            </p>
          ) : null}

          {!isLoading && !errorMessage && data?.items.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted-foreground)]">
                      <th className="px-3 py-3 font-medium">Autor</th>
                      <th className="px-3 py-3 font-medium">Curso</th>
                      <th className="px-3 py-3 font-medium">Aula</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Criado em</th>
                      <th className="px-3 py-3 font-medium">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.items.map((comment) => (
                      <CommentRow key={comment.id} comment={comment} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Exibindo {offset + 1} a {Math.min(offset + data.items.length, data.total)} de{" "}
                  {data.total} comentarios.
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

function DashboardFallback() {
  return (
    <AdminPageShell
      title="Moderation Dashboard"
      description="Visao inicial da fila de comentarios e do estado operacional da moderacao."
    >
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
          Carregando dashboard...
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function CommentRow({ comment }: { comment: ModerationComment }) {
  return (
    <tr className="align-top">
      <td className="px-3 py-4 font-medium">{comment.author_name}</td>
      <td className="px-3 py-4 text-[var(--muted-foreground)]">
        {comment.course_name ?? "Nao informado"}
      </td>
      <td className="px-3 py-4 text-[var(--muted-foreground)]">
        {comment.lesson_name ?? "Nao informada"}
      </td>
      <td className="px-3 py-4">
        <StatusBadge status={comment.status} />
      </td>
      <td className="px-3 py-4 text-[var(--muted-foreground)]">
        {formatDateTime(comment.created_at)}
      </td>
      <td className="px-3 py-4">
        <Link
          href={`/admin/moderation/comments/${comment.id}`}
          className="font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
        >
          Ver detalhes
        </Link>
      </td>
    </tr>
  );
}
