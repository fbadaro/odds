---
adr: 0003
title: O `.odds` é fonte única: o diagrama nunca escreve de volta no texto
status: accepted
date: 2026-09-05
deciders: Fabio Badaro
tags: produto, parser, arquitetura
supersedes: —
---

# ADR-0003 — O .odds é fonte única: o diagrama nunca escreve de volta no texto

## Contexto

A direção declarada do produto — *"o `.odds` é uma DSL do que é renderizado em tela"* — é ambígua num ponto que decide a arquitetura do parser: **o diagrama alguma vez escreve de volta no texto?**

O `PRD.md` hoje é de mão única. Não há arrasto, edição visual nem manipulação do diagrama em lugar nenhum do documento, e a §5.5 declara, no contexto de migração de versão, que *"the application never rewrites the user's text"*, apoiada na premissa de que o texto é a fonte de verdade. Mas isso foi escrito sobre migração, não sobre edição visual — a disposição está lá, a decisão não estava.

**Por que precisava ser decidido antes da primeira linha de código.** Se o diagrama escreve de volta, o parser precisa de uma **árvore sintática lossless**: comentários, linhas em branco, ordem das chaves e indentação preservados, mais um impressor que reproduz o arquivo byte a byte. Sem isso, mover uma caixa reformata o arquivo inteiro de alguém — e um `.odds` é, pelo `PRD.md`, o artefato que a pessoa cola num pull request. Lossless é decisão de arquitetura, não feature: retrofitar significa reescrever o parser.

O repositório já está parcialmente nesse caminho por outro motivo: comentários **não** são universalmente descartáveis, porque `odds-disable-next-line` precisa sobreviver até o validador (`GRAMMAR.md` §2). O lexer já não pode jogar trivia fora.

## Decisão

**O texto é a fonte única. O fluxo é de mão única: `.odds` → diagrama, e nunca o inverso.**

O diagrama é uma projeção do texto, não uma segunda representação editável do mesmo modelo. Não há edição visual, e o aplicativo não escreve no arquivo do usuário sob nenhuma circunstância.

O argumento que venceu é que o `PRD.md` já se comporta assim inteiro — a premissa de que o texto é a fonte de verdade sustenta a recusa de migração automática, o payload da URL e o próprio posicionamento de "o artefato que você cola num PR". Adotar round-trip não seria acrescentar uma feature: seria mudar o que o produto é, e essa mudança não foi feita. Formalizar a mão única fecha a ambiguidade **antes** que ela custe caro, em vez de deixá-la ser resolvida por acidente pela primeira implementação.

Consequência direta na implementação: **o parser não precisa de árvore lossless.** Preserva trivia apenas o suficiente para a diretiva de supressão sobreviver — o que já era requisito, e que o `ADR-0002` resolve com um token group próprio no Chevrotain.

## Alternativas consideradas

### Árvore lossless desde o primeiro dia

Rejeitada. Pagaria agora — ~15% a mais no lexer e no parser, mais restrições de desenho na forma da árvore — por uma decisão de produto que **não foi tomada**. Construir a capacidade antes de querer a feature é a forma mais educada de escolher errado: a arquitetura fica moldada por um requisito hipotético, e o custo é cobrado em toda mudança seguinte, não só uma vez.

### Lossless "por precaução", sem decidir o produto

Rejeitada, e era a saída aparentemente prudente. O problema é que ela não decide nada: mantém a ambiguidade viva, paga o custo do round-trip sem ganhar a feature, e cria a expectativa de que edição visual está a caminho. Uma porta aberta que ninguém decidiu atravessar acaba orientando decisões seguintes sem nunca ter sido discutida.

Preferimos decidir **não**, registrar o custo da volta com precisão, e reabrir com um ADR se o produto mudar de ideia. É mais barato reverter uma decisão explícita do que desfazer uma indefinição.

### Edição visual bidirecional

Rejeitada agora, não em princípio. É a alternativa mais valiosa das três — manipular o diagrama direto é o que muita gente espera de um playground. Mas exige a árvore lossless, um impressor fiel, e respostas para perguntas que ninguém fez ainda: o que acontece com um arquivo que tem erro de sintaxe enquanto se arrasta uma caixa; onde uma relação nova é inserida no texto; o que acontece com a formatação de quem escreve `.odds` à mão e usa o playground só para visualizar.

## Consequências

**O que melhora.** O parser fica mais simples e a arquitetura, mais barata. O `.odds` continua sendo texto que a pessoa é dona — nada edita o arquivo dela pelas costas, o que é coerente com a recusa de migração automática do `PRD.md` §5.5. E a ambiguidade que existia na direção do produto está fechada, por escrito.

**O que piora, e é preço de verdade.** Edição visual fica fora até que este ADR seja substituído. Quem esperar arrastar caixas não vai poder, e essa é uma expectativa comum sobre a palavra "playground" — vale dizer isso na interface, em vez de deixar a pessoa procurar o que não existe.

**O que não muda.** A diretiva de supressão continua sobrevivendo ao lexer. O `AST_SCHEMA.md` §1.3 continua sendo o contrato. Nada nas seis fases de validação depende desta decisão.

## Reversão

**O sinal seria querer edição visual** — de forma explícita, como decisão de produto, e não como "seria legal se". O indicador mais honesto é usuários pedindo, ou uma comparação com concorrente em que a ausência doa de verdade.

**O custo da volta é o mais alto entre os ADRs até aqui, e vale ser claro sobre isso:** exige forma nova de árvore (trivia ancorada nos nós, não coletada à parte), um impressor fiel, e uma política de escrita — o que acontece com arquivo em estado inválido, onde construto novo é inserido, como a formatação de quem escreve à mão é respeitada. Isso é reescrita do parser, não extensão.

**Uma mitigação que já existe, por acidente feliz.** O `ADR-0002` coloca comentários num token group do Chevrotain em vez de descartá-los. Isso significa que a **captura** de trivia já estará lá; o que faltaria é a **ancoragem** dela nos nós e o impressor. Não é metade do caminho, mas não é do zero.

**O que já foi construído em cima:** nada ainda. Esta decisão e o `ADR-0002` são simultâneos, e o `ADR-0002` foi escrito sabendo desta — a escolha de token group para comentários é o único ponto onde as duas se tocam.
