# Runbook de Desenvolvimento — ModerationFlow AI

## 1. Objetivo do projeto

Construir uma aplicação full stack de moderação assistida por IA para uma plataforma de cursos online.

O projeto deve demonstrar, com profundidade, o uso de:

- LangGraph com grafo decisório real;
- roteamento condicional;
- análise de risco com saída estruturada;
- recuperação de diretrizes por RAG;
- agente crítico para casos ambíguos;
- Human-in-the-Loop;
- auditoria das decisões;
- feedback humano para avaliação e melhoria contínua;
- observabilidade mínima de execuções, custos e latência.

A proposta não é criar apenas um pipeline linear com IA, mas sim um fluxo de decisão com ramificações, validações, revisão humana e registro de aprendizado operacional.

---

## 2. Nome provisório

**ModerationFlow AI**

Descrição curta:

> Sistema de moderação assistida por IA com LangGraph, RAG em diretrizes, agente crítico e Human-in-the-Loop.

---

## 3. Estratégia técnica

O projeto deve reaproveitar a base técnica do SmartDocs AI para acelerar o desenvolvimento, sem comprometer a identidade do novo projeto.

### Pode reaproveitar

- Estrutura FastAPI;
- estrutura Next.js;
- autenticação admin;
- cookie HttpOnly;
- layout base;
- componentes visuais;
- padrão de `services/api.ts`;
- Docker;
- Railway;
- PostgreSQL;
- logs de uso;
- migrations;
- scripts de bootstrap;
- documentação base.

### Não deve reaproveitar diretamente

- Fluxo de upload de PDFs;
- processamento de documentos PDF;
- entidades específicas de SmartDocs;
- endpoints de chat com documentos;
- lógica específica de ingestão de PDFs;
- cache de respostas de documentos.

### Observação importante

O `pgvector` pode continuar no projeto, mas agora com outro papel: apoiar a recuperação semântica das diretrizes de moderação, e não mais a consulta de documentos PDF.

---

## 4. Estratégia de reuso do SmartDocs AI

A abordagem escolhida é criar um novo projeto baseado na estrutura do SmartDocs AI.

Fluxo sugerido:

```text
smartdocs-ai
→ usado como base técnica

moderation-flow-ai
→ novo projeto/repositório
→ copia estrutura do SmartDocs
→ remove fluxo de PDFs
→ mantém fundação full stack
→ implementa moderação com LangGraph
```

---

## 21. AvaliaÃ§Ã£o local do grafo

Para executar a avaliaÃ§Ã£o baseline do motor de moderaÃ§Ã£o:

```bash
cd backend
python scripts/evaluate_moderation.py
```

Dataset utilizado:

```text
backend/app/evaluation/datasets/moderation_eval.json
```

Com Docker:

```bash
docker compose exec backend python scripts/evaluate_moderation.py
```

ObservaÃ§Ãµes:

- a avaliaÃ§Ã£o atual executa o grafo em memÃ³ria;
- ela nÃ£o persiste `moderation_runs` nem `moderation_steps`;
- ela consulta apenas as `guidelines` jÃ¡ existentes para montar o estado inicial;
- o objetivo Ã© gerar um baseline heurÃ­stico para comparaÃ§Ãµes futuras.

- a observabilidade opcional do experimento LLM com LangSmith estÃ¡ documentada em `docs/observability.md`.

- para rodar a avaliacao LLM sem tracing, use:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset safety --mode llm
```

- para validar o dataset curado de feedback humano, use:

```bash
docker compose exec backend python -m app.evaluation.feedback_examples
```

- para rodar o experimento few-shot isolado, use:

```bash
docker compose exec -e LANGSMITH_TRACING=false backend python scripts/evaluate_moderation.py --dataset blind --mode few-shot
```

Objetivo:

- ganhar tempo reaproveitando infraestrutura, autenticação, layout e deploy;
- manter o novo projeto independente para portfólio;
- evitar misturar conceitos de documentos PDF com moderação;
- concentrar esforço nas partes de maior valor técnico: grafo, HITL, avaliação e observabilidade.

---

## 5. Banco de dados

Utilizar PostgreSQL.

Pode ser usado o mesmo serviço PostgreSQL do Railway, desde que os dados fiquem separados por schema.

Schemas sugeridos:

```text
moderation
shared
```

Tabelas principais:

```text
moderation.comments
moderation.guidelines
moderation.guideline_chunks
moderation.moderation_runs
moderation.moderation_steps
moderation.moderation_decisions
moderation.feedback_examples
shared.usage_logs
```

---

## 6. Entidades principais

### 6.1 `moderation.comments`

Armazena comentários enviados para moderação.

Campos sugeridos:

```text
id
author_name
course_name
lesson_name
content
status
created_at
updated_at
```

Status possíveis:

```text
pending
analyzing
waiting_human_review
approved
removed
edit_requested
failed
```

---

### 6.2 `moderation.guidelines`

Armazena diretrizes da comunidade.

Campos sugeridos:

```text
id
code
title
description
severity
examples
created_at
updated_at
```

Exemplos de regras:

```text
R-001 Spam e autopromoção
R-002 Ataques pessoais
R-003 Linguagem ofensiva
R-004 Discriminação ou discurso de ódio
R-005 Conteúdo perigoso ou ilegal
R-006 Crítica legítima permitida
```

---

### 6.3 `moderation.guideline_chunks`

Armazena trechos vetorizados das diretrizes.

Campos sugeridos:

```text
id
guideline_id
content
embedding
metadata
created_at
```

Observação:

Na primeira versão, as diretrizes podem ser consultadas de forma estruturada. A busca semântica com embeddings pode entrar logo depois, desde que não atrase a fundação do grafo.

---

### 6.4 `moderation.moderation_runs`

Representa uma execução do grafo LangGraph para um comentário.

Campos sugeridos:

```text
id
comment_id
status
route
risk_level
category
confidence
recommended_action
ai_justification
critic_applied
requires_human_review
policy_references
error_message
started_at
finished_at
created_at
```

---

### 6.5 `moderation.moderation_steps`

Registra cada etapa executada no grafo.

Campos sugeridos:

```text
id
run_id
node_name
status
duration_ms
model
input_tokens
output_tokens
error_message
metadata
created_at
```

---

### 6.6 `moderation.moderation_decisions`

Registra a decisão humana final.

Campos sugeridos:

```text
id
comment_id
run_id
ai_recommendation
human_decision
human_category
human_risk_level
moderator_note
final_content
was_ai_correct
decided_at
created_at
```

---

### 6.7 `moderation.feedback_examples`

Armazena exemplos de correção humana para avaliação e melhoria futura.

Campos sugeridos:

```text
id
comment_text
ai_decision
human_decision
ai_category
human_category
ai_confidence
moderator_note
was_ai_correct
created_at
```

---

## 7. Grafo LangGraph

O grafo deve ter ramificações reais e não apenas uma sequência linear.

Fluxo esperado:

```text
START
  ↓
input_guard
  ↓
intent_router
  ├── spam_fast_path
  ├── toxic_fast_path
  ├── low_risk_path
  └── ambiguous_deep_review
          ↓
      guideline_retriever
          ↓
      risk_analyzer
          ↓
      confidence_gate
          ├── high_confidence → decision_builder
          └── low_confidence → critic_agent → decision_builder
          ↓
      human_review
          ├── approve_ai_suggestion
          ├── override_decision
          ├── edit_justification
          └── request_reanalysis
                    ↓
              risk_analyzer / critic_agent
          ↓
      finalize_decision
          ↓
      save_feedback_example
          ↓
END
```

A arquitetura deve conseguir responder claramente:

- Onde existem ramificações reais?
- Por que LangGraph foi usado?
- Quando o agente crítico é acionado?
- Como o humano intervém no fluxo?
- Como a decisão humana é registrada?
- Como o sistema se comporta em caso de erro?

---

## 8. Nós do grafo

### 8.1 `input_guard`

Responsável por validações iniciais.

Deve verificar:

- comentário vazio;
- comentário muito curto;
- comentário muito longo;
- conteúdo impossível de analisar;
- possível payload malicioso.

Em caso de falha, o comentário deve ir para revisão humana.

Regra:

> Na dúvida, escalar para humano.

---

### 8.2 `intent_router`

Classifica o comentário em uma rota inicial.

Rotas possíveis:

```text
spam_fast_path
toxic_fast_path
low_risk_path
ambiguous_deep_review
```

A saída deve ser estruturada com Pydantic.

Campos esperados:

```text
route
reason
confidence
```

Exemplos de decisão:

- spam evidente → `spam_fast_path`;
- ofensa evidente → `toxic_fast_path`;
- elogio, dúvida ou crítica educada → `low_risk_path`;
- sarcasmo, ironia ou crítica agressiva → `ambiguous_deep_review`.

---

### 8.3 `spam_fast_path`

Caminho rápido para spam evidente.

Exemplos:

- link promocional;
- venda externa;
- propaganda repetitiva;
- comentário sem relação com o curso.

Mesmo com sugestão clara, a decisão final ainda passa pelo humano.

---

### 8.4 `toxic_fast_path`

Caminho rápido para ofensa evidente.

Exemplos:

- xingamento direto;
- ataque pessoal;
- linguagem agressiva explícita.

Mesmo com sugestão clara, a decisão final ainda passa pelo humano.

---

### 8.5 `low_risk_path`

Caminho para comentários aparentemente seguros.

Exemplos:

- dúvida legítima;
- elogio;
- pedido de ajuda;
- crítica educada.

Pode sugerir aprovação, mas ainda registra a análise.

---

### 8.6 `ambiguous_deep_review`

Caminho para comentários ambíguos.

Exemplos:

- sarcasmo;
- crítica forte, mas talvez legítima;
- comentário irônico;
- linguagem negativa sem ofensa direta.

Esse caminho deve consultar diretrizes, analisar risco e possivelmente chamar o agente crítico.

---

### 8.7 `guideline_retriever`

Busca diretrizes relevantes.

Inicialmente pode buscar em tabela estruturada.

Evolução desejada:

- embedding;
- busca por similaridade;
- retorno de regra com código, título e trecho;
- citação da regra usada na recomendação.

Saída esperada:

```json
{
  "rule_id": "R-003",
  "title": "Linguagem ofensiva",
  "excerpt": "Comentários ofensivos, ataques pessoais ou linguagem discriminatória não são permitidos.",
  "similarity": 0.82
}
```

---

### 8.8 `risk_analyzer`

Analisa risco com base no comentário e nas diretrizes recuperadas.

Saída esperada:

```text
risk_level
category
confidence
recommended_action
justification
policy_references
```

Valores possíveis:

```text
risk_level: low, medium, high
recommended_action: approve, flag, remove, request_edit
```

Exemplo de saída estruturada:

```json
{
  "risk_level": "medium",
  "category": "offensive_language",
  "confidence": 0.68,
  "recommended_action": "flag",
  "justification": "O comentário contém tom depreciativo, mas não há ataque direto a uma pessoa específica.",
  "policy_references": ["R-003"]
}
```

---

### 8.9 `confidence_gate`

Decide se a análise precisa passar pelo agente crítico.

Critérios sugeridos para acionar o crítico:

- confiança menor que `0.75`;
- `risk_level` igual a `high`;
- `recommended_action` igual a `remove`;
- comentário classificado como `ambiguous_deep_review`;
- divergência entre `intent_router` e `risk_analyzer`.

---

### 8.10 `critic_agent`

Reavalia a recomendação inicial.

Deve verificar:

- a decisão é proporcional?
- existe risco de remover uma crítica legítima?
- a diretriz recuperada é adequada?
- a justificativa está coerente?
- a recomendação precisa ser ajustada?

Saída esperada:

```text
agree_with_analysis
critic_notes
adjusted_risk_level
adjusted_recommended_action
adjusted_confidence
```

Exemplo de saída estruturada:

```json
{
  "agree_with_analysis": false,
  "critic_notes": "O comentário é crítico, mas não contém ofensa direta. A remoção pode ser excessiva.",
  "adjusted_risk_level": "low",
  "adjusted_recommended_action": "approve",
  "adjusted_confidence": 0.78
}
```

---

### 8.11 `decision_builder`

Consolida a recomendação final da IA.

Deve gerar:

```text
recommended_action
risk_level
category
confidence
justification
policy_references
critic_summary
requires_human_review
```

---

### 8.12 `human_review`

Pausa do fluxo para decisão humana.

O moderador pode:

```text
aprovar sugestão da IA
alterar decisão
editar justificativa
solicitar edição do comentário
pedir nova análise
```

A V1 deve manter revisão humana obrigatória.

A IA nunca deve tomar decisão final sozinha.

---

### 8.13 `finalize_decision`

Salva a decisão final no banco e atualiza o status do comentário.

---

### 8.14 `save_feedback_example`

Quando houver decisão humana, salvar exemplo para avaliação e melhoria futura.

---

## 9. Human-in-the-Loop

O HITL deve ser parte central do projeto.

Regras:

- a IA nunca deve tomar decisão final sozinha na V1;
- toda recomendação deve passar pelo moderador;
- o moderador pode concordar ou discordar;
- divergências devem ser salvas;
- correções humanas devem alimentar uma base de exemplos;
- o sistema deve registrar se a IA acertou ou errou em relação à decisão final.

Objetivo:

> Transformar o moderador humano em parte do fluxo de melhoria do sistema, não apenas em um botão de aprovação.

---

## 10. Avaliação

Criar um dataset simples de avaliação.

Arquivo sugerido:

```text
backend/app/evaluation/datasets/moderation_eval.json
```

Conteúdo esperado:

```json
[
  {
    "comment": "Esse curso é uma perda de tempo.",
    "expected_category": "legitimate_criticism",
    "expected_risk_level": "low",
    "expected_action": "approve",
    "expected_policy_rule": "R-006"
  }
]
```

Script futuro:

```text
backend/scripts/evaluate_moderation.py
```

Métricas desejadas:

```text
accuracy_action
accuracy_risk_level
accuracy_category
policy_match_rate
average_latency_ms
failure_rate
```

O objetivo da avaliação não é buscar perfeição, mas demonstrar maturidade:

- medir acertos;
- identificar erros;
- comparar versões;
- ajustar prompts;
- validar mudanças no grafo.

---

## 11. Observabilidade

Registrar cada execução do grafo.

Métricas mínimas:

```text
duration_ms
node_name
route
risk_level
confidence
recommended_action
critic_applied
tokens
model
error_message
```

A V1 deve funcionar com logs próprios no banco.

No futuro, avaliar integração com:

```text
Langfuse
LangSmith
```

Boas práticas:

- registrar início e fim de cada nó;
- registrar duração em milissegundos;
- registrar falhas sem expor dados sensíveis desnecessários;
- separar erro técnico de decisão humana;
- registrar quando o crítico foi acionado;
- registrar quando houve override humano.

---

## 12. Tratamento de falhas

Toda saída de LLM deve ser validada com Pydantic.

Se a saída for inválida:

```text
registrar erro
marcar comentário como waiting_human_review
não aprovar automaticamente
usar fallback seguro
```

Tipos de falhas previstas:

- erro de API do modelo;
- timeout;
- JSON malformado;
- saída incompatível com schema;
- regra de moderação não encontrada;
- confiança insuficiente;
- exceção inesperada em nó do grafo.

Regra principal:

> Na dúvida, escalar para humano.

---

## 13. Frontend MVP

### 13.1 Home

Página pública explicando o projeto.

Deve destacar:

- LangGraph;
- Human-in-the-Loop;
- RAG em diretrizes;
- agente crítico;
- avaliação;
- auditoria.

---

### 13.2 Login Admin

Reaproveitar fluxo do SmartDocs AI:

- login admin;
- cookie HttpOnly;
- rota protegida;
- logout.

---

### 13.3 Dashboard Admin

Listagem de comentários com status:

```text
pendente
em análise
aguardando revisão
aprovado
removido
edição solicitada
falhou
```

---

### 13.4 Tela de revisão

Deve exibir:

```text
comentário original
autor
curso/aula
rota escolhida
nível de risco
categoria
confiança
regra relacionada
sugestão da IA
justificativa da IA
observação do crítico
botões de decisão humana
```

Ações:

```text
aprovar
remover
solicitar edição
editar justificativa
pedir nova análise
```

---

### 13.5 Histórico/Auditoria

Pode ser simples na V1.

Exibir:

```text
decisão final
decisão sugerida pela IA
se a IA acertou ou não
tempo de análise
etapas executadas
```

---

## 14. Escopo da V1

A V1 deve focar em profundidade, não em quantidade.

### Obrigatório na V1

- FastAPI;
- Next.js;
- PostgreSQL;
- login admin;
- cadastro/listagem de comentários;
- grafo LangGraph com roteamento condicional;
- análise de risco estruturada;
- diretrizes estruturadas;
- agente crítico para baixa confiança;
- revisão humana;
- decisão final persistida;
- feedback humano salvo;
- logs das etapas do grafo;
- README explicando a arquitetura.

### Não obrigatório na V1

- deploy imediato;
- worker assíncrono;
- Langfuse;
- LangSmith;
- MCP;
- A2A;
- AG-UI;
- scraping;
- fine-tuning;
- modelos locais;
- dashboard analítico avançado.

---

## 15. Critérios de qualidade

O projeto deve conseguir responder claramente:

1. Por que LangGraph foi usado?
2. Onde existem ramificações reais?
3. Quando o agente crítico é acionado?
4. Como o humano intervém no fluxo?
5. Como as decisões humanas são salvas?
6. Como o sistema mede qualidade?
7. Como o sistema se comporta em falhas?
8. Como as diretrizes fundamentam a recomendação?
9. Como o projeto evita que a IA tome decisões finais sem revisão?
10. Como o feedback humano pode melhorar versões futuras?

---

## 16. Ordem de desenvolvimento recomendada

### Fase 1 — Fundação

- Criar repositório ou base a partir do SmartDocs AI.
- Remover partes específicas de PDF.
- Manter layout, auth, banco, Docker e migrations.
- Criar schemas e tabelas de moderação.
- Criar seed de diretrizes e comentários de exemplo.
- Criar `docs/development-runbook.md`.

---

### Fase 2 — Grafo

- Criar `AgentState` com Pydantic.
- Implementar `input_guard`.
- Implementar `intent_router`.
- Implementar caminhos condicionais.
- Implementar `guideline_retriever`.
- Implementar `risk_analyzer`.
- Implementar `confidence_gate`.
- Implementar `critic_agent`.
- Implementar `decision_builder`.
- Registrar steps no banco.

---

### Fase 3 — Human-in-the-Loop

- Criar endpoints para revisão humana.
- Criar tela de revisão.
- Permitir aprovar, remover, solicitar edição e editar justificativa.
- Permitir pedir nova análise.
- Salvar decisão final.
- Salvar feedback example.

---

### Fase 4 — Avaliação

- Criar dataset inicial com 50 comentários.
- Criar script de avaliação.
- Gerar métricas básicas.
- Documentar resultados no README.

---

### Fase 5 — Produto

- Melhorar UI.
- Adicionar auditoria visual.
- Adicionar página pública explicando arquitetura.
- Preparar deploy.
- Criar documentação final.

---

## 17. Decisões arquiteturais iniciais

### Decisão 1 — Não implementar tudo de forma rasa

Priorizar profundidade em poucos recursos:

- grafo real;
- HITL real;
- critic agent;
- logs;
- avaliação.

### Decisão 2 — A IA não decide sozinha na V1

Toda recomendação deve passar pelo moderador.

### Decisão 3 — Feedback humano é dado operacional

Correções humanas devem ser armazenadas para avaliação e melhoria futura.

### Decisão 4 — O projeto deve ser defensável tecnicamente

Evitar criar “agentes” artificiais quando uma função simples resolveria.

Cada agente ou nó deve ter responsabilidade clara e justificar sua existência.

---

## 18. Documentação esperada

Arquivos sugeridos:

```text
README.md
docs/development-runbook.md
docs/architecture.md
docs/evaluation.md
docs/decisions.md
```

O README deve explicar:

- objetivo;
- arquitetura;
- grafo;
- principais decisões;
- como rodar localmente;
- como executar avaliação;
- como o HITL funciona;
- limitações conhecidas;
- próximos passos.

---

## 19. Próximos passos imediatos

1. Criar novo repositório `moderation-flow-ai`.
2. Copiar a estrutura base do SmartDocs AI.
3. Remover funcionalidades específicas de PDF.
4. Renomear aplicação para ModerationFlow AI.
5. Criar este runbook em `docs/development-runbook.md`.
6. Subir backend e frontend localmente.
7. Criar migrations iniciais do schema `moderation`.
8. Criar seeds de diretrizes e comentários.
9. Iniciar implementação do grafo LangGraph.

---

## 20. Resumo executivo

O ModerationFlow AI deve ser apresentado como:

> Uma aplicação full stack de moderação assistida por IA para plataformas de cursos online, usando LangGraph para orquestrar um grafo decisório com roteamento condicional, recuperação de diretrizes, análise de risco, agente crítico para casos ambíguos, revisão humana obrigatória, auditoria e feedback humano para avaliação e melhoria contínua.

Este projeto complementa o SmartDocs AI:

```text
SmartDocs AI:
RAG em produção para consulta inteligente de documentos.

ModerationFlow AI:
Grafo multiagente com decisão condicional, Human-in-the-Loop, avaliação e governança.
```
