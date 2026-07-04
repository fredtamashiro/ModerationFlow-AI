# CI/CD

## Architecture

ModerationFlow AI separates validation from deployment:

```text
GitHub Actions = CI
Railway = CD
```

GitHub Actions validates backend and frontend changes on pull requests and pushes to `main`.

Railway should be connected directly to the GitHub repository and configured to deploy the `main` branch automatically after CI is green, when the Railway project supports waiting for GitHub checks.

No Railway CLI, Railway token, or deployment secret is used in GitHub Actions in this stage.

## GitHub Actions CI

The main workflow is:

```text
.github/workflows/ci.yml
```

Triggers:

- `pull_request`;
- `push` to `main`.

Permissions:

```yaml
permissions:
  contents: read
```

### Backend Job

Runtime:

- Python `3.12`, matching the backend Dockerfile.

Commands:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m compileall app
```

The backend job does not start PostgreSQL, Docker Compose, OpenAI, LangSmith, or external services.

Safe CI environment values are used only to allow configuration loading. No real API keys are required.

### Frontend Job

Runtime:

- Node `22`, matching the frontend Dockerfile.

Commands:

```bash
npm ci
npm run lint
NODE_ENV=production npm run build
```

The build uses safe placeholder URLs:

```text
NEXT_PUBLIC_APP_PUBLIC_URL=https://example-frontend.invalid
NEXT_PUBLIC_API_URL=https://example-backend.invalid
INTERNAL_API_URL=https://example-backend.invalid
```

No frontend build secret is required.

## Railway Continuous Deployment

Railway is responsible for deployment.

Expected manual setup:

1. Connect the GitHub repository to the Railway project.
2. Create or connect the frontend, backend, and PostgreSQL services according to the current architecture.
3. Configure `main` as the deploy branch.
4. Enable GitHub autodeploy.
5. Enable "wait for CI" or equivalent GitHub check gating if available in the Railway project.
6. Configure the backend health check path as `/health`.
7. Configure environment variables in Railway service settings.
8. Validate the deployed frontend and backend URLs.

Do not store Railway tokens in GitHub Actions for this stage.

## Required Railway Variables

Use Railway service variables or linked service references. Do not commit real values.

### Backend

```env
APP_ENV=production
APP_NAME=ModerationFlow AI
APP_PUBLIC_URL=https://your-frontend-domain.example
API_PUBLIC_URL=https://your-backend-domain.example
DEMO_MODE=false

DATABASE_URL=${{Postgres.DATABASE_URL}}

OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_CHAT_TEMPERATURE=1

LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=moderation-flow-ai-production
LANGSMITH_ENDPOINT=

JWT_SECRET_KEY=<set-in-railway>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=720

ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
ADMIN_SEED_NAME=Demo Admin
ADMIN_DEMO_EMAIL=
ADMIN_DEMO_PASSWORD=

ADMIN_COOKIE_NAME=moderation_flow_admin_token
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

FRONTEND_ORIGINS=https://your-frontend-domain.example
```

### Frontend

```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_PUBLIC_URL=https://your-frontend-domain.example
NEXT_PUBLIC_API_URL=https://your-backend-domain.example
INTERNAL_API_URL=https://your-backend-domain.example
```

## Health Checks

Primary backend health check:

```text
/health
```

Additional manual database check:

```text
/health/database
```

Use `/health` as the Railway service health check because it validates that the FastAPI process is responding without requiring a database query.

Use `/health/database` after deploy when validating database connectivity.

## Manual Setup Checklist

- [ ] Repositório conectado ao Railway
- [ ] Branch main configurada para deploy
- [ ] GitHub autodeploy habilitado
- [ ] Wait for CI habilitado, se disponível
- [ ] Backend health check configurado como `/health`
- [ ] Variáveis backend configuradas
- [ ] Variáveis frontend configuradas
- [ ] PostgreSQL conectado
- [ ] Domínios públicos configurados
- [ ] CI verde na main
- [ ] Deploy validado

## Rollback

Use a simple Railway rollback process:

1. Identify the last healthy deployment in Railway.
2. Use the Railway interface to redeploy or roll back to that deployment.
3. Fix the issue in a branch and open a pull request.
4. Wait for CI to pass.
5. Merge to `main` only after validation.

No automated rollback is implemented in this stage.

## Limitations

- GitHub Actions performs CI only; it does not deploy.
- No Railway CLI or Railway token is used in GitHub Actions.
- No post-deploy GitHub Actions health check is created because this repository does not contain a stable public deployment URL and the spec forbids inventing one.
- The CI does not start PostgreSQL or Docker Compose.
- `/health/database` depends on a configured database and is documented as a manual post-deploy validation.
- Preview deploys, Terraform, Kubernetes, and release automation are out of scope.
