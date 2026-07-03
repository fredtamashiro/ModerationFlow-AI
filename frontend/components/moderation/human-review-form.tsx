"use client";

import { FormEvent, type ReactNode, useState } from "react";
import { CircleHelp, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  createHumanDecision,
  type HumanDecision,
  type HumanDecisionPayload,
  type HumanRiskLevel,
} from "@/services/moderationApi";

const decisionOptions = [
  { label: "Aprovar", value: "approve" },
  { label: "Sinalizar", value: "flag" },
  { label: "Remover", value: "remove" },
  { label: "Solicitar edicao", value: "request_edit" },
] as const;

const categoryOptions = [
  { label: "Spam", value: "spam" },
  { label: "Ataque pessoal", value: "personal_attack" },
  { label: "Linguagem ofensiva", value: "offensive_language" },
  { label: "Odio ou discriminacao", value: "hate_or_discrimination" },
  { label: "Conteudo perigoso ou ilegal", value: "dangerous_or_illegal_content" },
  { label: "Critica legitima", value: "legitimate_criticism" },
  { label: "Duvida ou suporte", value: "question_or_support_request" },
  { label: "Feedback positivo", value: "positive_feedback" },
  { label: "Ambiguo", value: "ambiguous" },
  { label: "Outro", value: "other" },
] as const;

const riskOptions = [
  { label: "Baixo", value: "low" },
  { label: "Medio", value: "medium" },
  { label: "Alto", value: "high" },
  { label: "Desconhecido", value: "unknown" },
] as const;

type HumanReviewFormProps = {
  commentId: string;
  onSaved: () => Promise<void>;
};

export function HumanReviewForm({ commentId, onSaved }: HumanReviewFormProps) {
  const [humanDecision, setHumanDecision] = useState<HumanDecision | "">("");
  const [humanCategory, setHumanCategory] = useState("");
  const [humanRiskLevel, setHumanRiskLevel] = useState<HumanRiskLevel | "">("");
  const [moderatorNote, setModeratorNote] = useState("");
  const [finalContent, setFinalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRiskHelpOpen, setIsRiskHelpOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!humanDecision || isSaving) {
      return;
    }

    const payload: HumanDecisionPayload = {
      human_decision: humanDecision,
      human_category: humanCategory || null,
      human_risk_level: humanRiskLevel || null,
      moderator_note: moderatorNote.trim() || null,
      final_content:
        humanDecision === "request_edit" ? finalContent.trim() || null : null,
      metadata: {},
    };

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createHumanDecision(commentId, payload);

      setHumanDecision("");
      setHumanCategory("");
      setHumanRiskLevel("");
      setModeratorNote("");
      setFinalContent("");
      setSuccessMessage("Decisao humana registrada com sucesso.");

      try {
        await onSaved();
      } catch {
        setErrorMessage(
          "A decisao foi salva, mas os dados da tela nao puderam ser atualizados.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel registrar a decisao humana.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Acao final do moderador *</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {decisionOptions.map((option) => {
            const active = humanDecision === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setHumanDecision(option.value)}
                disabled={isSaving}
                aria-pressed={active}
                className={`min-h-12 cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          A IA pode sugerir uma acao, mas esta escolha e a decisao final registrada.
        </p>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Decisao" htmlFor="human-decision" required>
          <Select
            id="human-decision"
            value={humanDecision}
            onChange={(event) =>
              setHumanDecision(event.target.value as HumanDecision | "")
            }
            disabled={isSaving}
            required
          >
            <option value="">Selecione uma decisao</option>
            {decisionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Categoria" htmlFor="human-category">
          <Select
            id="human-category"
            value={humanCategory}
            onChange={(event) => setHumanCategory(event.target.value)}
            disabled={isSaving}
          >
            <option value="">Nao informada</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Nivel de risco"
          htmlFor="human-risk-level"
          action={
            <button
              type="button"
              onClick={() => setIsRiskHelpOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:text-[var(--accent-secondary)]"
              aria-label="Entender como classificar o nivel de risco"
              title="Entender como classificar o nivel de risco"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          }
        >
          <Select
            id="human-risk-level"
            value={humanRiskLevel}
            onChange={(event) =>
              setHumanRiskLevel(event.target.value as HumanRiskLevel | "")
            }
            disabled={isSaving}
          >
            <option value="">Nao informado</option>
            {riskOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Nota do moderador" htmlFor="moderator-note">
        <textarea
          id="moderator-note"
          value={moderatorNote}
          onChange={(event) => setModeratorNote(event.target.value)}
          placeholder="Descreva brevemente o motivo da decisao..."
          disabled={isSaving}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </Field>

      {humanDecision === "request_edit" ? (
        <Field label="Versao sugerida" htmlFor="final-content">
          <textarea
            id="final-content"
            value={finalContent}
            onChange={(event) => setFinalContent(event.target.value)}
            placeholder="Versao sugerida do comentario, se aplicavel..."
            disabled={isSaving}
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </Field>
      ) : null}

      {errorMessage ? (
        <Alert className="border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]">
          {errorMessage}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          {successMessage}
        </Alert>
      ) : null}

      <div>
        <Button type="submit" disabled={!humanDecision || isSaving}>
          {isSaving ? "Salvando..." : "Registrar decisao"}
        </Button>
      </div>

      {isRiskHelpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsRiskHelpOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
              <div>
                <h3 className="text-lg font-semibold">Como classificar o nível de risco</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Use o risco para representar a gravidade prática do comentário no fluxo
                  de moderação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRiskHelpOpen(false)}
                className="rounded-full p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                aria-label="Fechar ajuda de nível de risco"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5 text-sm leading-7">
              <div>
                <p className="font-medium">`low`</p>
                <p className="text-[var(--muted-foreground)]">
                  Use quando o comentário é compreensível e não apresenta risco
                  relevante. Exemplos: elogio, feedback positivo, dúvida educada,
                  crítica legítima sem ofensa.
                </p>
              </div>

              <div>
                <p className="font-medium">`medium`</p>
                <p className="text-[var(--muted-foreground)]">
                  Use quando existe um problema potencial, mas sem gravidade máxima.
                  Exemplos: sarcasmo agressivo, ambiguidade, linguagem inadequada sem
                  ataque direto, caso que pode exigir atenção.
                </p>
              </div>

              <div>
                <p className="font-medium">`high`</p>
                <p className="text-[var(--muted-foreground)]">
                  Use quando há violação séria ou impacto claro. Exemplos: ataque
                  pessoal, discriminação, conteúdo perigoso ou ilegal, spam evidente.
                </p>
              </div>

              <div>
                <p className="font-medium">`unknown`</p>
                <p className="text-[var(--muted-foreground)]">
                  Use quando você não consegue classificar o risco com segurança ou
                  quando o caso está ambíguo demais para uma conclusão firme.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="font-medium">Regra prática</p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  Se o comentário for positivo, elogioso ou claramente seguro, o mais
                  adequado costuma ser `low`, não `unknown`.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required = false,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required ? " *" : ""}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}
