---
adr: 0001
title: Decisões passam a ser registradas em ADRs numerados e mecanicamente conferidos
status: accepted
date: 2026-09-05
deciders: Fabio Badaro, Claude
tags: processo, governança, rastreabilidade
supersedes: —
superseded-by: —
---

# ADR-0001 — Decisões passam a ser registradas em ADRs numerados e mecanicamente conferidos

## Contexto

O repositório tinha, até aqui, dois registros de decisão — e os dois estavam **fechados**.

O `GRILLING.md` guarda o *porquê* de D1–D25, com as alternativas rejeitadas de cada uma. O `PROPAGATION-MAP.md` guarda o *onde*: para qual artefato e seção cada decisão foi. Juntos cobrem bem uma sessão de revisão que aconteceu e terminou em 2026-08-14. Nenhum dos dois aceita linha nova: `D1–D25` é explicitamente um conjunto fechado, e o `GRILLING.md` foi deliberadamente **não** reescrito após a propagação, para preservar o que se pensava no momento da decisão.

O resultado é que uma decisão tomada hoje não tinha endereço. A rubrica do `HEALTH.md` §9.1 já cobrava isso em **R3.6** — 7 de 10, com a evidência dizendo literalmente que `docs/adr/` estava vazio — e a §4 penaliza em −3 "decisão de design tomada sem registro do porquê". O catálogo de bonificações §3 já citava ADR em duas linhas (`+6` para stack registrada em ADR, `+3` para regra ancorada em ADR), ou seja: o vocabulário existia, o lugar não.

A pressão ficou concreta no momento desta decisão. O projeto está prestes a sair de ~350 KB de especificação para o primeiro código, e a próxima rodada é uma sequência densa de escolhas irreversíveis-na-prática: abordagem de parser, estrutura de repositório, test runner, biblioteca de layout de diagrama. São exatamente as decisões cujo *porquê* alguém vai querer daqui a seis meses, e exatamente as que, sem registro, viram folclore — "acho que foi por causa dos spans".

Havia ainda uma restrição de forma. O `docs/agents/domain.md` já **espera** `docs/adr/` e instrui as skills a lerem ADRs antes de explorar o código, e a mandar sinalizar quando uma proposta contradiz um ADR existente. O contrato de leitura já estava escrito; faltava o de escrita.

## Decisão

Toda decisão tomada a partir desta data mora em `docs/adr/`, um arquivo por decisão, numerado sequencialmente e imutável quanto ao que decidiu.

O mecanismo tem três partes, e as três são necessárias porque cada uma resolve um problema diferente:

1. **Um lugar e um formato** — `docs/adr/NNNN-slug.md`, frontmatter tipado (`adr`, `title`, `status`, `date`, `deciders`, `tags`, `supersedes`, `superseded-by`) e cinco seções obrigatórias: *Contexto*, *Decisão*, *Alternativas consideradas*, *Consequências*, *Reversão*. Um índice em `docs/adr/README.md`.
2. **Um gerador e uma skill** — `new_adr.py` faz o que é mecânico (aloca número, escreve o esqueleto, mantém o índice, liga o par ao substituir). A skill `adr` faz o que exige julgamento: o teste de três perguntas que decide se algo merece ADR, e o que dá errado em cada seção.
3. **Uma checagem determinística** — **C16** no `health_check.py`, integrada à mesma aferição que já governa o resto do repositório.

Duas escolhas dentro da decisão merecem ser nomeadas, porque não eram óbvias:

**A seção *Reversão* é obrigatória.** O motivo declarado para o mecanismo foi "reverter algo se necessário", e um formato ADR convencional não guarda isso — guarda a decisão, não a rota de volta. Exigir que quem decide escreva o sinal que indicaria erro, o custo estimado da volta e o que já foi construído em cima é o que transforma o razão de arquivo morto em ferramenta de reversão. É também um freio útil no momento de decidir: quem não consegue descrever a volta talvez não tenha entendido a ida.

**A escrita é autônoma e não pergunta.** O `CLAUDE.md` ganha uma cláusula permanente autorizando registrar sem consultar. Um mecanismo de registro que exige aprovação por decisão tem atrito, e mecanismo com atrito não é usado — é assim que registro de decisão morre em todo projeto que já tentou.

## Alternativas consideradas

### Continuar acrescentando ao `GRILLING.md`

Rejeitada, e é a alternativa mais tentadora porque o arquivo já existe e já é bom no que faz. Três problemas: (1) ele é registro histórico de uma sessão específica, e acrescentar decisões de 2026-09 a uma tabela de 2026-08 apaga a distinção entre "revisado naquela rodada" e "decidido depois"; (2) já tem 140 KB — uma decisão nova entraria onde ninguém acha; (3) o próprio `CLAUDE.md` instrui a não lê-lo como lista de pendências, e engordá-lo com decisões vivas quebraria essa instrução. A rubrica R3.6 desconta ponto exatamente por ele ser "um documento histórico único de 138 KB".

### Um hook em vez de skill

Rejeitada como mecanismo **principal**, e vale registrar o porquê porque foi explicitamente proposta. Hooks disparam em eventos de ferramenta — `PreToolUse`, `PostToolUse`, `Stop`. "Uma decisão de arquitetura acabou de ser tomada" não é um evento de ferramenta: não há edição de arquivo, comando ou padrão de texto que o identifique. Um hook de `Stop` que lembrasse "escreveu ADR?" a cada turno seria ruído em 95% dos casos e treinaria a ignorá-lo — pior do que não ter.

O que é determinístico não é *quando decidir*, e sim *se o razão está íntegro* — e isso virou a C16, que roda no mesmo `health_check.py` que já é o portão do repositório. Judgment na skill, determinismo na checagem. Um hook não faz bem nenhum dos dois.

### Só a skill, sem checagem mecânica

Rejeitada por precedente do próprio repositório. O `HEALTH.md` §4 penaliza em −5 "nota ajustada sem evento tipado", e a §8 existe porque disciplina puramente humana já falhou aqui de forma documentada (os números não reconferidos da v0.2.1, as linhas do histórico fora de ordem cronológica). Não havia razão para o critério ser mais frouxo com o razão de decisões do que com o placar de saúde. Um razão de ADRs apodrece de três formas silenciosas — número reusado, par `supersedes`/`superseded-by` ligado só de um lado, índice que para de bater com os arquivos — e nenhuma se anuncia na leitura.

### ADRs bilíngues, como `RULES-EN`/`RULES-PT`

Rejeitada. O par bilíngue custa caro e existe porque as regras da linguagem são o produto, consumido por quem escreve `.odds` em dois idiomas. ADR é artefato interno de governança, como o `HEALTH.md` e as skills — todos em português, sem contraparte. Duplicar cada ADR dobraria o custo de escrever e criaria uma classe nova de deriva (as duas versões discordando) para um leitor que não existe. Se um dia o projeto tiver contribuidores que não leem português, isto é o que se reabre — está na *Reversão*.

### Um ADR retroativo por decisão do `GRILLING.md`

Rejeitada. Seriam 25 ADRs escritos a partir de um registro que já os cobre melhor do que a reconstrução conseguiria, e o `PROPAGATION-MAP.md` já resolve o problema de alcance (achar onde D-N foi parar). Reescrever histórico como se tivesse sido decidido sob um processo que não existia na época é a definição de razão falsificado. A fronteira é a data: D1–D25 no `GRILLING.md`, tudo a partir daqui em `docs/adr/`.

## Consequências

**O que melhora.** Decisão nova tem endereço, número e data. O `docs/agents/domain.md`, que já mandava as skills lerem ADRs e sinalizarem contradições, passa a ter o que ler. A rubrica R3.6 do `HEALTH.md` §9.1 sobe de 7 para 9 — a evidência que a descontava ("`docs/adr/` está vazio") deixou de ser verdade. E a próxima rodada, que é a de código, começa com o lugar certo para as escolhas de stack já pronto.

**O que piora, e é o preço real.** Todo passe de decisão fica mais caro: escrever *Alternativas consideradas* e *Reversão* com honestidade leva mais tempo do que decidir. Há risco de dois modos de falha opostos — inflação (ADR para trivialidade, até ninguém ler o razão) e omissão (decisão tomada em silêncio porque escrever dá trabalho). O teste de três perguntas da skill mira o primeiro; a cláusula de escrita autônoma do `CLAUDE.md`, o segundo. Nenhum dos dois é garantia.

**Uma dívida nova, assumida.** A C16 confere a *integridade* do razão — numeração, pares recíprocos, seções presentes, índice, citações que resolvem. Ela **não** confere que uma decisão que foi tomada tenha virado ADR, porque isso não é mecanizável: não existe varredura que detecte a ausência de um registro que nunca foi escrito. Essa parte continua sendo julgamento, e é a lacuna conhecida deste mecanismo. Nomeá-la aqui é preferível a fingir cobertura total.

**O que não muda.** `GRILLING.md` e `PROPAGATION-MAP.md` seguem fechados e intocados. `CHANGELOG.md` continua registrando *o que* mudou e `HEALTH.md` *o que aquilo fez com o modelo* — ADR responde a uma terceira pergunta, *por quê*, e não substitui nenhum dos dois. Um passe pode perfeitamente ter ADR sem entrada no `CHANGELOG` (decidir não é mudar artefato) e o contrário também.

## Reversão

**O sinal de que isto foi um erro** seria o razão parar de ser lido: ADRs escritos e nunca citados numa discussão, ou — o sintoma mais claro — decisões reais sendo tomadas fora dele enquanto o diretório acumula registros de trivialidades. O indicador mais barato é a proporção: se a maioria dos ADRs falha o teste de três perguntas da skill em releitura, o mecanismo virou cerimônia.

**O custo da volta é baixo, e de propósito.** O que existe é um diretório de Markdown, um script de ~90 linhas, uma skill e uma checagem. Desfazer é apagar a C16 do `health_check.py` (e a linha correspondente em `HEALTH.md` §8, senão a C13 falha), remover a cláusula do `CLAUDE.md` e devolver R3.6 a 7 na rubrica de `HEALTH.md` §9.1. Os ADRs escritos até ali continuam legíveis como prosa — nada depende deles em tempo de execução. **Nenhum artefato normativo da linguagem passa a depender deste mecanismo**, e essa foi uma escolha consciente: o razão observa o projeto, o projeto não observa o razão.

**O que já foi construído em cima** é, por ora, apenas este ADR. Quanto mais decisões forem registradas aqui, mais caro fica reverter — não pelo mecanismo, mas porque o conteúdo passa a ser a única cópia do *porquê*. A partir de ~10 ADRs, reverter significa escolher um novo lar para eles, não descartá-los.

**Reversão parcial, mais provável que a total.** Se o custo doer, o que se afrouxa primeiro é a obrigatoriedade das cinco seções (deixando *Contexto*, *Decisão* e *Alternativas* como mínimo, e *Reversão* só para decisões caras). Isso é um ADR novo com `--supersedes 0001`, não uma edição deste.
