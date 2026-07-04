## Spec: 048 -- GitHub Actions CI and Railway Continuous Deployment

## Objetivo

Adicionar integração contínua com GitHub Actions e preparar o projeto para deploy contínuo pelo Railway a partir da branch `main`.

Fluxo esperado:

```text
Pull request
-> CI valida backend e frontend

Push em main
-> CI valida backend e frontend
-> Railway recebe o commit
-> Railway realiza deploy automático
-> Railway valida health check
```

Responsabilidades:

```text
GitHub Actions = CI: lint, build e validações
Railway = CD: deploy automático da branch main
```

Não usar Railway CLI nem token Railway no GitHub Actions nesta etapa.

## Escopo

Criar ou atualizar:

- `.github/workflows/ci.yml`
- `docs/ci-cd.md`
- `README.md`
- `.agents/specs/048-github-actions-ci-and-railway-continuous-deployment.md`

Não criar `post-deploy-healthcheck.yml` nesta etapa porque não há URL pública estável no repositório e a spec não permite inventar URLs.

## Fora de Escopo

Não alterar:

- heurístico;
- LangGraph;
- prompt;
- analyzer;
- datasets;
- runner de avaliação;
- LangSmith;
- banco;
- migrations;
- lógica de moderação;
- autenticação;
- frontend visual;
- rotas;
- estratégia de deploy já existente no Docker.

Não criar Terraform, Kubernetes, pipeline complexo de release, rollback automático ou preview deploys.

## CI Principal

Workflow:

```text
.github/workflows/ci.yml
```

Gatilhos:

```yaml
pull_request:
push:
  branches:
    - main
```

Permissões:

```yaml
permissions:
  contents: read
```

Jobs:

- `backend`;
- `frontend`.

## Job Backend

O job backend deve:

- fazer checkout;
- configurar Python `3.12`;
- instalar `backend/requirements.txt`;
- executar `python -m compileall app`;
- não iniciar banco, Docker Compose ou serviços externos.

## Job Frontend

O job frontend deve:

- fazer checkout;
- configurar Node `22`;
- instalar dependências com `npm ci`;
- executar `npm run lint`;
- executar `npm run build` com `NODE_ENV=production`;
- usar variáveis públicas seguras de CI.

## Railway Continuous Deployment

Documentar configuração manual:

1. Conectar o repositório GitHub ao projeto Railway.
2. Criar ou conectar os serviços frontend, backend e PostgreSQL.
3. Configurar branch de deploy como `main`.
4. Habilitar GitHub autodeploy.
5. Configurar Railway para aguardar a CI do GitHub antes do deploy, se disponível.
6. Configurar health check do backend para `/health`.
7. Configurar variáveis de ambiente de cada serviço no Railway.

## Health Checks

Usar endpoint existente:

```text
/health
```

Documentar também:

```text
/health/database
```

como verificação adicional manual.

## Validação

Executar localmente:

```bash
docker compose up -d
docker compose exec backend python -m compileall app
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Validar manualmente:

- sintaxe YAML;
- actions usadas;
- caminhos de backend e frontend;
- ausência de segredos;
- workflow dispara em PR e push na `main`.

## Critérios de Aceite

- Spec criada.
- Workflow CI criado.
- CI executa validação do backend.
- CI executa lint e build do frontend.
- CI dispara em PR e push para main.
- Workflow usa permissões mínimas.
- Nenhum segredo é adicionado ao repositório.
- Railway é documentado como responsável por deploy automático.
- Health check `/health` está documentado.
- README atualizado.
- Documentação de CI/CD criada.
- Nenhuma lógica de aplicação é alterada.
