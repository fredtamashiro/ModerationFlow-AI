"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { HumanReviewForm } from "@/components/moderation/human-review-form";
import { StatusBadge } from "@/components/moderation/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatLabel, formatMetadata } from "@/lib/moderation";
import {
  analyzeModerationComment,
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
  const [latestRunSteps, setLatestRunSteps] = useState<ModerationStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    const [nextComment, nextRuns, nextDecisions] = await Promise.all([
      getModerationComment(commentId),
      listCommentRuns(commentId),
      listCommentDecisions(commentId),
    ]);

    const sortedRuns = [...nextRuns].sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
    const nextLatestRun = sortedRuns[0] ?? null;
    const nextSteps = nextLatestRun ? await listRunSteps(nextLatestRun.id) : [];

    setComment(nextComment);
    setRuns(sortedRuns);
    setDecisions(nextDecisions);
    setLatestRunSteps(nextSteps);
  }, [commentId]);

  const latestRun = runs[0] ?? null;

  useEffect(() => {
    if (!commentId) {
      return;
    }

    let isMounted = true;

    async function loadPageData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        await loadData();

        if (!isMounted) {
          return;
        }
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

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, [commentId, loadData]);

  async function handleAnalyze() {
    if (!commentId || isAnalyzing) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisErrorMessage("");

      await analyzeModerationComment(commentId);
      await loadData();
    } catch (error) {
      setAnalysisErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel executar a analise de moderacao.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <AdminPageShell
      title="Detalhe do comentario"
      description="Execute a analise do grafo, revise a recomendacao e registre a decisao humana."
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

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                  A analise abaixo e uma recomendacao inicial do grafo. A decisao
                  final deve ser registrada pelo moderador na secao de revisao
                  humana.
                </p>
              </div>

              {analysisErrorMessage ? (
                <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                  {analysisErrorMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Executando analise..." : "Executar analise"}
                </Button>
                <span className="text-sm text-[var(--muted-foreground)]">
                  A chamada usa `POST /admin/moderation/comments/{commentId}/analyze`.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Ultimo run de moderacao</CardTitle>
              <CardDescription>
                Resumo da analise mais recente produzida pelo grafo para este
                comentario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestRun === null ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhuma analise de IA executada ainda.
                </p>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={latestRun.status} />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Run {latestRun.id}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 md:grid-cols-3">
                    <Fact label="Status" value={latestRun.status} />
                    <Fact label="Rota" value={latestRun.route ?? "-"} />
                    <Fact label="Risco" value={latestRun.risk_level ?? "-"} />
                    <Fact label="Categoria" value={latestRun.category ?? "-"} />
                    <Fact
                      label="Confianca"
                      value={
                        latestRun.confidence === null
                          ? "-"
                          : latestRun.confidence.toFixed(2)
                      }
                    />
                    <Fact
                      label="Acao recomendada"
                      value={latestRun.recommended_action ?? "-"}
                    />
                    <Fact
                      label="Critic agent aplicado"
                      value={latestRun.critic_applied ? "Sim" : "Nao"}
                    />
                    <Fact
                      label="Revisao humana obrigatoria"
                      value={latestRun.requires_human_review ? "Sim" : "Nao"}
                    />
                    <Fact
                      label="Criado em"
                      value={formatDateTime(latestRun.created_at)}
                    />
                    <Fact
                      label="Atualizado em"
                      value={formatDateTime(latestRun.updated_at)}
                    />
                  </dl>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">
                      Justificativa da analise
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                      {latestRun.ai_justification ?? "-"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">
                      Policy references
                    </p>
                    {latestRun.policy_references.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        Nenhuma diretriz relacionada encontrada.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm">
                        {latestRun.policy_references.map((reference) => (
                          <li
                            key={`${latestRun.id}-${reference.code}`}
                            className="rounded-lg border border-[var(--border)] px-3 py-2"
                          >
                            <span className="font-medium">{reference.code}</span> -{" "}
                            {reference.title} - {reference.severity}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-[var(--muted-foreground)]">
                      Metadata do run
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface)] p-4 text-xs leading-6 text-[var(--foreground)]">
                      {formatMetadata(latestRun.metadata)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Steps do grafo</CardTitle>
              <CardDescription>
                Etapas registradas para o ultimo run de moderacao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestRun === null ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Execute uma analise para visualizar os steps do grafo.
                </p>
              ) : latestRunSteps.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhum step registrado para esta analise.
                </p>
              ) : (
                latestRunSteps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  >
                    <dl className="grid gap-3 md:grid-cols-3">
                      <Fact label="Node" value={step.node_name} />
                      <Fact label="Status" value={step.status} />
                      <Fact
                        label="Duracao"
                        value={
                          step.duration_ms === null ? "-" : `${step.duration_ms} ms`
                        }
                      />
                      <Fact
                        label="Criado em"
                        value={formatDateTime(step.created_at)}
                      />
                      <Fact label="Modelo" value={step.model ?? "-"} />
                      <Fact label="Erro" value={step.error_message ?? "-"} />
                    </dl>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">
                        Metadata
                      </p>
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface)] p-4 text-xs leading-6 text-[var(--foreground)]">
                        {formatMetadata(step.metadata)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Revisao humana</CardTitle>
              <CardDescription>
                Registre a decisao final do moderador para este comentario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HumanReviewForm commentId={commentId} onSaved={loadData} />
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardHeader>
              <CardTitle>Decisoes humanas</CardTitle>
              <CardDescription>
                Historico das decisoes registradas por moderadores.
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
                            ? "Nao aplicavel"
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
