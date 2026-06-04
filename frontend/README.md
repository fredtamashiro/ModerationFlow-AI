# SmartDocs IA

Assistente inteligente para consulta de documentos em PDF usando IA Generativa, RAG, LangChain, LangGraph e uma interface web em Next.js.

O projeto permite fazer upload de um manual em PDF, processar o conteúdo, gerar embeddings, indexar os trechos em um banco vetorial local e realizar perguntas em linguagem natural com respostas baseadas no conteúdo do manual.

---

## Objetivo do projeto

Este projeto foi criado como estudo prático de Engenharia de IA aplicada, com foco em:

- Construção de aplicações com LLMs
- Arquitetura RAG
- Processamento de documentos PDF
- Geração de embeddings
- Busca semântica com banco vetorial
- Orquestração de fluxo com LangGraph
- Desenvolvimento full stack com Python/FastAPI e Next.js

---

## Funcionalidades

- Upload de documentos em PDF
- Extração e limpeza de texto do PDF
- Divisão do conteúdo em chunks
- Persistência dos chunks em JSON
- Geração de embeddings com OpenAI
- Indexação em banco vetorial local com Chroma
- Registro local dos documentos processados
- Listagem dos manuais cadastrados
- Chat para perguntas sobre cada manual
- Respostas geradas com base no conteúdo recuperado
- Exibição das fontes utilizadas na resposta
- Filtro de relevância para evitar respostas fora do contexto
- Histórico local de perguntas e respostas no frontend

---

## Stack utilizada

### Backend

- Python
- FastAPI
- LangChain
- LangGraph
- ChromaDB
- OpenAI API
- pypdf
- Docker

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Infraestrutura local

- Docker Compose
- Volumes locais para uploads, chunks e vector store

---

## Arquitetura geral

```text
Frontend Next.js
      ↓
API FastAPI
      ↓
Upload e processamento do PDF
      ↓
Extração e limpeza de texto
      ↓
Chunking
      ↓
Embeddings OpenAI
      ↓
Chroma Vector Store
      ↓
LangGraph RAG Flow
      ↓
Resposta com fontes
```

---

## Fluxo RAG

O fluxo principal do RAG funciona assim:

```text
1. Usuário envia um PDF
2. Backend salva o arquivo
3. Texto é extraído página por página
4. Texto é limpo e dividido em chunks
5. Chunks são salvos em JSON
6. Chunks são convertidos em embeddings
7. Embeddings são armazenados no Chroma
8. Usuário faz uma pergunta
9. Sistema busca chunks semanticamente relevantes
10. LangGraph avalia se o contexto é relevante
11. LLM gera resposta usando somente o contexto recuperado
12. Frontend exibe resposta e fontes
```

---

## Uso do LangGraph

O fluxo de pergunta e resposta é orquestrado com LangGraph.

```text
retrieve_context
      ↓
decisão condicional
      ├── contexto relevante → generate_answer
      └── contexto fraco → answer_not_found
      ↓
format_sources
      ↓
resposta final
```

Essa abordagem evita que o modelo responda perguntas fora do escopo do manual quando os chunks recuperados não têm relevância suficiente.

---

## Estrutura do projeto

```text
auto-manual-ai/
  backend/
    app/
      api/
        routes/
      graph/
      services/
      schemas/
      storage/
    Dockerfile
    requirements.txt

  frontend/
    app/
    components/
    services/
    Dockerfile
    package.json

  docker-compose.yml
  README.md
```

---

## Endpoints principais

### Health check

```http
GET /health
```

### Upload, processamento e indexação de PDF

```http
POST /documents/ingest
```

Recebe um arquivo PDF, processa o conteúdo e indexa no vector store.

### Listagem de documentos

```http
GET /documents
```

Retorna os documentos já ingeridos.

### Pergunta sobre um manual

```http
POST /chat/ask
```

Exemplo de payload:

```json
{
  "document_id": "uuid-do-documento",
  "question": "Como ligo o farol?",
  "k": 4
}
```

Exemplo de resposta:

```json
{
  "question": "Como ligo o farol?",
  "answer": "Para ligar o farol baixo, coloque o interruptor de iluminação na posição correspondente...",
  "sources": [
    {
      "page": 33,
      "chunk_index": 77,
      "score": 0.7294,
      "preview": "Coloque o interruptor de iluminação na posição para ligar o farol baixo..."
    }
  ]
}
```

---

## Como rodar o projeto

### Pré-requisitos

- Docker
- Docker Compose
- Conta na OpenAI Platform
- API key da OpenAI

---

## Configuração do backend

Crie o arquivo:

```text
backend/.env
```

Com o conteúdo:

```env
OPENAI_API_KEY=sua_chave_aqui

OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MAX_RELEVANCE_SCORE=1.2
```

---

## Subir aplicação

Na raiz do projeto:

```bash
docker compose up --build
```

Acesse:

```text
Frontend:
http://localhost:2000

Backend Swagger:
http://localhost:8000/docs
```

---

## Observação sobre custos

Este projeto usa a OpenAI API para:

- Geração de embeddings
- Geração de respostas com LLM

Recomenda-se usar crédito pré-pago e desabilitar recarga automática para evitar custos inesperados.

---

## Estado atual do projeto

O projeto atualmente possui um MVP funcional com:

- Backend RAG funcional
- Frontend com upload de PDF
- Listagem de documentos
- Chat por documento
- Respostas com fontes
- Controle básico de relevância

---

## Próximos passos

Possíveis evoluções:

- Persistir documentos e histórico em banco de dados
- Criar autenticação de usuários
- Melhorar estratégia de chunking
- Adicionar reranking
- Adicionar observabilidade com LangFuse
- Criar testes de qualidade com DeepEval
- Fazer deploy em cloud
- Suportar múltiplos provedores de LLM
- Exibir página do PDF usada como fonte
- Criar histórico persistente de conversas

---

## Aprendizados aplicados

Este projeto demonstra conhecimentos práticos em:

- IA Generativa aplicada
- RAG
- LangChain
- LangGraph
- FastAPI
- Vector databases
- Embeddings
- Next.js
- Docker
- Arquitetura full stack com IA
