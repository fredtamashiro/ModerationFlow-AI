import { ChatResponse } from "@/services/api";

export const CHAT_HISTORY_STORAGE_KEY = "smartdocs:chat-history:v1";
export const CHAT_HISTORY_LIMIT = 10;

export type ChatHistoryEntry = ChatResponse & {
  id: string;
  created_at: string;
};

export type ChatHistoryByDocument = Record<string, ChatHistoryEntry[]>;

export function loadChatHistory(): ChatHistoryByDocument {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as ChatHistoryByDocument;
  } catch {
    return {};
  }
}

export function saveChatHistory(history: ChatHistoryByDocument): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CHAT_HISTORY_STORAGE_KEY,
    JSON.stringify(history),
  );
}

export function appendChatHistoryEntry(
  history: ChatHistoryByDocument,
  documentId: string,
  entry: ChatHistoryEntry,
): ChatHistoryByDocument {
  const currentEntries = history[documentId] ?? [];
  const nextEntries = [entry, ...currentEntries].slice(0, CHAT_HISTORY_LIMIT);

  return {
    ...history,
    [documentId]: nextEntries,
  };
}
