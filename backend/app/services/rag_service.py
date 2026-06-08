from typing import Any


def build_context_from_chunks(
    chunks: list[dict[str, Any]],
    max_chunks: int | None = None,
    max_chars_per_chunk: int | None = None,
) -> str:
    context_parts = []
    selected_chunks = chunks[:max_chunks] if max_chunks is not None else chunks

    for index, chunk in enumerate(selected_chunks, start=1):
        metadata = chunk["metadata"]
        content = chunk["content"]

        if max_chars_per_chunk is not None:
            content = content[:max_chars_per_chunk]

        context_parts.append(
            f"""
Fonte {index}
Pagina: {metadata.get("page")}
Chunk: {metadata.get("chunk_index")}
Conteudo:
{content}
"""
        )

    return "\n---\n".join(context_parts)
