"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { StatusBadge } from "@/components/moderation/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatLabel, formatMetadata } from "@/lib/moderation";
import {
  getModerationComment,
  listCommentDecisions,
  listCommentRuns,
  listRunSteps,
  type ModerationComment,
  type ModerationDecision,
  type ModerationRun,
  type ModerationStep,
} from "@/services/moderationApi";

export default function CommentDetailPage() {
  const params = useParams<{ id: string }>();
  const commentId = typeof params.id === "string" ? params.id : "";
  const [comment, setComment] = useState<ModerationComment | null>(null);
  const [runs, setRuns] = useState<ModerationRun[]>([]);
  const [decisions, setDecisions] = useState<ModerationDecision[]>([]);
  const [stepsByRunId, setStepsByRunId] = useState<Record<string, ModerationStep[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!commentId) {
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [nextComment, nextRuns, nextDecisions] = await Promise.all([
          getModerationComment(commentId),
          listCommentRuns(commentId),
          listCommentDecisions(commentId),
        ]);

        const runSteps = await Promise.all(
          nextRuns.map(async (run) => ({
            runId: run.id,
            steps: await listRunSteps(run.id),
          })),
        );

        if (!isMounted) {
          return;
        }

        setComment(nextComment);
        setRuns(nextRuns);
        setDecisions(nextDecisions);
        setStepsByRunId(
          Object.fromEntries(runSteps.map((entry) => [entry.runId, entry.steps])),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o comentario de moderacao.",
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
  }, [commentId]);

  return (
    <AdminPageShell
      title="Detalhe do comentario"
      description="Leitura administrativa do comentario, execucoes registradas e decisoes humanas."
    >
      <Link
        href="/admin/moderation"
        className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
      >
        Voltar para o dashboard
      </Link>

      {isLoading ? (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
            Carregando comentario...
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

      {!isLoading && !errorMessage && comment ? (
        <div className="grid gap-6">
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>{comment.author_name}</CardTitle>
              <CardDescription>
                {comment.course_name ?? "Curso nao informado"} •{" "}
                {comment.lesson_name ?? "Aula nao informada"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={comment.status} />
                <span className="text-sm text-[var(--muted-foreground)]">
                  Criado em {formatDateTime(comment.created_at)}
                </span>
              </div>

              <div className="rounded-xl bg-[var(--surface-soft)] p-5">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  Conteudo do comentario
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                  {comment.content}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  Metadata
                </p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-soft)] p-4 text-xs leading-6 text-[var(--foreground)]">
                  {formatMetadata(comment.metadata)}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Runs de moderacao</CardTitle>
              <CardDescription>
                Nenhuma acao de IA e disparada nesta tela. Ela apenas exibe o que ja existe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runs.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma analise de IA executada ainda.
                </p>
              ) : (
                runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={run.status} />
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {formatDateTime(run.created_at)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 md:grid-cols-3">
                      <Fact label="Route" value={run.route ? formatLabel(run.route) : "-"} />
                      <Fact
                        label="Risco"
                        value={run.risk_level ? formatLabel(run.risk_level) : "-"}
                      />
                      <Fact
                        label="Acao sugerida"
                        value={
                          run.recommended_action
                            ? formatLabel(run.recommended_action)
                            : "-"
                        }
                      />
                    </dl>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Steps
                      </p>
                      {stepsByRunId[run.id]?.length ? (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
                            <thead>
                              <tr className="text-left text-[var(--muted-foreground)]">
                                <th className="px-3 py-2 font-medium">Node</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2 font-medium">Duracao</th>
                                <th className="px-3 py-2 font-medium">Modelo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {stepsByRunId[run.id].map((step) => (
                                <tr key={step.id}>
                                  <td className="px-3 py-3">{step.node_name}</td>
                                  <td className="px-3 py-3">{formatLabel(step.status)}</td>
                                  <td className="px-3 py-3">
                                    {step.duration_ms ? `${step.duration_ms} ms` : "-"}
                                  </td>
                                  <td className="px-3 py-3">{step.model ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                          Nenhuma etapa registrada ainda.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Decisoes humanas</CardTitle>
              <CardDescription>
                Esta etapa ainda nao cria acoes de aprovacao ou remocao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {decisions.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma decisao humana registrada ainda.
                </p>
              ) : (
                decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  >
                    <dl className="grid gap-3 md:grid-cols-2">
                      <Fact
                        label="Decisao humana"
                        value={formatLabel(decision.human_decision)}
                      />
                      <Fact
                        label="Recomendacao da IA"
                        value={
                          decision.ai_recommendation
                            ? formatLabel(decision.ai_recommendation)
                            : "-"
                        }
                      />
                      <Fact
                        label="Categoria humana"
                        value={
                          decision.human_category
                            ? formatLabel(decision.human_category)
                            : "-"
                        }
                      />
                      <Fact
                        label="Risco humano"
                        value={
                          decision.human_risk_level
                            ? formatLabel(decision.human_risk_level)
                            : "-"
                        }
                      />
                      <Fact
                        label="IA correta"
                        value={
                          decision.was_ai_correct === null
                            ? "-"
                            : decision.was_ai_correct
                              ? "Sim"
                              : "Nao"
                        }
                      />
                      <Fact label="Decidido em" value={formatDateTime(decision.decided_at)} />
                    </dl>

                    {decision.moderator_note ? (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[var(--muted-foreground)]">
                          Nota do moderador
                        </p>
                        <p className="mt-2 text-sm leading-7">{decision.moderator_note}</p>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminPageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-[var(--muted-foreground)]">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
