---
adr: 0023
title: Registros fechados saem da árvore de trabalho e passam a viver no histórico do git
status: accepted
date: 2026-10-24
deciders: Fabio Badaro, Claude
tags: processo, registro, agentes, health
supersedes: —
superseded-by: —
---

# ADR-0023 — Registros fechados saem da árvore de trabalho e passam a viver no histórico do git

## Contexto

O `GRILLING.md` (873 linhas, 140 KB, o maior arquivo do repositório) registrava a revisão de desenho que produziu as decisões D1–D25. Elas foram propagadas aos artefatos em 2026-08-14, e o arquivo foi mantido sem reescrita de propósito. Por isso ele fala um vocabulário que a linguagem abandonou depois: precisou de um glossário de termos superados (débito D-006), de uma checagem para cobrar esse glossário (C15) e de uma isenção na varredura de termo morto (C7). O `PROPAGATION-MAP.md` (16 KB) era a auditoria de que cada decisão chegou ao seu artefato. Ele fechou o débito D-004 em 2026-08-24 e era mantido honesto pela C14 contra renumeração de seção nos documentos vivos. Os dois eram conjuntos fechados, e desde 2026-09-05 decisão nova vai para `docs/adr/` (`ADR-0001`).

O `docs/superpowers/` guardava duas specs e dois planos (~117 KB) do fluxo de brainstorm → plano que construiu a aplicação e a paridade com a bancada. Os dois trabalhos foram executados e entraram em `main` no #8 (`e282c83`), e as decisões que eles carregavam estão nos `ADR-0014` a `ADR-0021`.

Na bancada, as colmeias v1 a v4 (`docs/design/pages/colmeia-v1.html` a `colmeia-v4.html`, mais os dois `check.mjs`) eram registros congelados das rodadas que levaram ao `@odds/layout`. A v4 ainda era código em uso: o `packages/layout/test/differential.test.ts` a carregava num `new Function` para comparar o desenho portado com o dela em mais de 60 estados por modelo, e três scripts a liam (a captura dos goldens e os builds da `colmeia-50` e da `colmeia-navegacao`).

Tudo isso morava na raiz ou em `docs/`, onde um agente que busca no repositório encontra o texto como se valesse. Um `grep` pelo nome de uma regra devolvia trechos do `GRILLING.md` com vocabulário morto, e os planos tinham listas `- [ ]` que se leem como trabalho pendente. Entre os documentos normativos, só o `AST_SCHEMA.md` citava o `GRILLING.md`, em duas frases, pelo número da decisão.

## Decisão

Os quatro conjuntos saem da árvore de trabalho e ficam no histórico do git, inteiros, no commit `e282c83`: `git show e282c83:GRILLING.md`, `git show e282c83:PROPAGATION-MAP.md` e `git show e282c83:docs/superpowers/plans/2026-10-22-paridade-bancada.md`. As checagens C14 e C15 saem junto com o que vigiavam, e a C16 ganha a lista `RETIRED`. Ela aceita que um ADR anterior à retirada cite o arquivo retirado, porque um ADR é imutável e cita o repositório como ele era, e recusa a citação num ADR posterior.

Na mesma passada, a pedido do autor, as colmeias v1 a v4 e os dois `check.mjs` também saem, porque foram validadas e o `@odds/layout` as substituiu. Antes de apagar a v4, o teste diferencial teve o resultado congelado: 540 estados, um hash por estado do SVG e do `viewBox` que a v4 escrevia, na chave `matrix` de seis goldens do pacote. Nesse dia, o porte batia com ela em todos os 540. A captura dos goldens (`packages/layout/scripts/capture-legacy.mjs`) e o adaptador copiado que só ela usava (`packages/layout/test/legacy-bench.mjs`) saem junto, porque só serviam para ler a v4. Saem também os builds da `colmeia-50` e da `colmeia-navegacao`, que liam a v4, e os dois módulos de dados que só eles liam (`colmeia-50.model.mjs` e `colmeia-navegacao.docs.mjs`). O marketplace de 50 contextos já estava copiado literalmente nas fixtures do pacote, que passam a ser a fonte, e as páginas que os builds geraram ficam como registro. A comparação de hoje é o `playground.html`: dele vieram os goldens `bench-*.json`, contra ele corre o teste de paridade da aplicação, e nenhum teste lê uma página congelada. Quem cita uma página apagada ganha a nota de que ela foi apagada depois de validada. Os ADRs que as citavam ganham uma nota de fechamento no topo, como a de cumprido do `ADR-0007`, e o status não muda: as decisões seguem em vigor.

Para o fluxo do superpowers daqui em diante: a spec e o plano de um trabalho são versionados na branch enquanto o trabalho anda e apagados no passe que a fecha, porque a decisão que eles carregam já está no ADR. A exceção do `.gitignore` para `docs/superpowers/specs/*-design.md` fica, para que eles possam entrar na branch.

O argumento que venceu é que **um registro fechado na árvore é lido como se valesse**. Ele aparece em busca, precisa de checagem para não apodrecer e de glossário para avisar que fala uma língua morta. No git ele continua inteiro e endereçável por commit, sem custo para quem não o procura.

## Alternativas consideradas

### Manter como estava

Eram ~280 KB dos ~990 KB de markdown do repositório, com duas checagens e uma isenção existindo só para mantê-los. O autor os apontou como mortos no pedido que abriu esta passada (issue #9).

### Mover para um diretório de arquivo (`docs/history/`)

Tira da raiz e não da busca. Continua aparecendo em listagem de arquivos e em `grep`, e continua exigindo a C14 e a C15, ou perde a verificação. Muda o problema de lugar.

### Reescrever D1–D25 como 25 ADRs retroativos

Já rejeitado pelo `ADR-0001`: a reconstrução sairia pior do que o registro que ela reconstrói.

### Manter só o `PROPAGATION-MAP.md`

É menor e auditável. Mas é evidência de um débito fechado: o valor dele estava na conferência feita no fechamento. Mantê-lo exige a C14 para sempre contra a renumeração das seções dos documentos vivos, que é manutenção contínua de um fato que não muda mais.

### Apagar todas as páginas congeladas da bancada e os canvases da landing

Só as colmeias v1 a v4 saem, porque foram as que o autor nomeou e são as que um pacote substituiu depois de ser conferido contra elas. As outras guardam rodadas que nenhum código absorveu (a landing, o herói, o mapa vivo) ou guardam o resultado de uma medida que os ADRs ainda citam (`colmeia-50`, `colmeia-navegacao`, `colmeia-ao-vivo`). O autor também guarda de propósito as variantes recusadas (`docs/design/README.md`, *As outras três continuam existindo*).

### Manter a v4 como oráculo do teste diferencial

Era o que ainda a prendia à árvore como código. Mas o oráculo não muda mais: a v4 está congelada desde 2026-10-21, e compará-la a cada execução é comparar contra uma constante. O hash guarda a mesma constante sem carregar ~1.200 linhas de ES5 num `new Function` a cada `npm test`.

### Apagar o teste diferencial junto com a v4

Perderia a única cobertura do `buildSvg` com seleção de contexto, de subdomínio e de diagnóstico, e com os rótulos `sub` e `dom`. Os goldens de SVG fixam só quatro estados.

## Consequências

- Saem ~280 KB da árvore. O aferidor passa a ter 14 checagens, e a numeração guarda o buraco de C14 e C15, como a dos débitos.
- **O que piora:** chegar ao porquê de D1–D25 exige um `git show`, e um clone raso (`--depth 1`) de um commit futuro não traz os arquivos. Pela interface web, eles seguem abertos na URL do commit.
- D-004 e D-006 seguem fechados (`HEALTH.md` §5): a condição de cada um foi verdade e está registrada no razão. O que sai é a evidência viva de um fato fechado, não o fato.
- O `CHANGELOG.md` mantém a seção do `PROPAGATION-MAP.md`, com a entrada da retirada, porque ele é o registro do que existiu.
- O `AST_SCHEMA.md` (v0.3.1) troca as duas citações por número de decisão pela regra que vive hoje na `RULES-EN.md` §4 e §5.
- Os `ADR-0001` e `ADR-0007` seguem citando os dois arquivos, e a C16 os aceita pela lista `RETIRED`.
- **O que piora, nas colmeias:** o hash diz que o SVG mudou, não onde. E uma mudança intencional no desenho passa a regravar a chave `matrix` sem oráculo externo: o SVG novo vira a referência, conferido a olho. Os números da `colmeia-50` e as garantias da `colmeia-navegacao` não podem mais ser medidos de novo sem trazer os builds e a v4 do git. As páginas ficam como registro do que eles mediram.
- Os ADRs `0008`, `0009`, `0010`, `0011`, `0012` e `0017` ganham a nota de fechamento. Os artefatos publicados das quatro colmeias seguem abertos pelos links do `docs/design/README.md`.

## Reversão

**O sinal de erro** é alguém precisar do porquê de uma decisão D com frequência suficiente para o `git show` virar atrito, ou uma regra reaberta sem que se encontrem as alternativas que o `GRILLING.md` tinha recusado por escrito.

**O custo da volta** é de minutos. `git checkout e282c83 -- GRILLING.md PROPAGATION-MAP.md` traz os arquivos, e as funções da C14 e da C15 saem do mesmo commit, do `health_check.py`. Depois disso basta tirar as duas entradas de `RETIRED`, devolver as duas linhas da §8 do `HEALTH.md` e restaurar a isenção da C7. Para as colmeias, `git checkout e282c83 -- docs/design/pages/colmeia-v{1,2,3,4}.html docs/design/pages/colmeia-v{3,4}.check.mjs docs/design/pages/colmeia-50.{build,model}.mjs docs/design/pages/colmeia-navegacao.{build,docs}.mjs packages/layout/scripts/capture-legacy.mjs packages/layout/test/legacy-bench.mjs packages/layout/test/differential.test.ts` traz as páginas, os builds, a captura e o teste que carregava a v4, sem tocar nas outras páginas.

**O que foi construído em cima:** a lista `RETIRED` da C16, a versão v0.7.0 do `HEALTH.md` e a chave `matrix` dos goldens do `@odds/layout`.
