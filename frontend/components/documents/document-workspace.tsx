"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DocumentSelector } from "@/components/documents/document-selector";
import { DocumentSummaryCard } from "@/components/documents/document-summary-card";
import { MainTopics } from "@/components/documents/main-topics";
import { QuestionBox } from "@/components/documents/question-box";
import { AnswerPanel } from "@/components/documents/answer-panel";
import { SuggestedQuestions } from "@/components/documents/suggested-questions";
import { LimitationsPanel } from "@/components/documents/limitations-panel";
import { TechnicalMetadata } from "@/components/documents/technical-metadata";
import { ImportDocumentModal } from "@/components/documents/import-document-modal";
import { EmptyDocumentsState } from "@/components/documents/empty-documents-state";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import {
  appendChatHistoryEntry,
  ChatHistoryByDocument,
  ChatHistoryEntry,
  loadChatHistory,
  saveChatHistory,
} from "@/lib/chat-history";
import { normalizeUtf8Text } from "@/lib/text";
import {
  askQuestion,
  AuthUser,
  ChatResponse,
  deleteDocument,
  DocumentItem,
  fetchDocuments,
} from "@/services/api";

type DocumentWorkspaceProps = {
  adminUser: AuthUser | null;
};

export function DocumentWorkspace({ adminUser }: DocumentWorkspaceProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsErrorMessage, setDocumentsErrorMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answerErrorMessage, setAnswerErrorMessage] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [historyByDocument, setHistoryByDocument] =
    useState<ChatHistoryByDocument>(() => loadChatHistory());
  const [expandedHistoryItemId, setExpandedHistoryItemId] = useState<
    string | null | undefined
  >(undefined);

  const selectedDocument = useMemo(
    () =>
      documents.find((document) => document.document_id === selectedDocumentId) ??
      null,
    [documents, selectedDocumentId],
  );
  const currentHistory = useMemo(
    () => (selectedDocumentId ? historyByDocument[selectedDocumentId] ?? [] : []),
    [historyByDocument, selectedDocumentId],
  );
  const effectiveExpandedHistoryItemId = useMemo(() => {
    if (expandedHistoryItemId === undefined) {
      return currentHistory[0]?.id ?? null;
    }

    if (
      expandedHistoryItemId &&
      currentHistory.some((entry) => entry.id === expandedHistoryItemId)
    ) {
      return expandedHistoryItemId;
    }

    return null;
  }, [currentHistory, expandedHistoryItemId]);

  const loadDocuments = useCallback(
    async (preferredDocumentId?: string | null) => {
      try {
        setIsLoadingDocuments(true);
        setDocumentsErrorMessage("");

        const data = await fetchDocuments();
        setDocuments(data.documents);

        if (data.documents.length === 0) {
          setSelectedDocumentId(null);
          return;
        }

        const nextSelectedDocument =
          data.documents.find(
            (document) => document.document_id === preferredDocumentId,
          ) ??
          data.documents.find(
            (document) => document.document_id === selectedDocumentId,
          ) ??
          data.documents[0];

        setSelectedDocumentId(nextSelectedDocument.document_id);
      } catch {
        setDocumentsErrorMessage("Não foi possível carregar os documentos.");
      } finally {
        setIsLoadingDocuments(false);
      }
    },
    [selectedDocumentId],
  );

  useEffect(() => {
    let isMounted = true;

    async function initializeDocuments() {
      if (!isMounted) {
        return;
      }

      await loadDocuments();
    }

    void initializeDocuments();

    return () => {
      isMounted = false;
    };
  }, [loadDocuments]);

  const submitQuestion = useCallback(
    async (questionToSubmit: string) => {
      if (!selectedDocument) {
        return;
      }

      const trimmedQuestion = questionToSubmit.trim();

      if (!trimmedQuestion) {
        setAnswerErrorMessage("Digite uma pergunta.");
        return;
      }

      try {
        setIsAsking(true);
        setAnswerErrorMessage("");

        const result: ChatResponse = await askQuestion({
          documentId: selectedDocument.document_id,
          question: trimmedQuestion,
          k: 4,
        });
        const nextEntry: ChatHistoryEntry = {
          ...result,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };

        setHistoryByDocument((currentHistoryByDocument) => {
          const nextHistory = appendChatHistoryEntry(
            currentHistoryByDocument,
            selectedDocument.document_id,
            nextEntry,
          );
          saveChatHistory(nextHistory);
          return nextHistory;
        });
        setExpandedHistoryItemId(nextEntry.id);
        setQuestion("");
      } catch (error) {
        setAnswerErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível obter uma resposta.",
        );
      } finally {
        setIsAsking(false);
      }
    },
    [selectedDocument],
  );

  async function handleDeleteSelectedDocument() {
    if (!selectedDocument) {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja apagar "${normalizeUtf8Text(selectedDocument.original_filename)}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(selectedDocument.document_id);
      await loadDocuments();
    } catch {
      setDocumentsErrorMessage("Não foi possível apagar o documento.");
    }
  }

  function handleDocumentChange(documentId: string) {
    setSelectedDocumentId(documentId);
    setAnswerErrorMessage("");
    setQuestion("");
    setExpandedHistoryItemId(undefined);
  }

  if (!isLoadingDocuments && documents.length === 0) {
    return (
      <>
        <PageContainer>
          <EmptyDocumentsState
            isAdmin={Boolean(adminUser)}
            onImport={() => setIsImportOpen(true)}
          />
        </PageContainer>

        {adminUser && (
          <ImportDocumentModal
            isOpen={isImportOpen}
            onOpenChange={setIsImportOpen}
            onCompleted={() => void loadDocuments()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <section className="bg-[#fafafa] py-6">
        <PageContainer className="grid gap-3">
          <div>
            <h1 className="heading-2 text-[#1A1A1A]">Workspace de documentos</h1>
            <p className="mt-2 text-sm leading-7 text-[#666666]">
              Selecione um documento processado, revise o resumo, explore os
              tópicos principais e converse com a base vetorial em um fluxo mais
              direto para uso real.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="bg-white py-6">
        <PageContainer className="grid gap-8">
          <DocumentSelector
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            isLoading={isLoadingDocuments}
            isAdmin={Boolean(adminUser)}
            onChange={handleDocumentChange}
            onRefresh={() => void loadDocuments(selectedDocumentId)}
            onImport={() => setIsImportOpen(true)}
            onDelete={() => void handleDeleteSelectedDocument()}
          />

          {documentsErrorMessage && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-sm text-red-700">
                {documentsErrorMessage}
              </CardContent>
            </Card>
          )}
          {selectedDocument && (
            <>
              <DocumentSummaryCard summary={selectedDocument.document_summary} />
              <MainTopics topics={selectedDocument.main_topics} />
            </>
          )}
        </PageContainer>
      </section>

      {selectedDocument && (
        <section className="bg-[#F7F8FA] py-8">
          <PageContainer>
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-6">
                <QuestionBox
                  question={question}
                  isLoading={isAsking}
                  onQuestionChange={setQuestion}
                  onSubmit={() => void submitQuestion(question)}
                >
                  <AnswerPanel
                    history={currentHistory}
                    errorMessage={answerErrorMessage}
                    expandedItemId={effectiveExpandedHistoryItemId}
                    onToggleItem={(itemId) =>
                      setExpandedHistoryItemId((currentItemId) =>
                        currentItemId === itemId ? null : itemId,
                      )
                    }
                  />
                </QuestionBox>
              </div>

              <aside className="grid gap-6">
                <SuggestedQuestions
                  questions={selectedDocument.suggested_questions}
                  onQuestionClick={(suggestedQuestion) => {
                    setQuestion(suggestedQuestion);
                    void submitQuestion(suggestedQuestion);
                  }}
                />
                <LimitationsPanel
                  limitations={selectedDocument.summary_limitations}
                />
                <TechnicalMetadata
                  document={selectedDocument}
                />
              </aside>
            </div>
          </PageContainer>
        </section>
      )}

      {adminUser && (
        <ImportDocumentModal
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          onCompleted={() => void loadDocuments()}
        />
      )}
    </>
  );
}
