export type DemoModerationStep = {
  nodeName: string;
  status: "completed" | "skipped";
  durationMs: number;
  summary: string;
};

export type DemoModerationComment = {
  id: string;
  seedCase: "ambiguous_sarcasm" | "clear_spam" | "potentially_discriminatory";
  scenarioTitle: string;
  scenarioSummary: string;
  authorName: string;
  courseName: string;
  lessonName: string;
  content: string;
  status: "waiting_human_review" | "removed" | "approved" | "edit_requested";
  createdAt: string;
  aiRecommendation: {
    route: string;
    recommendedAction: "approve" | "flag" | "remove" | "request_edit";
    riskLevel: "low" | "medium" | "high";
    category: string;
    confidence: number;
    policyReferences: string[];
    criticApplied: boolean;
    requiresHumanReview: boolean;
    justification: string;
  };
  humanDecision: {
    decision: "approve" | "flag" | "remove" | "request_edit";
    category: string;
    riskLevel: "low" | "medium" | "high";
    moderatorNote: string;
    wasAiCorrect: boolean;
    decidedAt: string;
    finalContent?: string;
  };
  auditSteps: DemoModerationStep[];
};

export const publicDemoComments: DemoModerationComment[] = [
  {
    id: "ambiguous-sarcasm",
    seedCase: "ambiguous_sarcasm",
    scenarioTitle: "Crítica ambígua",
    scenarioSummary: "Comentário negativo com sarcasmo, mas sem violação óbvia.",
    authorName: "Aluno Demo",
    courseName: "Fundamentos de Python",
    lessonName: "Funções e escopo",
    content:
      "Parabéns, essa foi a explicação mais confusa do curso inteiro. Acho que vou aprender melhor procurando por conta própria.",
    status: "approved",
    createdAt: "2026-06-20T14:10:00.000Z",
    aiRecommendation: {
      route: "ambiguous_deep_review",
      recommendedAction: "flag",
      riskLevel: "medium",
      category: "legitimate_criticism",
      confidence: 0.72,
      policyReferences: ["R-006", "R-003"],
      criticApplied: true,
      requiresHumanReview: true,
      justification:
        "O comentário usa sarcasmo e tom depreciativo, mas critica a clareza do conteúdo sem ataque direto a uma pessoa.",
    },
    humanDecision: {
      decision: "approve",
      category: "legitimate_criticism",
      riskLevel: "low",
      moderatorNote:
        "Crítica forte, mas relacionada à experiência no curso. Não há ofensa direta nem violação clara.",
      wasAiCorrect: false,
      decidedAt: "2026-06-20T14:18:00.000Z",
    },
    auditSteps: [
      {
        nodeName: "intent_router",
        status: "completed",
        durationMs: 12,
        summary: "Classificou o comentário como ambíguo por conter crítica sarcástica.",
      },
      {
        nodeName: "guideline_retriever",
        status: "completed",
        durationMs: 18,
        summary: "Relacionou regras sobre crítica legítima e linguagem ofensiva.",
      },
      {
        nodeName: "critic_agent",
        status: "completed",
        durationMs: 41,
        summary: "Recomendou cautela para evitar remoção indevida de crítica legítima.",
      },
    ],
  },
  {
    id: "clear-spam",
    seedCase: "clear_spam",
    scenarioTitle: "Spam explícito",
    scenarioSummary: "Comentário promocional tentando redirecionar alunos para canal externo.",
    authorName: "Perfil Demo",
    courseName: "JavaScript para Web",
    lessonName: "Eventos no DOM",
    content:
      "Esse conteúdo é fraco. Quem quiser aprender de verdade entra no meu grupo e pega o curso completo com desconto no meu perfil.",
    status: "removed",
    createdAt: "2026-06-21T09:35:00.000Z",
    aiRecommendation: {
      route: "spam_fast_path",
      recommendedAction: "remove",
      riskLevel: "high",
      category: "spam",
      confidence: 0.91,
      policyReferences: ["R-001"],
      criticApplied: false,
      requiresHumanReview: true,
      justification:
        "O comentário promove grupo externo e oferta comercial, desviando a discussão do curso.",
    },
    humanDecision: {
      decision: "remove",
      category: "spam",
      riskLevel: "high",
      moderatorNote:
        "Removido por autopromoção e tentativa explícita de levar alunos para canal externo.",
      wasAiCorrect: true,
      decidedAt: "2026-06-21T09:42:00.000Z",
    },
    auditSteps: [
      {
        nodeName: "intent_router",
        status: "completed",
        durationMs: 9,
        summary: "Detectou sinais fortes de spam e redirecionamento externo.",
      },
      {
        nodeName: "spam_fast_path",
        status: "completed",
        durationMs: 7,
        summary: "Aplicou caminho rápido para spam evidente com referência R-001.",
      },
      {
        nodeName: "decision_builder",
        status: "completed",
        durationMs: 10,
        summary: "Gerou recomendação de remoção antes da decisão humana.",
      },
    ],
  },
  {
    id: "potentially-discriminatory",
    seedCase: "potentially_discriminatory",
    scenarioTitle: "Conteúdo discriminatório",
    scenarioSummary: "Comentário sensível envolvendo generalização contra grupo protegido.",
    authorName: "Conta Demo",
    courseName: "Comunicação Profissional",
    lessonName: "Feedback em equipes",
    content:
      "Esse tipo de aluno nunca deveria estar nessa turma. Pessoas desse grupo só atrapalham e baixam o nível da discussão.",
    status: "removed",
    createdAt: "2026-06-22T17:05:00.000Z",
    aiRecommendation: {
      route: "toxic_fast_path",
      recommendedAction: "remove",
      riskLevel: "high",
      category: "hate_or_discrimination",
      confidence: 0.88,
      policyReferences: ["R-004", "R-002"],
      criticApplied: true,
      requiresHumanReview: true,
      justification:
        "O comentário faz generalização negativa e exclusão de um grupo, exigindo revisão humana cuidadosa.",
    },
    humanDecision: {
      decision: "remove",
      category: "hate_or_discrimination",
      riskLevel: "high",
      moderatorNote:
        "Remoção confirmada por discriminação e hostilidade direcionada a grupo protegido.",
      wasAiCorrect: true,
      decidedAt: "2026-06-22T17:16:00.000Z",
    },
    auditSteps: [
      {
        nodeName: "intent_router",
        status: "completed",
        durationMs: 11,
        summary: "Detectou toxicidade com potencial violação de R-004.",
      },
      {
        nodeName: "guideline_retriever",
        status: "completed",
        durationMs: 20,
        summary: "Relacionou regras de discriminação e ataque pessoal.",
      },
      {
        nodeName: "critic_agent",
        status: "completed",
        durationMs: 46,
        summary: "Reforçou a necessidade de revisão humana antes da remoção final.",
      },
    ],
  },
];

export function getPublicDemoComment(id: string): DemoModerationComment | null {
  return publicDemoComments.find((comment) => comment.id === id) ?? null;
}

