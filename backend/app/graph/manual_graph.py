from typing import Any, TypedDict
from app.config import get_settings

from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from app.services.rag_service import build_context_from_chunks
from app.services.theme_service import format_theme_rules, get_theme_or_default
from app.services.vector_store_service import search_similar_chunks

import json


class ManualGraphState(TypedDict):
    """Define os dados compartilhados entre as etapas do fluxo do LangGraph."""

    collection_name: str
    question: str
    rewritten_question: str
    search_queries: list[str]
    k: int
    chunks: list[dict[str, Any]]
    context: str
    answer: str
    sources: list[dict[str, Any]]
    has_context: bool
    min_score: float | None
    max_relevance_score: float
    theme_id: str | None
    theme_name: str | None
    query_rules: str
    answer_rules: str


def create_chat_model() -> ChatOpenAI:
    """Cria o cliente do modelo de chat usando as configuracoes da aplicacao."""

    settings = get_settings()

    return ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=settings.openai_chat_temperature,
    )


def rewrite_query(state: ManualGraphState) -> ManualGraphState:
    """Reescreve a pergunta para melhorar a busca semantica no vector store."""

    prompt = f"""
    Você é um assistente especializado em melhorar perguntas para busca semântica em manuais automotivos.

    Reescreva a pergunta do usuário para melhorar a recuperação de informações em um banco vetorial.

    Regras:
    - Preserve a intenção original da pergunta.
    - Inclua sinônimos e termos relacionados quando fizer sentido.
    - Não responda à pergunta.
    - Retorne apenas a pergunta reescrita, sem explicações.

    Pergunta original:
    {state["question"]}
    """

    llm = create_chat_model()

    response = llm.invoke(prompt)

    rewritten_question = response.content.strip()

    if not rewritten_question:
        rewritten_question = state["question"]

    return {
        **state,
        "rewritten_question": rewritten_question,
    }

def retrieve_context(state: ManualGraphState) -> ManualGraphState:
    """Busca os chunks mais relevantes e monta o contexto usado pela resposta."""

    search_queries = state.get("search_queries") or [
        state.get("rewritten_question") or state["question"]
    ]

    candidates_by_key = {}

    for query in search_queries:
        chunks = search_similar_chunks(
            collection_name=state["collection_name"],
            query=query,
            k=state["k"],
        )

        for chunk in chunks:
            metadata = chunk["metadata"]

            key = (
                metadata.get("document_id"),
                metadata.get("page"),
                metadata.get("chunk_index"),
            )

            existing_chunk = candidates_by_key.get(key)

            # Como o score do Chroma é distância, menor é melhor
            if existing_chunk is None or chunk["score"] < existing_chunk["score"]:
                candidates_by_key[key] = {
                    **chunk,
                    "matched_query": query,
                }

    all_candidates = list(candidates_by_key.values())

    all_candidates.sort(key=lambda item: item["score"])

    selected_chunks = all_candidates[: state["k"]]

    min_score = None

    if selected_chunks:
        min_score = min(chunk["score"] for chunk in selected_chunks)

    has_relevant_context = (
        min_score is not None
        and min_score <= state["max_relevance_score"]
    )

    context = build_context_from_chunks(selected_chunks) if has_relevant_context else ""

    return {
        **state,
        "chunks": selected_chunks,
        "context": context,
        "has_context": has_relevant_context,
        "min_score": min_score,
    }

def should_generate_answer(state: ManualGraphState) -> str:
    """Decide se ha contexto suficiente para responder ou se deve falhar com seguranca."""

    if state["has_context"]:
        return "generate_answer"

    return "answer_not_found"

def answer_not_found(state: ManualGraphState) -> ManualGraphState:
    """Define a resposta padrao quando nenhum contexto relevante foi encontrado."""

    return {
        **state,
        "answer": (
            "Não encontrei informações suficientemente relevantes no manual "
            "para responder essa pergunta com segurança."
        ),
    }

def generate_answer(state: ManualGraphState) -> ManualGraphState:
    """Gera a resposta final com base apenas no contexto recuperado do manual."""

    prompt = f"""
Você é um assistente especializado em responder perguntas com base exclusivamente no contexto recuperado.

Responda à pergunta do usuário usando apenas o contexto abaixo.

Regras gerais:
- Não invente informações.
- Não use conhecimento externo.
- Se a resposta não estiver no contexto, diga que não encontrou essa informação no documento.
- Quando houver limitação, ambiguidade ou informação indireta, explique isso.
- Seja claro e objetivo.
- Cite páginas quando elas estiverem disponíveis no contexto.

Regras específicas do tema para resposta:
{state.get("answer_rules") or "Nenhuma regra específica de resposta foi configurada."}

Pergunta:
{state["question"]}

Contexto:
{state["context"]}
"""

    llm = create_chat_model()

    response = llm.invoke(prompt)

    return {
        **state,
        "answer": response.content,
    }


def format_sources(state: ManualGraphState) -> ManualGraphState:
    """Formata os chunks usados como fontes para retornar ao frontend."""

    if not state["has_context"]:
        return {
            **state,
            "sources": [],
        }

    settings = get_settings()

    chunks = state["chunks"]

    if not chunks:
        return {
            **state,
            "sources": [],
        }

    best_score = min(chunk["score"] for chunk in chunks)

    max_allowed_score = min(
        settings.max_display_source_score,
        best_score + settings.display_source_score_margin,
    )

    sources = []

    for chunk in chunks:
        if chunk["score"] > max_allowed_score:
            continue

        metadata = chunk["metadata"]

        sources.append(
            {
                "page": metadata.get("page"),
                "chunk_index": metadata.get("chunk_index"),
                "score": chunk["score"],
                "matched_query": chunk.get("matched_query"),
                "preview": chunk["content"][:300],
            }
        )

    return {
        **state,
        "sources": sources,
    }

def create_manual_graph():
    """Monta o fluxo do LangGraph que orquestra a resposta do chat."""

    graph = StateGraph(ManualGraphState)

    graph.add_node("rewrite_query", rewrite_query)
    graph.add_node("generate_search_queries", generate_search_queries)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("generate_answer", generate_answer)
    graph.add_node("answer_not_found", answer_not_found)
    graph.add_node("format_sources", format_sources)

    graph.set_entry_point("rewrite_query")

    graph.add_edge("rewrite_query", "generate_search_queries")
    graph.add_edge("generate_search_queries", "retrieve_context")

    graph.add_conditional_edges(
        "retrieve_context",
        should_generate_answer,
        {
            "generate_answer": "generate_answer",
            "answer_not_found": "answer_not_found",
        },
    )

    graph.add_edge("generate_answer", "format_sources")
    graph.add_edge("answer_not_found", "format_sources")
    graph.add_edge("format_sources", END)

    return graph.compile()

def answer_question_with_manual_graph(
    collection_name: str,
    question: str,
    k: int = 4,
    theme_id: str | None = None,
    theme_name: str | None = None,
    query_rules: str = "",
    answer_rules: str = "",
) -> dict[str, Any]:
    """Ponto de entrada usado pela API para responder uma pergunta sobre um manual."""

    if not question.strip():
        raise ValueError("A pergunta não pode estar vazia.")

    graph = create_manual_graph()
    settings = get_settings()
    theme = get_theme_or_default(theme_id)
    resolved_theme_id = theme_id or theme["theme_id"]
    resolved_theme_name = theme_name or theme["name"]
    resolved_query_rules = query_rules or format_theme_rules(theme, "query_rules")
    resolved_answer_rules = answer_rules or format_theme_rules(theme, "answer_rules")

    result = graph.invoke(
        {
            "collection_name": collection_name,
            "question": question,
            "rewritten_question": "",
            "search_queries": [],
            "k": k,
            "chunks": [],
            "context": "",
            "answer": "",
            "sources": [],
            "has_context": False,
            "min_score": None,
            "max_relevance_score": settings.max_relevance_score,
            "theme_id": resolved_theme_id,
            "theme_name": resolved_theme_name,
            "query_rules": resolved_query_rules,
            "answer_rules": resolved_answer_rules,
        }
    )

    return {
        "question": result["question"],
        "answer": result["answer"],
        "sources": result["sources"],
    }

def generate_search_queries(state: ManualGraphState) -> ManualGraphState:
    """Cria consultas alternativas para aumentar a chance de encontrar bons chunks."""

    prompt = f"""
Você é um assistente especializado em melhorar buscas semânticas em documentos PDF.

A partir da pergunta original do usuário, gere uma lista de consultas alternativas para busca vetorial.

Regras gerais:
- Retorne apenas um JSON válido.
- O JSON deve ser uma lista de strings.
- Gere entre 4 e 8 consultas.
- Preserve a intenção original da pergunta.
- Inclua sinônimos, termos técnicos e formas alternativas de perguntar.
- Não responda à pergunta.
- Não invente informações sobre o documento.
- As consultas devem ajudar a encontrar trechos relevantes no documento.

Regras específicas do tema para busca:
{state.get("query_rules") or "Nenhuma regra específica de busca foi configurada."}

Pergunta original:
{state["question"]}
"""

    llm = create_chat_model()

    response = llm.invoke(prompt)
    raw_content = response.content.strip()

    try:
        queries = json.loads(raw_content)
    except json.JSONDecodeError:
        queries = []

    if not isinstance(queries, list):
        queries = []

    clean_queries = []

    for query in queries:
        if isinstance(query, str) and query.strip():
            clean_queries.append(query.strip())

    # Garante que a pergunta original sempre entre na busca
    final_queries = [state["question"]]

    if state.get("rewritten_question"):
        final_queries.append(state["rewritten_question"])

    final_queries.extend(clean_queries)

    # Remove duplicados preservando ordem
    deduplicated_queries = list(dict.fromkeys(final_queries))

    return {
        **state,
        "search_queries": deduplicated_queries,
    }
