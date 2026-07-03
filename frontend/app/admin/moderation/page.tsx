"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bot, CalendarClock, MessageSquare, UserCheck } from "lucide-react";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminModerationNav } from "@/components/moderation/admin-moderation-nav";
import { DemoScenarios } from "@/components/moderation/demo-scenarios";
import { StatusBadge } from "@/components/moderation/status-badge";
import { ValueBadge } from "@/components/moderation/value-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatLabel } from "@/lib/moderation";
import {
  listCommentDecisions,
  listCommentRuns,
  listModerationComments,
  type ModerationComment,
  type ModerationDecision,
  type ModerationRun,
  type PaginatedModerationComments,
} from "@/services/moderationApi";

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Pendentes de analise", value: "pending" },
  { label: "Em analise", value: "analyzing" },
  { label: "Revisao humana", value: "waiting_human_review" },
  { label: "Aprovados", value: "approved" },
  { label: "Removidos", value: "removed" },
  { label: "Edicao solicitada", value: "edit_requested" },
  { label: "Falhas", value: "failed" },
] as const;

type SummaryCounts = {
  total: number;
  pending: number;
  waitingHumanReview: number;
  closed: number;
};

type QueueItem = {
  comment: ModerationComment;
  latestRun: ModerationRun | null;
  latestDecision: ModerationDecision | null;
};

function getStatusFilter(value: string): string | undefined {
  if (value === "all") {
    return undefined;
  }

  return value;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof MessageSquare;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="grid gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
          <Icon className="h-4 w-4 text-[var(--accent-secondary)]" />
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function ModerationDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <AdminPageShell
        title="Fila de moderacao"
        description="Comentarios organizados para analise assistida, decisao humana e auditoria."
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
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [demoComments, setDemoComments] = useState<ModerationComment[]>([]);
  const [summary, setSummary] = useState<SummaryCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [comments, demoSourceComments, allComments, pendingComments, humanReviewComments, approvedComments, removedComments] =
          await Promise.all([
            listModerationComments({
              status: getStatusFilter(status),
              limit,
              offset,
            }),
            listModerationComments({ limit: 100, offset: 0 }),
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

        const enrichedItems = await Promise.all(
          comments.items.map(async (comment) => {
            const [runs, decisions] = await Promise.all([
              listCommentRuns(comment.id),
              listCommentDecisions(comment.id),
            ]);
            const sortedRuns = [...runs].sort(
              (left, right) =>
                new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
            );
            const sortedDecisions = [...decisions].sort(
              (left, right) =>
                new Date(right.decided_at).getTime() - new Date(left.decided_at).getTime(),
            );

            return {
              comment,
              latestRun: sortedRuns[0] ?? null,
              latestDecision: sortedDecisions[0] ?? null,
            };
          }),
        );

        if (!isMounted) {
          return;
        }

        setData(comments);
        setQueueItems(enrichedItems);
        setDemoComments(demoSourceComments.items);
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
            : "Nao foi possivel carregar a fila de moderacao.",
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
    <div className="grid gap-6">
      <AdminModerationNav />

      <section className="grid gap-4 md:grid-cols-4" aria-label="Resumo da fila">
        <MetricCard
          label="Comentarios"
          value={summary?.total ?? 0}
          description="Total cadastrado para moderacao."
          icon={MessageSquare}
        />
        <MetricCard
          label="Pendentes"
          value={summary?.pending ?? 0}
          description="Aguardam analise assistida ou triagem."
          icon={CalendarClock}
        />
        <MetricCard
          label="Revisao humana"
          value={summary?.waitingHumanReview ?? 0}
          description="Precisam de decisao do moderador."
          icon={UserCheck}
        />
        <MetricCard
          label="Encerrados"
          value={summary?.closed ?? 0}
          description="Aprovados ou removidos no fluxo."
          icon={Bot}
        />
      </section>

      <DemoScenarios comments={demoComments} />

      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader className="grid gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Fila de comentarios</CardTitle>
              <CardDescription>
                A IA recomenda sinais de risco. O moderador decide a acao final.
              </CardDescription>
            </div>

            <Link
              href="/admin/moderation/guidelines"
              className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
            >
              Ver regras da comunidade
            </Link>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filtros da fila">
            {statusOptions.map((option) => {
              const active = status === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateQuery({ status: option.value, offset: 0 })}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-soft)] hover:text-[var(--accent-secondary)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <EmptyState title="Carregando fila" description="Buscando comentarios, recomendacoes e decisoes." />
          ) : null}

          {!isLoading && errorMessage ? (
            <EmptyState title="Erro ao carregar" description={errorMessage} tone="danger" />
          ) : null}

          {!isLoading && !errorMessage && queueItems.length === 0 ? (
            <EmptyState
              title="Nenhum comentario neste agrupamento"
              description="Altere o filtro ou aguarde novos comentarios entrarem na fila."
            />
          ) : null}

          {!isLoading && !errorMessage && queueItems.length > 0 ? (
            <>
              <div className="grid gap-3">
                {queueItems.map((item) => (
                  <QueueCard key={item.comment.id} item={item} />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Exibindo {offset + 1} a {Math.min(offset + data!.items.length, data!.total)} de{" "}
                  {data!.total} comentarios.
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

      <Card
        id="queue-audit-note"
        className="border-[var(--border)] bg-[var(--surface)]"
      >
        <CardContent className="p-5 text-sm leading-7 text-[var(--muted-foreground)]">
          A auditoria detalhada fica dentro de cada comentario: runs, steps do grafo,
          critic agent, metadata e historico de decisoes permanecem acessiveis sem
          competir com a fila operacional.
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardFallback() {
  return (
    <AdminPageShell
      title="Fila de moderacao"
      description="Comentarios organizados para analise assistida, decisao humana e auditoria."
    >
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
          Carregando fila...
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function QueueCard({ item }: { item: QueueItem }) {
  const { comment, latestRun, latestDecision } = item;
  const excerpt =
    comment.content.length > 180 ? `${comment.content.slice(0, 180).trim()}...` : comment.content;

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={comment.status} />
            <span className="text-sm text-[var(--muted-foreground)]">
              {formatDateTime(comment.created_at)}
            </span>
          </div>

          <p className="text-sm font-medium">{comment.author_name}</p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
            {excerpt}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {comment.course_name ?? "Curso nao informado"} / {comment.lesson_name ?? "Aula nao informada"}
          </p>
        </div>

        <div className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <QueueFact
            label="Categoria sugerida"
            value={latestRun?.category ? formatLabel(latestRun.category) : "Sem analise"}
          />
          <QueueFact
            label="Risco sugerido"
            value={
              latestRun?.risk_level ? (
                <ValueBadge value={latestRun.risk_level} label={formatLabel(latestRun.risk_level)} />
              ) : (
                "Sem analise"
              )
            }
          />
          <QueueFact
            label="Acao humana"
            value={
              latestDecision?.human_decision ? (
                <ValueBadge
                  value={latestDecision.human_decision}
                  label={formatLabel(latestDecision.human_decision)}
                />
              ) : (
                "Pendente"
              )
            }
          />

          <Link
            href={`/admin/moderation/comments/${comment.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            Revisar comentario
          </Link>
        </div>
      </div>
    </article>
  );
}

function QueueFact({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
  tone = "default",
}: {
  title: string;
  description: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        tone === "danger"
          ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]"
          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-foreground)]"
      }`}
    >
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-sm leading-6">{description}</p>
    </div>
  );
}
