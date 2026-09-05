---
adr: 0002
title: Chevrotain como toolkit de parser
status: accepted
date: 2026-09-05
deciders: Fabio Badaro
tags: stack, parser, toolchain
supersedes: —
superseded-by: —
---

# ADR-0002 — Chevrotain como toolkit de parser

## Contexto

O repositório tem ~350 KB de especificação normativa, 44 golden files e **zero linhas de código de produto**. O parser é o primeiro código, e a `HEALTH.md` §9.2 registra em **R6.4** que stack e toolchain valem 0 de 20 — "a maior lacuna isolada do projeto inteiro".

Quatro requisitos deste repo restringem a escolha, e nenhum deles é genérico:

1. **Spans exatos.** `AST_SCHEMA.md` §1 fixa unidades de código UTF-16, 1-indexed, `end` exclusivo — e a nota é explícita quanto a isso *não* ser detalhe de implementação, porque a gramática aceita identificadores acentuados e o conteúdo é majoritariamente PT-BR. `RULES-EN.md` §3.3 torna a ordem de emissão normativa, e os golden files asseram o array inteiro por igualdade estrutural. Não existe span "quase certo".
2. **Recuperação de erro em três casos nomeados.** `GRAMMAR.md` §5.1 obriga panic-mode recovery para `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN` e `REMOVED_CONSTRUCT`, cada um com ponto de retomada próprio — e com um quarto passo que não é opcional: registrar a declaração descartada como **inválida** na tabela de símbolos. Descartar não é esquecer; sem esse passo a cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` volta.
3. **Comentário que não se descarta.** A diretiva `odds-disable-next-line` precisa sobreviver até o validador, e seu interior é deliberadamente **não** parseado, para que uma diretiva quebrada vire `MALFORMED_SUPPRESSION` (`info`) em vez de derrubar o arquivo. É um requisito anti-parsing.
4. **Todo estado intermediário de digitação é erro de sintaxe.** O `PRD.md` promete visualização instantânea durante a digitação; o parser roda a cada tecla e a qualidade da mensagem de `SYNTAX_ERROR` genérico é uma superfície de UX atingida o tempo todo.

E um fato que só apareceu depois da primeira análise: **a linguagem vai crescer.** O roadmap prevê três famílias novas de construto — linguagem ubíqua por contexto, referência de repositório, e aprofundamento do espaço do problema (issues #1, #2, #3). A afirmação "a gramática está fechada desde a `GRAMMAR.md` v0.2.0" é verdadeira sobre o escopo atual e falsa sobre o projeto.

## Decisão

**Usamos Chevrotain** como toolkit de parser, em TypeScript.

O argumento que venceu é de **coerência entre spec e artefato**, que é a disciplina central deste repositório inteiro. Chevrotain expressa a gramática de forma declarativa, e o resultado é um artefato que pode ser conferido **produção a produção contra a EBNF normativa** da `GRAMMAR.md` §2–§3 — potencialmente até de forma mecânica, como uma checagem futura do `health_check.py`. Um parser recursive descent escrito à mão codifica a gramática em fluxo de controle, onde a deriva em relação à EBNF é invisível: nada quebra quando o código e a spec discordam, e este repo já pagou o preço de números afirmados em prosa sem reconferência (`CHANGELOG.md`, `RULES` v0.2.1).

Três razões de apoio:

- **Recuperação e mensagens de erro sintático genérico maduras**, para o caso que o usuário mais atinge (toda tecla intermediária), em vez de mensagens artesanais.
- **Sem etapa de codegen.** Chevrotain é biblioteca de runtime, não gerador — o build fica simples e a história 100% client-side segue intacta, ao contrário de ANTLR ou Langium.
- **Crescimento.** Com três famílias de construto vindo, uma gramática declarativa é mais barata de estender e, principalmente, de **revisar** do que fluxo de controle.

Os tokens de Chevrotain carregam `startOffset`, `endOffset`, `startLine` e `startColumn` nativamente, e a contagem de coluna é sobre offsets de string JavaScript — que **são** unidades de código UTF-16, a unidade normativa. A conferência de 1-indexing e de `end` exclusivo contra a convenção dele é a primeira tarefa concreta da implementação.

Para o requisito 3, comentários entram num **token group** próprio em vez de `Lexer.SKIPPED`: são coletados sem participar da gramática, que é exatamente a forma da diretiva de supressão sobreviver com o interior não parseado.

## Alternativas consideradas

### Recursive descent escrito à mão, zero dependências

Rejeitada. **Foi a recomendação da análise**, e o registro dela aqui é deliberado — quem reabrir esta decisão precisa das razões que ela tinha, não só do resultado.

O argumento era: controle total sobre os spans, que são o único artefato que os 44 golden files verificam; os três recuperadores da `GRAMMAR.md` §5.1 são código sob medida em qualquer opção, então o toolkit não poupa o trabalho difícil, só o fácil; um ponto de edição por construto novo em vez de dois; e core sem dependência, publicável sozinho, com bundle menor num produto client-side.

O que a análise **subestimou** e que decidiu contra ela: a gramática codificada em fluxo de controle não é conferível contra a EBNF normativa. Num repositório cuja tese inteira é que spec e artefato não podem derivar em silêncio — quinze checagens mecânicas existem para isso —, escolher a forma em que a deriva é invisível é incoerente com o resto do projeto.

### Langium

Rejeitada, e o motivo é estrutural, não de gosto. Langium geraria parser, AST e um **language server** completo (autocomplete, hover, go-to-definition) a partir de um `.langium` — para um playground de DSL isso é um salto de produto real.

Mas Langium **é dono da forma da AST**, gerada da gramática, e traz o próprio framework de validação e diagnósticos. Aqui o `AST_SCHEMA.md` §1.3 não é sugestão: é o contrato normativo entre parser, Visitor e visualizador, com fase, severidade e chaves de `data` por code. Adotá-lo significaria manter uma segunda AST e uma camada de tradução em sincronia manual — exatamente a classe de deriva que este repo gasta 350 KB prevenindo. Soma-se codegen no build e um runtime mais pesado, contra a premissa client-side.

O argumento a favor dele ficou mais forte do que na primeira análise (com uma linguagem que cresce, codegen amortiza melhor), mas não o suficiente para vencer o conflito de posse da AST. **Se um dia LSP de verdade for requisito, é este ADR que se reabre** — e a pergunta muda de "qual parser" para "quem é dono da AST".

### Adiar a escolha e escrever o validador primeiro

Rejeitada. O validador consome a AST, e a AST vem do parser. Escrever as seis fases contra uma AST construída à mão em testes adiaria a única coisa que fecha o débito **D-001** — os spans dos 44 golden files nunca conferidos contra um parser real.

## Consequências

**O que melhora.** A `HEALTH.md` §9.2 **R6.4** deixa de ser 0 de 20 e o `HEALTH.md` §3 prevê `+6` para decisão de stack registrada em ADR. A gramática passa a existir como artefato revisável contra a EBNF. E o projeto sai da spec para o código.

**O que piora, e é o preço real:**

- **Uma camada a mais.** Chevrotain produz um **CST**; o `AST_SCHEMA.md` exige uma AST específica. O visitor CST → AST é código que um parser à mão não precisaria, e é um **segundo lugar para editar** a cada construto novo — com três famílias vindo, isso se paga várias vezes.
- **Duas recuperações competindo, e é o risco principal.** A recuperação genérica de Chevrotain (deleção/inserção de token, ressincronização) precisa ser desligada ou sobreposta nos três casos da `GRAMMAR.md` §5.1, que exigem pontos de retomada próprios e o registro na tabela de símbolos. Se a dele disparar primeiro, o diagnóstico e o span saem diferentes do que o golden file espera. **Atacar isso cedo**, não no fim.
- **~150–200 KB de dependência** no bundle de um produto que promete execução local no navegador.
- **Spans a conferir, não a assumir.** Offsets JavaScript são UTF-16, mas 1-indexing e `end` exclusivo são convenção nossa, e pares substitutos (um emoji num `title`) contam 2. Primeira tarefa da implementação.

**O que não muda.** O `AST_SCHEMA.md` §1.3 continua sendo o contrato. Tudo a jusante — validador, as seis fases, tabela de símbolos, renderizador — é isolado desta escolha, e é isso que a torna reversível.

## Reversão

**O sinal de que isto foi um erro** é específico e observável cedo: se os três recuperadores da `GRAMMAR.md` §5.1 acabarem **brigados com** a recuperação de Chevrotain em vez de expressos por ela, ou se os spans precisarem de correção token a token para bater com os golden files, o toolkit está custando mais do que entrega. Os dois aparecem nas primeiras semanas, não daqui a um ano — é o melhor tipo de sinal.

Um segundo sinal, mais lento: se o visitor CST → AST crescer a ponto de ser maior que o parser seria à mão, a camada deixou de ser tradução e virou o parser de verdade.

**O custo da volta é moderado e limitado por desenho.** O blast radius para no limite CST → AST, porque o `AST_SCHEMA.md` §1.3 é normativo e congelado: validador, fases e renderizador não sabem qual parser os alimenta. Reverter significa reescrever lexer e parser (~600–900 linhas estimadas), aproveitando as definições de token, que são declarativas e portáveis, e o visitor, cujo alvo não muda.

**O que já foi construído em cima:** nada. Este é o momento mais barato possível para reverter, e ele encolhe rápido — a partir do momento em que os 44 golden files passarem, a suíte passa a ser a rede de segurança que torna a troca segura, mas também o trabalho que se repete.

**O gatilho que reabre para Langium, e não para o parser à mão:** requisito de LSP. Se o playground for querer autocomplete e hover de verdade, a comparação não é mais entre toolkits de parser — é sobre quem é dono da AST, e aí o `AST_SCHEMA.md` §1.3 é que está em jogo.
