---
adr: 0005
title: npm workspaces, TypeScript e Vitest como ambiente de desenvolvimento
status: accepted
date: 2026-09-05
deciders: Fabio Badaro, Claude
tags: toolchain, ambiente, testes
supersedes: —
superseded-by: —
---

# ADR-0005 — npm workspaces, TypeScript e Vitest como ambiente de desenvolvimento

> **Bundler decidido em 2026-10-20.** O bundler que este ADR deixou "para outro ADR" é o Vite (`ADR-0015`), e entra só na aplicação. O `tsc` segue como está, para checar tipos e construir as bibliotecas sem impor bundle a quem as consome. Uma consequência dele volta para cá: o Vitest precisa sair da linha 2.1 para acompanhar o Vite 8.

> **Linter, em parte, desde 2026-10-22 (`ADR-0019`).** Existe ESLint, e só na aplicação (`apps/playground`, `npm run lint`): as regras de hooks do React, das quais o React Compiler depende, e a fronteira do Base UI que o `ADR-0014` pôs na *Reversão* dele. Os pacotes de `packages/` seguem sem linter. Isso não contraria o argumento deste ADR, ele o aplica: na aplicação, as duas regras tinham motivo concreto antes da primeira linha; nos pacotes, ninguém ainda propôs uma regra com motivo, e a fronteira que importa ali é garantida pelo grafo de dependências.

## Contexto

A `HEALTH.md` §9.2 marca **R6.6** (ambiente de desenvolvimento) em 2 de 10: *"Só existe o `health_check.py`, que afere spec e não constrói nada. Sem build, sem lint, sem test runner, sem instrução de setup."* O `ADR-0004` decidiu a forma do repositório; falta o que a executa.

Três coisas já estão fixadas e restringem a escolha:

- **TypeScript não é decisão em aberto.** O `AST_SCHEMA.md` é literalmente um arquivo de interfaces TypeScript, e é o contrato normativo entre parser, validador e visualizador. Qualquer outra linguagem exigiria traduzir o contrato e mantê-lo em sincronia — o problema que o `ADR-0004` acabou de eliminar em outro eixo.
- **O `ADR-0002` escolheu Chevrotain**, que é biblioteca de runtime em TS, sem codegen. Nenhuma etapa de build especial é necessária.
- **O harness já tem contrato.** O `TEST_SUITE.md` §3 traz o pseudocódigo do executor: para cada caso, `parseAndValidate(input)` e `deepEqual` do array de diagnósticos inteiro contra o `expected.json`, com a ordem sendo normativa. O runner precisa de `deepEqual` estrutural e de leitura de arquivo — nada exótico.

## Decisão

**npm workspaces + TypeScript + Vitest.**

- **npm workspaces**, não pnpm nem yarn: já vem com o Node instalado, não exige que ninguém instale um gerenciador antes de contribuir, e o repo tem três pacotes — nenhuma das dores que justificam pnpm (centenas de pacotes, disco, hoisting) existe aqui. O `PRD.md` vende "zero installation" para o usuário; vale perseguir o análogo para quem contribui.
- **Vitest**, não Jest: roda TypeScript sem etapa de transpilação configurada à mão, tem `toEqual` estrutural, e o modo watch é rápido o bastante para o ciclo de reconciliar 44 golden files, que é o trabalho imediato — o débito **D-001**. Vitest também já estava no `node_modules` da tentativa de agosto, o que não é argumento, mas confirma que foi o caminho natural para quem olhou o problema antes.
- **`tsc` para checagem de tipos e build de biblioteca.** Sem bundler no core: um pacote publicável não deve impor bundle a quem o consome. O bundler entra quando o `@odds/playground` existir, e é decisão de outro ADR.

Sem linter neste passe. Ele é ausência real e fica registrada — mas escolher regras de lint antes de existir código sobre o qual discutir seria decidir no vazio.

## Alternativas consideradas

### pnpm workspaces

Rejeitada por custo de entrada, não por qualidade — pnpm é melhor em quase tudo que mede. Com três pacotes, o ganho é imperceptível e o custo é exigir uma instalação global antes do primeiro `npm test`. Reabre se o número de pacotes crescer ou se o hoisting do npm causar problema real, e a troca é barata (um `pnpm-workspace.yaml` e o lockfile).

### Jest

Rejeitada. Exige configuração de transformação para TypeScript (`ts-jest` ou Babel) que Vitest dispensa, e é mais lento no ciclo watch. A única vantagem relevante seria maturidade de ecossistema, que não pesa numa suíte que só precisa de `deepEqual` e leitura de arquivo.

### `node --test` (test runner nativo)

Rejeitada, e foi a alternativa mais tentadora pelo mesmo argumento do npm: zero dependências. Cai por dois motivos concretos — exigiria resolver TypeScript por fora (loader ou build antes de testar), e não tem watch com a ergonomia que o trabalho de reconciliar spans vai exigir, que é editar, ver 44 casos correrem, repetir. Vale reconsiderar quando o suporte a TS no Node estabilizar.

### Deno ou Bun

Rejeitadas. Resolveriam TypeScript e teste de uma vez, mas o alvo do produto é o navegador via ecossistema npm, e adotar um runtime alternativo acrescenta uma variável de compatibilidade a um projeto que ainda não escreveu a primeira linha.

## Consequências

**O que melhora.** `npm install && npm test` passa a ser a instrução de setup completa, sem pré-requisito além do Node. A `HEALTH.md` §9.2 **R6.6** deixa de ser 2 de 10, e o harness do `TEST_SUITE.md` §3 sai de pseudocódigo — o que também move **R6.3**.

**O que piora.** Sem linter, convenções de estilo ficam por conta de revisão até que isso mude. E o `tsc` sem bundler significa que consumidores do `@odds/core` recebem ESM e resolvem o empacotamento por conta própria — correto para biblioteca, mas é uma escolha que alguém pode estranhar.

**O que não muda.** O `health_check.py` continua em Python, stdlib pura, sem dependência — ele afere spec, não código, e não deve passar a exigir Node para rodar.

## Reversão

**O sinal** para trocar de gerenciador é hoisting do npm causando bug real de resolução, ou o número de pacotes crescendo além de meia dúzia. Para trocar de runner, é a suíte ficando lenta a ponto de o ciclo de reconciliação incomodar.

**O custo da volta é o mais baixo do razão até aqui.** Trocar npm por pnpm é um arquivo de workspace e um lockfile. Trocar Vitest por Jest é configuração mais uma passada de renomear imports de teste; a API de asserção que a suíte usa (`toEqual`) é praticamente idêntica. Nenhuma das duas toca uma linha de lógica do parser ou do validador.

**O que protege a reversão:** o harness conversa com o core por uma função só — `parseAndValidate(input)`, do `TEST_SUITE.md` §3. Enquanto essa fronteira existir, o runner é intercambiável por construção.
