---
adr: 0025
title: A interface é feita direto na aplicação, e um passe fecha com testes verdes e ADR só para arquitetura, stack ou linguagem
status: accepted
date: 2026-10-27
supersedes: 0001, 0017, 0020, 0021, 0023
---

# ADR-0025 — A interface é feita direto na aplicação, e um passe fecha com testes verdes e ADR só para arquitetura, stack ou linguagem

## Contexto

A bancada (docs/design, 32 arquivos, 2,66 MB) existia para validar uma ideia de interface antes de a aplicação construí-la, e um teste de paridade cobrava o porte. Com as 17 funcionalidades portadas e a lista de pendências vazia, ela só duplicava a aplicação. Ao redor da especificação, o processo tinha crescido mais que o produto: um placar de saúde com rubricas, débitos e histórico (HEALTH.md, 52 KB), uma versão editorial por documento, um `CHANGELOG.md` de 94 KB que repetia o git, e 24 ADRs de cinco seções obrigatórias, vários já encerrados ou substituídos. Cada sessão de agente pagava em tokens para ler e manter esse peso (issue #17).

## Decisão

A interface passa a ser feita direto em `apps/playground`, e a bancada sai com o teste de paridade, as skills e a regra que a serviam.

Um passe fecha com `npm test`, `typecheck`, `lint` (se tocou a aplicação) e `check:spec` (se tocou a especificação) verdes. Se o passe mudou o que um `.odds` significa, ele também acrescenta uma entrada curta em *ODDS Language Version*, a única seção do `CHANGELOG.md`. Saem o HEALTH.md, o placar e as versões editoriais por documento. As checagens mecânicas da especificação ficam, em `scripts/check_spec.py`.

ADR fica raro e curto: só para arquitetura, stack ou linguagem, com uma página no máximo e três seções obrigatórias (*Contexto*, *Decisão*, *Alternativas consideradas*). O resto vai na mensagem de commit. Um ADR substituído ou encerrado sai da árvore e fica no git, e a numeração guarda o buraco.

O argumento que venceu é que o git já registra o que mudou e quando. O que a árvore precisa carregar é o que vale hoje.

## Alternativas consideradas

### Manter a bancada como lugar de experimento

Ela custava um build próprio, um contrato de paridade e uma segunda cópia de cada comportamento. Uma ideia nova cabe numa branch da aplicação, que já roda com dados reais.

### Manter o HEALTH.md sem o placar

As checagens são o que pegava erro de verdade, e elas ficam. As rubricas, os débitos e o histórico eram julgamento anotado, e ninguém decidia nada a partir deles.

### Manter ADRs substituídos como registro, com o par `supersedes`/`superseded-by`

Um ADR substituído na árvore é lido como se valesse, que é o problema que já tirou os registros fechados daqui. No git ele segue inteiro e endereçável por commit.

## Consequências

- Chegar ao porquê de uma decisão substituída exige `git log -- docs/adr/` e um `git show`.
- Nada confere mecanicamente que um passe que mudou o significado de um `.odds` registrou a versão. Isso fica com quem revisa o passe.
- Uma ideia de interface deixa de ter um lugar para ser comparada lado a lado antes de entrar. Se isso fizer falta, uma página descartável numa branch resolve sem voltar ao contrato.
