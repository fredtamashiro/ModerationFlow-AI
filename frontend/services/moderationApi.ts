import { getApiBaseUrl } from "@/services/api";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ModerationComment = {
  id: string;
  author_name: string;
  course_name: string | null;
  lesson_name: string | null;
  content: string;
  status: string;
  metadata: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
};

export type ModerationGuideline = {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  examples: JsonValue[];
  metadata: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
};

export type ModerationRun = {
  id: string;
  comment_id: string;
  status: string;
  route: string | null;
  risk_level: string | null;
  category: string | null;
  confidence: number | null;
  recommended_action: string | null;
  ai_justification?: string | null;
  critic_applied: boolean;
  requires_human_review: boolean;
  policy_references?: PolicyReference[];
  metadata?: Record<string, JsonValue>;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyReference = {
  code: string;
  title: string;
  severity: string;
};

export type ModerationStep = {
  id: string;
  run_id: string;
  node_name: string;
  status: string;
  duration_ms: number | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  metadata: Record<string, JsonValue>;
  error_message: string | null;
  created_at: string;
};

export type ModerationDecision = {
  id: string;
  comment_id: string;
  run_id: string | null;
  ai_recommendation: string | null;
  human_decision: string;
  human_category: string | null;
  human_risk_level: string | null;
  moderator_note: string | null;
  final_content: string | null;
  was_ai_correct: boolean | null;
  metadata: Record<string, JsonValue>;
  decided_at: string;
  created_at: string;
};

export type HumanDecision = "approve" | "flag" | "remove" | "request_edit";

export type HumanRiskLevel = "low" | "medium" | "high" | "unknown";

export type HumanDecisionPayload = {
  human_decision: HumanDecision;
  human_category: string | null;
  human_risk_level: HumanRiskLevel | null;
  moderator_note: string | null;
  final_content: string | null;
  metadata: Record<string, JsonValue>;
};

export type PaginatedModerationComments = {
  items: ModerationComment[];
  total: number;
  limit: number;
  offset: number;
};

export type PaginatedModerationGuidelines = {
  items: ModerationGuideline[];
  total: number;
  limit: number;
  offset: number;
};

type ListCommentsParams = {
  status?: string;
  limit?: number;
  offset?: number;
};

type ListGuidelinesParams = {
  severity?: string;
  limit?: number;
  offset?: number;
};

function createApiUrl(path: string): string {
  const apiUrl = getApiBaseUrl();

  if (!apiUrl) {
    throw new Error(
      "API URL is not configured. Set NEXT_PUBLIC_API_URL for browser requests and INTERNAL_API_URL for server requests.",
    );
  }

  return `${apiUrl}${path}`;
}

function createSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = await response.json();
    const detail = payload?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (typeof detail?.message === "string") {
      return detail.message;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

async function authenticatedFetch<T>(
  path: string,
  fallbackMessage: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackMessage));
  }

  return response.json() as Promise<T>;
}

export async function listModerationComments(
  params: ListCommentsParams = {},
): Promise<PaginatedModerationComments> {
  const query = createSearchParams({
    status: params.status,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  return authenticatedFetch(
    `/admin/moderation/comments${query}`,
    "Erro ao buscar comentarios de moderacao.",
  );
}

export async function getModerationComment(
  id: string,
): Promise<ModerationComment> {
  return authenticatedFetch(
    `/admin/moderation/comments/${id}`,
    "Erro ao buscar comentario de moderacao.",
  );
}

export async function listModerationGuidelines(
  params: ListGuidelinesParams = {},
): Promise<PaginatedModerationGuidelines> {
  const query = createSearchParams({
    severity: params.severity,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });

  return authenticatedFetch(
    `/admin/moderation/guidelines${query}`,
    "Erro ao buscar diretrizes de moderacao.",
  );
}

export async function getModerationGuideline(
  id: string,
): Promise<ModerationGuideline> {
  return authenticatedFetch(
    `/admin/moderation/guidelines/${id}`,
    "Erro ao buscar diretriz de moderacao.",
  );
}

export async function getModerationGuidelineByCode(
  code: string,
): Promise<ModerationGuideline> {
  return authenticatedFetch(
    `/admin/moderation/guidelines/code/${code}`,
    "Erro ao buscar diretriz de moderacao pelo codigo.",
  );
}

export async function listCommentRuns(
  commentId: string,
): Promise<ModerationRun[]> {
  return authenticatedFetch(
    `/admin/moderation/comments/${commentId}/runs`,
    "Erro ao buscar execucoes de moderacao.",
  );
}

export async function listRunSteps(runId: string): Promise<ModerationStep[]> {
  return authenticatedFetch(
    `/admin/moderation/runs/${runId}/steps`,
    "Erro ao buscar etapas da execucao.",
  );
}

export async function listCommentDecisions(
  commentId: string,
): Promise<ModerationDecision[]> {
  return authenticatedFetch(
    `/admin/moderation/comments/${commentId}/decisions`,
    "Erro ao buscar decisoes de moderacao.",
  );
}

export async function createHumanDecision(
  commentId: string,
  payload: HumanDecisionPayload,
): Promise<ModerationDecision> {
  return authenticatedFetch(
    `/admin/moderation/comments/${commentId}/decisions`,
    "Erro ao registrar decisao humana.",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function analyzeModerationComment(
  commentId: string,
): Promise<ModerationRun> {
  return authenticatedFetch(
    `/admin/moderation/comments/${commentId}/analyze`,
    "Erro ao executar a analise de moderacao.",
    {
      method: "POST",
    },
  );
}
