## Spec: 046 -- Deployment and Portfolio Readiness

## Objetivo

Preparar o ModerationFlow AI para publicação como portfólio, com segurança, documentação e experiência de demonstração controlada.

Esta etapa não publica o projeto em provedor específico e não altera o fluxo de moderação.

## Escopo

Pode alterar:

- exemplos de configuração de ambiente;
- documentação de deploy e segurança;
- README;
- pequenos ajustes de configuração necessários para readiness;
- validação de Docker, health checks e autenticação existente.

## Fora de Escopo

Não alterar:

- heurístico;
- LangGraph principal;
- prompt;
- analyzer;
- datasets de benchmark;
- runner de avaliação;
- regras de Human-in-the-Loop;
- arquitetura de moderação;
- banco e migrations;
- comportamento dos experimentos;
- infraestrutura cloud específica.

## Ambientes

Documentar:

- `development`: uso local, hot reload e banco local.
- `demo`: dados sintéticos, conta demo configurada por ambiente, admin protegido.
- `production`: segredos externos, autenticação forte, privacidade e observabilidade controlada.

## Modo Demo

O modo demo não deve ser bypass de autenticação.

Abordagem escolhida:

- landing pública;
- administração protegida;
- conta demo via variáveis de ambiente;
- dados sintéticos seedados;
- avaliações offline não executadas pelo navegador.

## Segurança

Garantir e documentar:

- `.env.example` sem segredos reais;
- rotas admin protegidas pela autenticação existente;
- LangSmith opcional e fail-open;
- URLs públicas configuráveis;
- nenhuma API key necessária para iniciar a demonstração sem LLM;
- checklist de privacidade.

## Arquivos

Criar ou atualizar:

- `.agents/specs/046-deployment-and-portfolio-readiness.md`
- `docs/deployment-and-portfolio-readiness.md`
- `README.md`
- `backend/.env.example`
- `frontend/.env.example`
- se necessário, configuração leve de ambiente/API.

## Validação

Executar:

```bash
docker compose up -d
docker compose exec backend python -m compileall app
docker compose exec frontend npm run lint
docker compose exec -e NODE_ENV=production frontend npm run build
```

Validar também:

- landing pública responde;
- health check responde;
- backend inicia com `LANGSMITH_TRACING=false`;
- backend inicia sem `LANGSMITH_API_KEY`;
- admin continua protegido;
- `.env.example` não contém segredos reais;
- URLs públicas são configuráveis.

## Critérios de Aceite

- spec criada;
- documentação de deployment e segurança criada;
- ambientes documentados;
- `.env.example` revisados sem segredos;
- landing não depende de localhost hardcoded em produção;
- área administrativa continua protegida;
- LangSmith continua opcional e fail-open;
- build frontend de produção passa;
- backend compila;
- limitações reais documentadas;
- nenhuma infraestrutura complexa introduzida.

## Próxima Spec Recomendada

```text
047 -- Deployment Target and Public Demo Plan
```

