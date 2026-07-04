export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const labelMap: Record<string, string> = {
  ambiguous: "Ambíguo",
  approve: "Aprovar",
  approved: "Aprovado",
  dangerous_or_illegal_content: "Conteúdo perigoso ou ilegal",
  edit_requested: "Edição solicitada",
  failed: "Falhou",
  flag: "Sinalizar",
  hate_or_discrimination: "Ódio ou discriminação",
  high: "Alto",
  legitimate_criticism: "Crítica legítima",
  low: "Baixo",
  medium: "Médio",
  needs_human_review: "Precisa de revisão humana",
  offensive_language: "Linguagem ofensiva",
  pending: "Pendente",
  personal_attack: "Ataque pessoal",
  positive_feedback: "Feedback positivo",
  question_or_support_request: "Dúvida ou suporte",
  remove: "Remover",
  removed: "Removido",
  request_edit: "Solicitar edição",
  spam: "Spam",
  waiting_human_review: "Aguardando revisão humana",
};

export function formatLabel(value: string): string {
  const mappedLabel = labelMap[value];

  if (mappedLabel) {
    return mappedLabel;
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMetadata(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
