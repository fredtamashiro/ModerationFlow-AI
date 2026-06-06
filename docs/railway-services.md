# Serviços Railway — SmartDocs AI

## Visão geral

O deploy do SmartDocs AI no Railway deve ser dividido em serviços separados para isolar responsabilidades, facilitar observabilidade e permitir escala independente de cada componente.

Serviços previstos:

- Frontend Next.js
- API FastAPI
- Worker RQ
- PostgreSQL com pgvector
- Redis

## Serviço: smartdocs-api

Tipo: Backend FastAPI

Diretório: `backend`

Start command:

```sh
sh scripts/start_api.sh
```

Variáveis:

```env
APP_ENV=production
DATABASE_URL=
REDIS_URL=
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_CHAT_TEMPERATURE=1
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MAX_UPLOAD_FILE_SIZE_MB=10
CHAT_RATE_LIMIT_PER_IP_DAILY=30
CHAT_RATE_LIMIT_GLOBAL_DAILY=300
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=720
ADMIN_COOKIE_NAME=smartdocs_admin_token
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=.fredtamashiro.com.br
FRONTEND_ORIGINS=https://smartdocs.fredtamashiro.com.br
MAX_RELEVANCE_SCORE=
MAX_DISPLAY_SOURCE_SCORE=
DISPLAY_SOURCE_SCORE_MARGIN=
MIN_ENRICHED_CHUNK_QUALITY_SCORE=
```

Domínio sugerido:

- `api-smartdocs.fredtamashiro.com.br`

## Serviço: smartdocs-worker

Tipo: Worker Python / RQ

Diretório: `backend`

Start command:

```sh
sh scripts/start_worker.sh
```

Variáveis:

Mesmas variáveis principais da API:

- `APP_ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_CHAT_TEMPERATURE`
- `OPENAI_EMBEDDING_MODEL`
- `MAX_UPLOAD_FILE_SIZE_MB`
- `MIN_ENRICHED_CHUNK_QUALITY_SCORE`
- `JWT_SECRET_KEY`

Observação:

O worker não precisa expor porta HTTP.

## Serviço: smartdocs-frontend

Tipo: Next.js

Diretório: `frontend`

Start command:

```sh
npm run start
```

Variáveis:

```env
NEXT_PUBLIC_API_URL=https://api-smartdocs.fredtamashiro.com.br
INTERNAL_API_URL=https://api-smartdocs.fredtamashiro.com.br
```

Domínio sugerido:

- `smartdocs.fredtamashiro.com.br`

## Serviço: PostgreSQL + pgvector

O banco precisa ter a extensão `vector` habilitada para suportar armazenamento e busca vetorial com `pgvector`.

Depois de criado, a `DATABASE_URL` deve ser configurada nos serviços:

- `smartdocs-api`
- `smartdocs-worker`

## Serviço: Redis

O Redis é usado para:

- RQ queue do Smart Ingest
- rate limit do chat

Depois de criado, a `REDIS_URL` deve ser configurada nos serviços:

- `smartdocs-api`
- `smartdocs-worker`

## Bootstrap

Antes de usar a aplicação em ambiente novo, rodar no serviço da API:

```sh
python app/database/bootstrap.py
```

Esse comando:

- executa migrations
- popula `themes`
- cria admin inicial se `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` estiverem configurados

## Ordem sugerida de deploy

1. Criar PostgreSQL/pgvector
2. Criar Redis
3. Criar API
4. Configurar variáveis da API
5. Rodar bootstrap
6. Criar worker
7. Criar frontend
8. Configurar domínio da API
9. Configurar domínio do frontend
10. Testar healthchecks
11. Testar login admin
12. Testar Smart Ingest
13. Testar chat público

## Checklist pós-deploy

- `GET /health/database`
- `GET /health/redis`
- `GET /documents`
- `POST /chat/ask`
- `POST /auth/login`
- `POST /documents/smart-ingest/start`
- verificar worker processando job
- verificar `usage_logs`
