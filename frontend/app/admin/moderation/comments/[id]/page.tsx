"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, FileClock, MessageSquare, UserCheck } from "lucide-react";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminModerationNav } from "@/components/moderation/admin-moderation-nav";
import { HumanReviewForm } from "@/components/moderation/human-review-form";
import { StatusBadge } from "@/components/moderation/status-badge";
import { ValueBadge } from "@/components/moderation/value-badge";
import { Alert } from "@/components/ui/alert";
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

const STEP_DESCRIPTIONS: Record<string, string> = {
  input_guard: "Valida se o comentario tem conteudo minimo e pode seguir para analise.",
  intent_router: "Define a rota inicial do grafo.",
  spam_fast_path: "Aplica caminho rapido para spam evidente.",
  toxic_fast_path: "Aplica caminho rapido para ofensa evidente.",
  low_risk_path: "Classifica comentarios de baixo risco.",
  ambiguous_deep_review: "Mantem casos ambiguos em revisao conservadora.",
  fallback_human_review: "Encaminha para decisao humana quando nao ha rota segura.",
  guideline_retriever: "Relaciona o comentario com regras da comunidade.",
  risk_analyzer: "Consolida categoria, risco e acao recomendada.",
  confidence_gate: "Decide se o critic agent deve revisar a recomendacao.",
  critic_agent: "Reavalia proporcionalidade e risco de falso positivo.",
  decision_builder: "Monta a recomendacao final da analise.",
};

export default function CommentDetailPage() {
  return (
    <AdminPageShell
      title="Revisao de comentario"
      description="Revise o comentario, consulte a recomendacao da IA e registre a decisao humana final."
    >
      <CommentDetailContent />
    </AdminPageShell>
  );
}

function CommentDetailContent() {
  const params = useParams<{ id: string }>();
  const commentId = typeof params.id === "string" ? params.id : "";
  const [comment, setComment] = useState<ModerationComment | null>(null);
  const [runs, setRuns] = useState<ModerationRun[]>([]);
  const [decisions, setDecisions] = useState<ModerationDecision[]>([]);
  const [latestRunSteps, setLatestRunSteps] = useState<ModerationStep[]>([]);
  const [latestDetailedRun, setLatestDetailedRun] = useState<ModerationRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState("");
  const [analysisSuccessMessage, setAnalysisSuccessMessage] = useState("");

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

    if (!nextLatestRun) {
      setLatestDetailedRun(null);
      return;
    }

    setLatestDetailedRun((currentRun) =>
      currentRun && currentRun.id === nextLatestRun.id ? currentRun : null,
    );
  }, [commentId]);

  const latestRunSummary = runs[0] ?? null;
  const latestRun =
    latestDetailedRun && latestRunSummary && latestDetailedRun.id === latestRunSummary.id
      ? { ...latestRunSummary, ...latestDetailedRun }
      : latestRunSummary;
  const previousRuns = runs.slice(1);
  const sortedDecisions = [...decisions].sort(
    (left, right) =>
      new Date(right.decided_at).getTime() - new Date(left.decided_at).getTime(),
  );
  const latestDecision = sortedDecisions[0] ?? null;
  const comparison = getRecommendationComparison(
    latestRun?.recommended_action ?? null,
    latestDecision?.human_decision ?? null,
  );

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
      setAnalysisSuccessMessage("");

      const analyzedRun = await analyzeModerationComment(commentId);
      setLatestDetailedRun(analyzedRun);
      await loadData();
      setAnalysisSuccessMessage(
        "Analise concluida. Revise a recomendacao antes de registrar a decisao humana.",
      );
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
    <div className="grid gap-6">
      <AdminModerationNav auditHref="#audit" />

      <Link
        href="/admin/moderation"
        className="text-sm font-medium text-[var(--accent-secondary)] transition hover:opacity-80"
      >
        Voltar para a fila
      </Link>

      {isLoading ? (
        <StatePanel title="Carregando comentario" description="Buscando comentario, runs e decisoes." />
      ) : null}

      {!isLoading && errorMessage ? (
        <StatePanel title="Erro ao carregar" description={errorMessage} tone="danger" />
      ) : null}

      {!isLoading && !errorMessage && comment ? (
        <>
          <OriginalCommentCard comment={comment} />

          <AiRecommendationCard
            latestRun={latestRun}
            isAnalyzing={isAnalyzing}
            analysisErrorMessage={analysisErrorMessage}
            analysisSuccessMessage={analysisSuccessMessage}
            onAnalyze={handleAnalyze}
          />

          <HumanDecisionCard
            commentId={commentId}
            latestRun={latestRun}
            latestDecision={latestDecision}
            comparison={comparison}
            onSaved={loadData}
          />

          <AuditCard
            comment={comment}
            latestRun={latestRun}
            previousRuns={previousRuns}
            latestRunSteps={latestRunSteps}
            decisions={sortedDecisions}
          />
        </>
      ) : null}
    </div>
  );
}

function OriginalCommentCard({ comment }: { comment: ModerationComment }) {
  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--accent-secondary)]" />
              Comentario original
            </CardTitle>
            <CardDescription>
              {comment.course_name ?? "Curso nao informado"} / {comment.lesson_name ?? "Aula nao informada"}
            </CardDescription>
          </div>
          <StatusBadge status={comment.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-1">
          <p className="text-sm font-medium">{comment.author_name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Criado em {formatDateTime(comment.created_at)}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AiRecommendationCard({
  latestRun,
  isAnalyzing,
  analysisErrorMessage,
  analysisSuccessMessage,
  onAnalyze,
}: {
  latestRun: ModerationRun | null;
  isAnalyzing: boolean;
  analysisErrorMessage: string;
  analysisSuccessMessage: string;
  onAnalyze: () => void;
}) {
  const policyReferences = latestRun?.policy_references ?? [];

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--accent-secondary)]" />
              Analise e recomendacao da IA
            </CardTitle>
            <CardDescription>
              A recomendacao ajuda a priorizar a revisao. Ela nao decide pelo moderador.
            </CardDescription>
          </div>
          <Button type="button" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Executando analise..." : "Executar analise"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-7 text-[var(--muted-foreground)]">
          A IA recomenda. O moderador decide.
        </div>

        {analysisErrorMessage ? (
          <Alert className="border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]">
            {analysisErrorMessage}
          </Alert>
        ) : null}

        {analysisSuccessMessage ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            {analysisSuccessMessage}
          </Alert>
        ) : null}

        {latestRun === null ? (
          <StatePanel
            title="Sem analise"
            description="Execute a analise para ver categoria sugerida, risco, acao recomendada e regras relacionadas."
          />
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Fact label="Status" value={<StatusBadge status={latestRun.status} />} />
              <Fact label="Rota" value={latestRun.route ?? "-"} />
              <Fact
                label="Acao recomendada"
                value={
                  latestRun.recommended_action ? (
                    <ValueBadge
                      value={latestRun.recommended_action}
                      label={formatLabel(latestRun.recommended_action)}
                    />
                  ) : (
                    "-"
                  )
                }
              />
              <Fact
                label="Risco"
                value={
                  latestRun.risk_level ? (
                    <ValueBadge
                      value={latestRun.risk_level}
                      label={formatLabel(latestRun.risk_level)}
                    />
                  ) : (
                    "-"
                  )
                }
              />
              <Fact label="Categoria" value={latestRun.category ? formatLabel(latestRun.category) : "-"} />
              <Fact
                label="Confianca"
                value={latestRun.confidence === null ? "-" : latestRun.confidence.toFixed(2)}
              />
              <Fact label="Critic agent" value={latestRun.critic_applied ? "Aplicado" : "Nao aplicado"} />
              <Fact
                label="Revisao humana"
                value={latestRun.requires_human_review ? "Obrigatoria" : "Nao sinalizada"}
              />
              <Fact label="Criado em" value={formatDateTime(latestRun.created_at)} />
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Justificativa</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                {latestRun.ai_justification ?? "Sem justificativa registrada."}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Regras relacionadas</p>
              {policyReferences.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Nenhuma regra relacionada encontrada.
                </p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {policyReferences.map((reference) => (
                    <div
                      key={`${latestRun.id}-${reference.code}`}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{reference.code}</span> / {reference.title} /{" "}
                      {formatLabel(reference.severity)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HumanDecisionCard({
  commentId,
  latestRun,
  latestDecision,
  comparison,
  onSaved,
}: {
  commentId: string;
  latestRun: ModerationRun | null;
  latestDecision: ModerationDecision | null;
  comparison: RecommendationComparison;
  onSaved: () => Promise<void>;
}) {
  const policyReferences = latestRun?.policy_references ?? [];
  const recommendationSummary = getOperationalRecommendationSummary(latestRun);

  return (
    <Card className="border-[var(--accent-border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[var(--accent-secondary)]" />
          Decisao humana
        </CardTitle>
        <CardDescription>
          A decisao final pertence ao moderador e fica registrada para auditoria.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4">
          <p className="text-sm font-semibold">Decisao recomendada</p>
          <p className="mt-2 text-sm leading-7">{recommendationSummary}</p>

          <dl className="mt-4 grid gap-3 md:grid-cols-3">
            <Fact
              label="Acao recomendada"
              value={
                latestRun?.recommended_action ? (
                  <ValueBadge
                    value={latestRun.recommended_action}
                    label={formatLabel(latestRun.recommended_action)}
                  />
                ) : (
                  "Sem analise"
                )
              }
            />
            <Fact
              label="Categoria sugerida"
              value={latestRun?.category ? formatLabel(latestRun.category) : "Sem analise"}
            />
            <Fact
              label="Nivel de risco"
              value={
                latestRun?.risk_level ? (
                  <ValueBadge
                    value={latestRun.risk_level}
                    label={formatLabel(latestRun.risk_level)}
                  />
                ) : (
                  "Sem analise"
                )
              }
            />
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Regras relacionadas</p>
            {policyReferences.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Nenhuma regra relacionada disponivel para esta recomendacao.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {policyReferences.map((reference) => (
                  <ValueBadge
                    key={`${latestRun?.id}-${reference.code}`}
                    value={reference.severity}
                    label={`${reference.code} / ${reference.title}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Recomendacao da IA</p>
            <p className="mt-2 text-sm">
              {latestRun?.recommended_action ? formatLabel(latestRun.recommended_action) : "Sem analise"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Decisao humana final</p>
            <p className="mt-2 text-sm">
              {latestDecision?.human_decision ? formatLabel(latestDecision.human_decision) : "Pendente"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Comparacao</p>
            <div className="mt-2">
              <ValueBadge value={comparison.key} label={comparison.label} />
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              {comparison.description}
            </p>
          </div>
        </div>

        {comparison.key === "divergence" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            <p className="font-medium">Divergencia registrada como evidencia de revisao humana.</p>
            <p className="mt-1">
              IA recomendou:{" "}
              <span className="font-semibold">
                {latestRun?.recommended_action ? formatLabel(latestRun.recommended_action) : "-"}
              </span>
              . Moderador decidiu:{" "}
              <span className="font-semibold">
                {latestDecision?.human_decision ? formatLabel(latestDecision.human_decision) : "-"}
              </span>
              .
            </p>
          </div>
        ) : null}

        {latestDecision ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Ultima decisao registrada</p>
            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              <Fact label="Decisao" value={formatLabel(latestDecision.human_decision)} />
              <Fact
                label="Categoria final"
                value={latestDecision.human_category ? formatLabel(latestDecision.human_category) : "-"}
              />
              <Fact
                label="Risco final"
                value={latestDecision.human_risk_level ? formatLabel(latestDecision.human_risk_level) : "-"}
              />
              <Fact label="Decidido em" value={formatDateTime(latestDecision.decided_at)} />
            </dl>

            {latestDecision.moderator_note ? (
              <TextBlock label="Nota do moderador" value={latestDecision.moderator_note} />
            ) : null}

            {latestDecision.final_content ? (
              <TextBlock label="Conteudo final editado" value={latestDecision.final_content} />
            ) : null}
          </div>
        ) : (
          <StatePanel
            title="Sem decisao humana"
            description="Registre a decisao final depois de revisar o comentario e a recomendacao."
          />
        )}

        <HumanReviewForm commentId={commentId} onSaved={onSaved} />
      </CardContent>
    </Card>
  );
}

function AuditCard({
  comment,
  latestRun,
  previousRuns,
  latestRunSteps,
  decisions,
}: {
  comment: ModerationComment;
  latestRun: ModerationRun | null;
  previousRuns: ModerationRun[];
  latestRunSteps: ModerationStep[];
  decisions: ModerationDecision[];
}) {
  return (
    <Card id="audit" className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileClock className="h-5 w-5 text-[var(--accent-secondary)]" />
          Auditoria e historico
        </CardTitle>
        <CardDescription>
          Dados tecnicos ficam acessiveis sem competir com a decisao operacional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AuditSection title="Ultimo run e metadata" defaultOpen={false}>
          {latestRun ? (
            <div className="grid gap-4">
              <dl className="grid gap-3 md:grid-cols-3">
                <Fact label="Run" value={latestRun.id} />
                <Fact label="Status" value={latestRun.status} />
                <Fact label="Rota" value={latestRun.route ?? "-"} />
                <Fact label="Atualizado em" value={formatDateTime(latestRun.updated_at)} />
                <Fact label="Inicio" value={latestRun.started_at ? formatDateTime(latestRun.started_at) : "-"} />
                <Fact label="Fim" value={latestRun.finished_at ? formatDateTime(latestRun.finished_at) : "-"} />
              </dl>
              <CodeBlock value={formatMetadata(latestRun.metadata ?? {})} />
            </div>
          ) : (
            <StatePanel title="Sem run" description="Nenhuma analise foi registrada para este comentario." />
          )}
        </AuditSection>

        <AuditSection title="Steps do grafo" defaultOpen={false}>
          {latestRun === null ? (
            <StatePanel title="Sem steps" description="Execute uma analise para visualizar os steps do grafo." />
          ) : latestRunSteps.length === 0 ? (
            <StatePanel title="Sem steps" description="Nenhum step registrado para esta analise." />
          ) : (
            <div className="grid gap-3">
              {latestRunSteps.map((step) => (
                <details
                  key={step.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{step.node_name}</p>
                      <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                        {STEP_DESCRIPTIONS[step.node_name] ?? "Etapa interna registrada para auditoria."}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {step.duration_ms === null ? "-" : `${step.duration_ms} ms`}
                    </span>
                  </summary>
                  <div className="border-t border-[var(--border)] p-4">
                    <dl className="grid gap-3 md:grid-cols-3">
                      <Fact label="Status" value={step.status} />
                      <Fact label="Criado em" value={formatDateTime(step.created_at)} />
                      <Fact label="Modelo" value={step.model ?? "-"} />
                      <Fact label="Input tokens" value={step.input_tokens === null ? "-" : String(step.input_tokens)} />
                      <Fact label="Output tokens" value={step.output_tokens === null ? "-" : String(step.output_tokens)} />
                      <Fact label="Erro" value={step.error_message ?? "-"} />
                    </dl>
                    <CodeBlock value={formatMetadata(step.metadata)} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </AuditSection>

        <AuditSection title="Runs anteriores" defaultOpen={false}>
          {previousRuns.length === 0 ? (
            <StatePanel title="Sem historico de runs" description="Nenhum run anterior registrado ainda." />
          ) : (
            <div className="grid gap-3">
              {previousRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge status={run.status} />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDateTime(run.created_at)}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-3 md:grid-cols-4">
                    <Fact label="Rota" value={run.route ?? "-"} />
                    <Fact label="Risco" value={run.risk_level ?? "-"} />
                    <Fact label="Acao" value={run.recommended_action ?? "-"} />
                    <Fact label="Critic agent" value={run.critic_applied ? "Sim" : "Nao"} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </AuditSection>

        <AuditSection title="Historico de decisoes" defaultOpen={false}>
          {decisions.length === 0 ? (
            <StatePanel title="Sem historico" description="Nenhuma decisao humana registrada ainda." />
          ) : (
            <div className="grid gap-3">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                >
                  <dl className="grid gap-3 md:grid-cols-3">
                    <Fact label="Decisao" value={formatLabel(decision.human_decision)} />
                    <Fact
                      label="Recomendacao IA"
                      value={decision.ai_recommendation ? formatLabel(decision.ai_recommendation) : "-"}
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
                    <Fact
                      label="Categoria"
                      value={decision.human_category ? formatLabel(decision.human_category) : "-"}
                    />
                    <Fact
                      label="Risco"
                      value={decision.human_risk_level ? formatLabel(decision.human_risk_level) : "-"}
                    />
                    <Fact label="Decidido em" value={formatDateTime(decision.decided_at)} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </AuditSection>

        <AuditSection title="Metadata do comentario" defaultOpen={false}>
          <CodeBlock value={formatMetadata(comment.metadata)} />
        </AuditSection>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-[var(--muted-foreground)]">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{value}</p>
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg bg-[var(--surface)] p-4 text-xs leading-6 text-[var(--foreground)]">
      {value}
    </pre>
  );
}

function AuditSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]"
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
        {title}
      </summary>
      <div className="border-t border-[var(--border)] p-4">{children}</div>
    </details>
  );
}

function StatePanel({
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

type RecommendationComparison = {
  key: "agreement" | "divergence" | "pending" | "not_applicable";
  label: string;
  description: string;
};

function getRecommendationComparison(
  recommendedAction: string | null,
  humanDecision: string | null,
): RecommendationComparison {
  if (!recommendedAction || !humanDecision) {
    return {
      key: "pending",
      label: "Pendente",
      description: "Ainda falta analise, decisao humana ou ambos.",
    };
  }

  if (recommendedAction === "needs_human_review") {
    return {
      key: "not_applicable",
      label: "Nao aplicavel",
      description: "A IA encaminhou para revisao em vez de sugerir uma acao objetiva.",
    };
  }

  if (recommendedAction === humanDecision) {
    return {
      key: "agreement",
      label: "Concordancia",
      description: "A decisao humana confirmou a acao recomendada pela IA.",
    };
  }

  return {
    key: "divergence",
    label: "Divergencia",
    description: "O moderador escolheu uma acao diferente da recomendacao.",
  };
}

function getOperationalRecommendationSummary(latestRun: ModerationRun | null): string {
  if (!latestRun) {
    return "Execute ou consulte uma analise para ver a recomendacao antes da decisao final.";
  }

  if (latestRun.ai_justification?.trim()) {
    return latestRun.ai_justification.trim();
  }

  return "A recomendacao foi gerada com base nas regras relacionadas e na analise de risco.";
}
