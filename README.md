# SmartDocs AI

Plataforma inteligente para consulta de documentos PDF com IA generativa, RAG, embeddings, LangGraph, temas configuráveis e processamento assíncrono.

## Principais funcionalidades

- Upload de PDFs
- Smart Ingest assíncrono
- Extração de texto
- Chunking
- Enriquecimento semântico de chunks com LLM
- Geração de `embedding_content`
- Indexação em vector store
- Consulta via chat com fontes
- Multi-query retrieval
- Relevance grading
- Temas configuráveis
- Resumo automático do documento
- Perguntas sugeridas
- Exclusão de documentos e collections
- Frontend em Next.js

## Arquitetura em alto nível

- Frontend Next.js
- Backend FastAPI
- OpenAI LLM/Embeddings
- LangChain/LangGraph
- Chroma Vector Store
- Storage local em JSON para documentos, chunks, enriched chunks e jobs

## Fluxo Smart Ingest

```text
Upload PDF
→ escolher tema
→ criar job
→ extrair texto
→ gerar chunks
→ enriquecer chunks com IA
→ salvar enriquecimento parcial por lote
→ gerar embeddings
→ indexar collection enriquecida
→ gerar resumo automático
→ registrar documento
→ liberar consulta no chat
```

## Pipeline de pergunta

```text
Pergunta do usuário
→ geração de queries alternativas
→ busca vetorial
→ avaliação de relevância dos chunks
→ geração de resposta com base no contexto
→ retorno com fontes, páginas e motivos de relevância
```

## Tecnologias

- Python
- FastAPI
- LangChain
- LangGraph
- OpenAI
- Chroma
- Next.js
- React
- TypeScript
- Docker

## Como rodar localmente

1. Copie o arquivo `.env.example` para `.env`.
2. Configure a variável `OPENAI_API_KEY`.
3. Suba os serviços:

```bash
docker compose up --build
```

4. Acesse o frontend:

```text
http://localhost:2000
```

5. Acesse a documentação do backend:

```text
http://localhost:8000/docs
```

## Exemplos de uso

- Consultar manual automotivo
- Consultar documentação técnica
- Consultar norma/regulamento
- Consultar política interna ou contrato

## Roadmap

- Melhorar UX final
- Autenticação
- Banco de dados relacional
- Trocar storage JSON por persistência real
- Avaliação automatizada de respostas
- Deploy
- Experimento futuro com QA extrativo usando Hugging Face
