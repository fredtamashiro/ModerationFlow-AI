from langgraph.graph import END, START, StateGraph

from app.moderation.graph.nodes import (
    ambiguous_deep_review,
    decision_builder,
    fallback_human_review,
    guideline_retriever,
    input_guard,
    intent_router,
    low_risk_path,
    spam_fast_path,
    toxic_fast_path,
    risk_analyzer,
)
from app.moderation.graph.state import ModerationGraphState, ModerationRoute


def _route_after_input_guard(state: ModerationGraphState) -> str:
    return "intent_router" if state.get("input_valid") else "fallback_human_review"


def _route_after_intent(state: ModerationGraphState) -> ModerationRoute:
    return state.get("route", "fallback_human_review")


def build_moderation_graph():
    workflow = StateGraph(ModerationGraphState)

    workflow.add_node("input_guard", input_guard)
    workflow.add_node("intent_router", intent_router)
    workflow.add_node("spam_fast_path", spam_fast_path)
    workflow.add_node("toxic_fast_path", toxic_fast_path)
    workflow.add_node("low_risk_path", low_risk_path)
    workflow.add_node("ambiguous_deep_review", ambiguous_deep_review)
    workflow.add_node("fallback_human_review", fallback_human_review)
    workflow.add_node("guideline_retriever", guideline_retriever)
    workflow.add_node("risk_analyzer", risk_analyzer)
    workflow.add_node("decision_builder", decision_builder)

    workflow.add_edge(START, "input_guard")
    workflow.add_conditional_edges(
        "input_guard",
        _route_after_input_guard,
        {
            "intent_router": "intent_router",
            "fallback_human_review": "fallback_human_review",
        },
    )
    workflow.add_conditional_edges(
        "intent_router",
        _route_after_intent,
        {
            "spam_fast_path": "spam_fast_path",
            "toxic_fast_path": "toxic_fast_path",
            "low_risk_path": "low_risk_path",
            "ambiguous_deep_review": "ambiguous_deep_review",
            "fallback_human_review": "fallback_human_review",
        },
    )

    for path_node in (
        "spam_fast_path",
        "toxic_fast_path",
        "low_risk_path",
        "ambiguous_deep_review",
        "fallback_human_review",
    ):
        workflow.add_edge(path_node, "guideline_retriever")

    workflow.add_edge("guideline_retriever", "risk_analyzer")
    workflow.add_edge("risk_analyzer", "decision_builder")
    workflow.add_edge("decision_builder", END)
    return workflow.compile()


moderation_graph = build_moderation_graph()
