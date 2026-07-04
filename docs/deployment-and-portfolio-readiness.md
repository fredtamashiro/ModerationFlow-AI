# Deployment and Portfolio Readiness

This document describes how ModerationFlow AI should be prepared for a public portfolio demo without weakening the moderation architecture or exposing secrets.

The project is not tied to a specific cloud provider in this stage.

## Environments

### Development

Purpose:

- local development;
- hot reload;
- Docker Compose with local PostgreSQL;
- local admin account created through seed configuration.

Expected characteristics:

- `APP_ENV=development`;
- frontend can use local URLs such as `http://localhost:3003`;
- backend can use local PostgreSQL;
- LangSmith disabled by default;
- OpenAI key optional unless LLM evaluation or LLM analysis is explicitly run.

### Demo

Purpose:

- controlled portfolio demonstration;
- synthetic seeded data only;
- protected administrative area;
- no real user comments;
- no browser-triggered evaluation runner.

Expected characteristics:

- `APP_ENV=demo`;
- `DEMO_MODE=true` may be used as an environment marker;
- admin access uses the existing authentication flow;
- demo credentials are configured outside Git;
- LangSmith disabled unless masking and policy are explicitly configured.

The demo mode is not an authentication bypass. It should mean controlled data and controlled configuration, not open admin routes.

### Production

Purpose:

- real users and real moderation data.

Expected characteristics:

- `APP_ENV=production`;
- strong externally managed secrets;
- real database service;
- `COOKIE_SECURE=true`;
- restrictive CORS origins;
- admin authentication reviewed before launch;
- privacy policy and data handling process in place;
- observability configured with masking and access controls.

The current repository is portfolio-ready, not fully production-ready.

## Demo Mode Decision

The project keeps the existing protected admin model:

```text
landing public -> admin login -> moderation queue/evaluations
```

No global authentication bypass was added.

The supported demo approach is:

```text
demo account through environment variables + synthetic seed data
```

Use:

- `ADMIN_SEED_EMAIL`;
- `ADMIN_SEED_PASSWORD`;
- `ADMIN_SEED_NAME`;
- optionally `ADMIN_DEMO_EMAIL` and `ADMIN_DEMO_PASSWORD` as documentation/configuration references.

Do not commit real demo credentials.

## Administrative Protection

Administrative pages render through `AdminPageShell`, which checks the current admin session before rendering protected content.

Backend administrative endpoints depend on `require_admin_user`, which validates:

- bearer token or HttpOnly admin cookie;
- JWT signature;
- active admin user;
- admin role.

Protected areas include:

- `/admin/moderation`;
- `/admin/moderation/comments/[id]`;
- `/admin/moderation/guidelines`;
- `/admin/moderation/evaluations`;
- backend moderation/admin endpoints.

The evaluation dashboard uses a local documented snapshot. It does not execute the offline runner from the browser.

## Public URLs

The frontend API client requires explicit API configuration:

- `NEXT_PUBLIC_API_URL` for browser requests;
- `INTERNAL_API_URL` for server-side requests.

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000
```

For demo or production, configure public URLs in the deployment environment. Do not rely on localhost defaults.

## Health Checks

Backend:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/database
```

Docker:

```bash
docker compose up -d
docker compose exec backend python -m compileall app
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Frontend:

- `/` should respond publicly;
- `/admin/moderation` should require an authenticated admin session before showing operational data;
- `/admin/moderation/evaluations` should require an authenticated admin session and should only show documented snapshot data.

## Docker Readiness

The current Compose file is optimized for local development:

- frontend runs with `npm run dev`;
- backend mounts local source directories;
- PostgreSQL runs locally with a development password;
- frontend is exposed on port `3003`;
- backend is exposed on port `8000`.

Production build validation is still required and is done with:

```bash
docker compose exec -e NODE_ENV=production frontend npm run build
```

For a production deployment, prefer building the Dockerfiles directly and supplying secrets through the platform environment, not through committed files.

## Security and Privacy Checklist

- [ ] `.env` is not versioned.
- [ ] `.env.example` contains no real secrets.
- [ ] Demo uses synthetic seeded data only.
- [ ] Admin routes remain protected.
- [ ] LangSmith is disabled by default in demo.
- [ ] Public endpoints are reviewed.
- [ ] Production frontend build is validated.
- [ ] Backend compile check passes.
- [ ] Health check passes.
- [ ] Logs do not print keys, passwords or tokens.
- [ ] No real comments are sent to LangSmith without masking and policy review.

## Secrets

Never commit:

- API keys;
- database credentials;
- JWT secrets;
- admin passwords;
- LangSmith tokens;
- provider tokens.

Use deployment provider secret storage or local `.env` files ignored by Git.

## LangSmith

LangSmith is optional and fail-open.

The app should run with:

```env
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

If LangSmith is enabled, do not send real moderation data before a masking/privacy policy exists.

## Known Limitations

- Cloud deployment is not configured in this stage.
- There is no CI/CD pipeline yet.
- Compose is development-oriented, not a production stack.
- The current admin authentication is suitable for a controlled demo, but production hardening still needs review.
- Demo access depends on seed/configured admin credentials.
- The datasets are curated and mostly synthetic.
- There is no managed database setup in this repository.
- Production observability and data masking are not implemented.

