## Spec: 014 -- Evaluation Dataset Hardening

## Objetivo

Fortalecer a avaliacao do baseline heuristico, expandindo o dataset com casos mais dificeis, menos curados e mais proximos de uso real.

## Contexto

A etapa 013 melhorou o baseline no dataset inicial e chegou a 100% nas metricas principais. Esse resultado e util como comparacao interna, mas ainda existe risco de overfitting porque o conjunto atual e pequeno e favoravel as heuristicas existentes.

Nesta etapa, o foco nao e ajustar o grafo para perseguir perfeicao. O foco e aumentar a dificuldade do dataset e medir melhor a generalizacao do baseline atual.

## Risco de overfitting

Os principais sinais de risco nesta fase sao:

- dataset pequeno;
- exemplos muito alinhados as keywords do grafo;
- baixa cobertura de typos, variacoes informais e casos limítrofes;
- pouca presenca de sarcasmo, spam menos obvio e critica agressiva sem ofensa clara.

## Escopo

Esta etapa inclui:

- criar a spec 014;
- expandir `backend/app/evaluation/datasets/moderation_eval.json`;
- aumentar o dataset para pelo menos 70 exemplos;
- adicionar casos dificeis, ambiguos e limitrofes;
- adicionar variacoes com erros de digitacao;
- adicionar sarcasmo;
- adicionar criticas negativas legitimas;
- adicionar elogios com ressalvas;
- adicionar spam menos obvio;
- adicionar ofensas indiretas;
- adicionar pedidos de suporte com irritacao;
- adicionar casos de discriminacao implicita;
- adicionar casos de conteudo perigoso ou ilegal em nivel moderado;
- rodar novamente o evaluation runner;
- documentar as metricas em `docs/evaluation.md`.

## Fora de escopo

- alterar heuristicas para perseguir 100%;
- adicionar LLM;
- adicionar embeddings;
- adicionar `pgvector`;
- alterar frontend;
- alterar backend API;
- alterar banco;
- criar migrations;
- criar dashboard.

## Estrategia de expansao do dataset

O dataset deve continuar no mesmo formato JSON atual e manter exemplos curados o suficiente para validacao, mas com distribuicao mais realista:

- combinar exemplos faceis e dificeis;
- variar tom, estrutura e grau de ambiguidade;
- adicionar frases com menor aderencia literal as heuristicas atuais;
- incluir alguns casos que o baseline provavelmente errara, desde que os labels facam sentido.

## Tipos de casos adicionados

- criticas legitimas negativas;
- criticas agressivas, mas nao removiveis;
- ofensas indiretas;
- sarcasmo e ambiguidade;
- suporte com irritacao;
- spam menos obvio;
- discriminacao implicita ou problematica;
- conteudo perigoso ou ilegal;
- erros de digitacao e linguagem informal;
- elogios com ressalvas.

## Regras de implementacao

- nao editar labels apenas para manter 100%;
- nao ajustar heuristicas nesta etapa, exceto se surgir erro grotesco causado apenas por typo simples;
- manter a avaliacao em memoria;
- manter o runner simples;
- documentar a queda de metricas normalmente, se ela acontecer.

## Criterios de aceite

- spec criada;
- dataset possui pelo menos 70 exemplos;
- novos exemplos cobrem casos dificeis;
- runner continua executando sem erro;
- avaliacao continua em memoria;
- metricas sao documentadas em `docs/evaluation.md`;
- nenhum frontend e alterado;
- nenhum LLM e adicionado;
- nenhuma migration e criada;
- nenhum endpoint e alterado;
- `failed_runs = 0`.

## Validacao

```bash
docker compose exec backend python -m compileall app
docker compose exec backend python scripts/evaluate_moderation.py
```

## Documentacao das metricas

Atualizar:

```text
docs/evaluation.md
```

Adicionar uma secao dedicada a etapa 014 com:

- objetivo;
- mudancas no dataset;
- metricas apos expansao;
- observacoes sobre queda de metricas e principais tipos de erro.
