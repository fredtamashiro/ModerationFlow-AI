from __future__ import annotations

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.moderation.llm.prompt import SYSTEM_PROMPT, build_llm_prompt
from app.moderation.llm.schemas import LLMRiskAnalyzerResponse


def analyze_comment_with_llm(comment: str, available_guidelines: list[dict]) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for LLM evaluation mode.")

    llm = ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=settings.openai_chat_temperature,
        api_key=settings.openai_api_key,
    ).with_structured_output(LLMRiskAnalyzerResponse)

    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            ("human", build_llm_prompt(comment, available_guidelines)),
        ]
    )

    return response.model_dump()
