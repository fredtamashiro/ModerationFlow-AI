"use client";

import { Children, ReactNode, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import { ChatHistoryEntry } from "@/lib/chat-history";
import { normalizeUtf8Text } from "@/lib/text";
import { ChatSource } from "@/services/api";

type AnswerPanelProps = {
  history: ChatHistoryEntry[];
  errorMessage: string;
  expandedItemId: string | null;
  onToggleItem: (itemId: string) => void;
};

function injectSourceLinks(answer: string): string {
  const answerWithoutParenthesizedReferences = answer.replace(
    /\(\s*((?:p\.\s*\d+\s*(?:[,;]|\se\s)?\s*)+)\)/gi,
    "$1",
  );

  const answerWithoutReferenceSeparators = answerWithoutParenthesizedReferences
    .replace(/(p\.\s*\d+)\s*[,;]\s*(?=p\.\s*\d+)/gi, "$1 ")
    .replace(/(p\.\s*\d+)\s+e\s+(?=p\.\s*\d+)/gi, "$1 ");

  return answerWithoutReferenceSeparators.replace(
    /p\.\s*(\d+)/g,
    (_, pageNumber: string) => {
      return `[p. ${pageNumber}](#source-page-${pageNumber})`;
    },
  );
}

function extractTextContent(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") {
        return child;
      }

      if (typeof child === "number") {
        return String(child);
      }

      if (isValidElement(child)) {
        return extractTextContent(child.props.children);
      }

      return "";
    })
    .join("");
}

function stripLeadingText(children: ReactNode, prefix: string): ReactNode {
  let removed = false;

  function visit(node: ReactNode): ReactNode {
    if (removed) {
      return node;
    }

    if (typeof node === "string") {
      const normalizedNode = node.replace(/^\s+/, "");

      if (normalizedNode.startsWith(prefix)) {
        removed = true;
        return normalizedNode.slice(prefix.length).replace(/^\s+/, "");
      }

      return node;
    }

    if (typeof node === "number") {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map(visit);
    }

    if (isValidElement(node)) {
      return {
        ...node,
        props: {
          ...node.props,
          children: visit(node.props.children),
        },
      };
    }

    return node;
  }

  return Children.map(children, visit);
}

type SourceModalProps = {
  page: number;
  sources: ChatSource[];
  onClose: () => void;
};

function SourceModal({ page, sources, onClose }: SourceModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/45 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-[24px] bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="heading-4 text-[#1A1A1A]">Fonte da página {page}</h3>
            <p className="mt-2 text-sm leading-7 text-[#666666]">
              Trechos de referência usados para sustentar a resposta.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#F7F8FA] text-[#1A1A1A] transition hover:bg-[#F0F2F5]"
            aria-label="Fechar modal da fonte"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {sources.map((source, index) => (
            <div
              key={`${source.page}-${source.chunk_index}-${index}`}
              className="rounded-xl bg-[#F7F8FA] p-4"
            >
              <div className="flex flex-wrap gap-3 text-xs text-[#666666]">
                <span>Página: {source.page}</span>
                <span>Chunk: {source.chunk_index}</span>
                <span>Score: {source.score.toFixed(4)}</span>
                {source.relevance_score !== undefined && (
                  <span>Relevância: {source.relevance_score.toFixed(2)}</span>
                )}
              </div>

              {source.matched_query && (
                <p className="mt-3 text-xs leading-5 text-[#2F6F6D]">
                  Query usada: {normalizeUtf8Text(source.matched_query)}
                </p>
              )}

              {source.relevance_reason && (
                <p className="mt-2 text-xs leading-5 text-[#2F6F6D]">
                  Motivo da relevância:{" "}
                  {normalizeUtf8Text(source.relevance_reason)}
                </p>
              )}

              <p className="mt-3 text-sm leading-7 text-[#666666]">
                {normalizeUtf8Text(source.preview)}
              </p>
            </div>
          ))}

          {sources.length === 0 && (
            <div className="rounded-xl bg-[#F7F8FA] p-4 text-sm text-[#666666]">
              Nenhuma fonte foi encontrada para esta página.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type HistoryItemProps = {
  entry: ChatHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
};

function HistoryItem({ entry, isExpanded, onToggle }: HistoryItemProps) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);

  const normalizedAnswer = useMemo(
    () => injectSourceLinks(normalizeUtf8Text(entry.answer)),
    [entry.answer],
  );

  const sourcesForSelectedPage = useMemo(() => {
    if (selectedPage === null) {
      return [];
    }

    return entry.sources.filter((source) => source.page === selectedPage);
  }, [entry.sources, selectedPage]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const headerOffset = 112;
    const itemTop = itemRef.current?.getBoundingClientRect().top;

    if (itemTop === undefined) {
      return;
    }

    window.scrollTo({
      top: window.scrollY + itemTop - headerOffset,
      behavior: "smooth",
    });
  }, [isExpanded]);

  return (
    <>
      <div ref={itemRef} className="rounded-xl bg-[#F7F8FA]">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-[#efffdd]"
        >
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#666666]">
              {new Date(entry.created_at).toLocaleString("pt-BR")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#1A1A1A]">
              <strong className="font-semibold">Pergunta:</strong>{" "}
              {normalizeUtf8Text(entry.question)}
            </p>
          </div>

          <span className="mt-0.5 shrink-0 rounded-md p-1 text-[#666666] transition hover:bg-white hover:text-[#1A1A1A]">
            {isExpanded ? (
              <ChevronUp className="h-8 w-8" />
            ) : (
              <ChevronDown className="h-8 w-8" />
            )}
          </span>
        </button>

        {isExpanded && (
          <div className="border-t border-[#d9dde3] px-4 py-4">
            <div className="text-sm leading-7 text-[#666666]">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-2 mt-4 text-lg font-semibold text-[#1A1A1A]">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-2 mt-4 text-base font-semibold text-[#1A1A1A]">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 text-sm font-semibold text-[#1A1A1A]">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => {
                    const textContent = extractTextContent(children).trimStart();
                    const limitationPrefix = "Limitação:";

                    if (textContent.startsWith(limitationPrefix)) {
                      const contentWithoutPrefix = stripLeadingText(
                        children,
                        limitationPrefix,
                      );

                      return (
                        <div className="mt-6 border-t border-dashed border-[#d9dde3] pt-4">
                          <p className="mb-3 italic last:mb-0">
                            <strong className="font-semibold text-[#1A1A1A]">
                              Limitação:
                            </strong>{" "}
                            {contentWithoutPrefix}
                          </p>
                        </div>
                      );
                    }

                    return <p className="mb-3 last:mb-0">{children}</p>;
                  },
                  ul: ({ children }) => (
                    <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[#1A1A1A]">
                      {children}
                    </strong>
                  ),
                  a: ({ href, children }) => {
                    if (href?.startsWith("#source-page-")) {
                      const page = Number(href.replace("#source-page-", ""));

                      return (
                        <a
                          href={href}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedPage(page);
                          }}
                          className="inline-flex items-center rounded-md border border-[#d9dde3] bg-white px-1.5 py-0.5 text-[10px] leading-none text-[#1A1A1A] transition hover:border-[#99FF33] hover:bg-[#efffdd]"
                        >
                          {children}
                        </a>
                      );
                    }

                    return (
                      <a
                        href={href}
                        className="text-[#2F6F6D] transition hover:text-[#1A1A1A]"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {normalizedAnswer}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {selectedPage !== null && (
        <SourceModal
          page={selectedPage}
          sources={sourcesForSelectedPage}
          onClose={() => setSelectedPage(null)}
        />
      )}
    </>
  );
}

export function AnswerPanel({
  history,
  errorMessage,
  expandedItemId,
  onToggleItem,
}: AnswerPanelProps) {
  return (
    <div className="border-t border-[#d9dde3] pt-6">
      <h3 className="heading-4 text-[#1A1A1A]">Respostas</h3>

      {errorMessage && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {history.length === 0 && !errorMessage && (
        <p className="mt-4 text-sm leading-7 text-[#666666]">
          Faça uma pergunta para abrir o contexto do documento, inspecionar os
          trechos relevantes e entender como a resposta foi construída.
        </p>
      )}

      {history.length > 0 && (
        <div className="mt-4 space-y-3">
          {history.map((entry) => (
            <HistoryItem
              key={entry.id}
              entry={entry}
              isExpanded={expandedItemId === entry.id}
              onToggle={() => onToggleItem(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
