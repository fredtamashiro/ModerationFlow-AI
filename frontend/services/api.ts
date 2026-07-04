const configuredBrowserApiUrl = process.env.NEXT_PUBLIC_API_URL;
const serverApiUrl = process.env.INTERNAL_API_URL ?? configuredBrowserApiUrl;

function resolveBrowserApiUrl(): string | undefined {
  if (!configuredBrowserApiUrl || typeof window === "undefined") {
    return configuredBrowserApiUrl;
  }

  const pageHost = window.location.hostname;
  const isLocalPageHost = pageHost === "localhost" || pageHost === "127.0.0.1";

  if (!isLocalPageHost) {
    return configuredBrowserApiUrl;
  }

  try {
    const apiUrl = new URL(configuredBrowserApiUrl);
    const isLocalApiHost = apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1";

    if (isLocalApiHost && apiUrl.hostname !== pageHost) {
      apiUrl.hostname = pageHost;
      return apiUrl.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredBrowserApiUrl;
  }

  return configuredBrowserApiUrl;
}

export function getApiBaseUrl(): string | undefined {
  return typeof window === "undefined" ? serverApiUrl : resolveBrowserApiUrl();
}

export const API_URL = getApiBaseUrl();

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function createApiUrl(path: string): string {
  const apiUrl = getApiBaseUrl();

  if (!apiUrl) {
    throw new Error(
      "API URL is not configured. Set NEXT_PUBLIC_API_URL for browser requests and INTERNAL_API_URL for server requests.",
    );
  }

  return `${apiUrl}${path}`;
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

function getAdminRequestInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: "include",
  };
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export async function loginAdmin({
  email,
  password,
}: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(
    createApiUrl("/auth/login"),
    getAdminRequestInit({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }),
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao fazer login."));
  }

  return response.json();
}

export async function getCurrentAdmin(): Promise<AuthUser> {
  const response = await fetch(
    createApiUrl("/auth/me"),
    getAdminRequestInit({
      cache: "no-store",
    }),
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Sessao administrativa invalida."));
  }

  return response.json();
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(
    createApiUrl("/auth/logout"),
    getAdminRequestInit({
      method: "POST",
    }),
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao encerrar sessao."));
  }
}

export type UsageLog = {
  id: string;
  project: string;
  event_type: string;
  ip_address: string | null;
  user_id: string | null;
  document_id: string | null;
  metadata: Record<string, JsonValue>;
  created_at: string;
};

export type UsageLogsResponse = {
  total: number;
  logs: UsageLog[];
};

export async function getUsageLogs(limit = 50): Promise<UsageLogsResponse> {
  const response = await fetch(
    createApiUrl(`/usage-logs?limit=${limit}`),
    getAdminRequestInit({
      cache: "no-store",
    }),
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao buscar logs de uso."));
  }

  return response.json();
}
