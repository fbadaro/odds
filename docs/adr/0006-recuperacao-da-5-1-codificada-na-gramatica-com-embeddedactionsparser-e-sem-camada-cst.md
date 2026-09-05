---
adr: 0006
title: Recuperação da §5.1 codificada na gramática, com EmbeddedActionsParser e sem camada CST
status: accepted
date: 2026-09-05
deciders: Fabio Badaro, Claude
tags: parser, arquitetura, recuperacao-de-erro
supersedes: —
superseded-by: —
---

# ADR-0006 — Recuperação da §5.1 codificada na gramática, com EmbeddedActionsParser e sem camada CST

## Contexto

A `GRAMMAR.md` §5.1 obriga panic-mode recovery em exatamente três situações — `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN` e `REMOVED_CONSTRUCT` — com quatro passos: descartar a construção malformada, emitir o diagnóstico com o span exato, **registrar a declaração descartada como inválida** na tabela de símbolos, e continuar parseando. O passo 3 não é opcional: sem ele, a cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` volta e o usuário recebe dois diagnósticos para um erro, sendo o segundo falso.

O `ADR-0002` nomeou isto como **o risco principal** de ter escolhido Chevrotain:

> A recuperação genérica de Chevrotain (deleção/inserção de token, ressincronização) precisa ser desligada ou sobreposta nos três casos da `GRAMMAR.md` §5.1, que exigem pontos de retomada próprios e o registro na tabela de símbolos. Se a dele disparar primeiro, o diagnóstico e o span saem diferentes do que o golden file espera. **Atacar isso cedo**, não no fim.

O mesmo ADR também previu, como custo aceito, uma camada de tradução: *"Chevrotain produz um CST; o `AST_SCHEMA.md` exige uma AST específica. O visitor CST → AST é código que um parser à mão não precisaria, e é um segundo lugar para editar a cada construto novo."*

## Decisão

**As três situações da `GRAMMAR.md` §5.1 são produções explícitas da gramática de implementação, e a recuperação genérica do Chevrotain fica desligada (`recoveryEnabled: false`).**

Concretamente: o parser aceita `context_decl` como alternativa dentro de `domain_decl`, aceita `subdomain_decl` no nível do `program`, e aceita qualquer identificador na posição de tag. Reconhecida a forma errada, nós emitimos o diagnóstico com o span do nó que já temos em mãos, descartamos a construção da árvore e seguimos.

A gramática da **linguagem** continua estrita — um `context` solto num `domain` segue sendo erro, e o `RULES-EN.md` continua sendo quem diz isso. O que mudou é que a gramática da **implementação** reconhece a forma errada para poder explicá-la, em vez de falhar genericamente. É exatamente o que a `GRAMMAR.md` §5.1 pede; a diferença é que nenhum recuperador do Chevrotain participa da decisão.

**Consequência que se paga sozinha:** como a recuperação não depende de inspecionar o CST, o parser usa `EmbeddedActionsParser` e constrói a AST direto. A camada CST → AST que o `ADR-0002` listou como custo **deixa de existir**.

O argumento que venceu é que o risco previsto era uma disputa entre dois mecanismos de recuperação, e disputa entre mecanismos não se ganha — se evita. Sobrepor o nosso ao do Chevrotain significaria depender de qual dispara primeiro em cada caso, o que é frágil de um jeito que teste nenhum cobre bem: funciona até uma produção nova mudar a ordem.

## Alternativas consideradas

### Usar a recuperação do Chevrotain e sobrepor os três casos

Rejeitada — era o caminho previsto pelo `ADR-0002`. A recuperação dele é genérica por desenho (deleção e inserção de token, ressincronização por follow set) e não tem como saber que um `context` dentro de um `domain` merece um diagnóstico nomeado em vez de "token inesperado". Sobrepor significaria deixar os dois mecanismos ativos e depender da ordem em que disparam. Some-se o passo 3 da §5.1 — registrar como inválido —, que o mecanismo dele não tem onde executar.

### `CstParser` com visitor CST → AST

Rejeitada como consequência da decisão acima, não por si. É o caminho mainstream do Chevrotain e seria o certo se precisássemos inspecionar a árvore concreta para recuperar. Como não precisamos, ele só acrescentaria um segundo lugar para editar a cada construto novo — e a linguagem vai crescer três famílias (issues #1, #2, #3).

O preço de não usá-lo: em `EmbeddedActionsParser` as ações rodam durante a **fase de gravação da gramática**, quando tokens e sub-regras são objetos dummy. Isso já custou dois defeitos reais durante a implementação (desestruturar o retorno de um `SUBRULE` fora de `ACTION`, e um `CONSUME` **dentro** de um `ACTION`, que o teria escondido do gravador). São armadilhas conhecidas, mas são armadilhas.

### Afrouxar a gramática normativa da `GRAMMAR.md`

Rejeitada, e seria a saída errada mais tentadora. Tornar `context` legítimo dentro de `domain` faria o parser passar sem esforço nenhum — e destruiria o invariante que a §5.1 existe para proteger: *"a hierarquia Domain → Subdomain → Context é garantida pela própria forma da linguagem, não apenas por convenção"*. A distinção entre gramática da linguagem (estrita) e gramática da implementação (tolerante, para poder explicar) é o que permite ter as duas coisas.

## Consequências

**O que melhora.** O risco nomeado pelo `ADR-0002` foi fechado, e os três golden files que exercitam a §5.1 (`orphan-context`, `orphan-subdomain`, `removed-construct-sw`) passam com span exato. A camada CST → AST não existe, então um construto novo se escreve em um lugar só.

**O que piora.** A gramática de implementação **não é mais lida linha a linha contra a EBNF normativa** — ela contém quatro produções a mais do que a `GRAMMAR.md` §2–§3 descreve, e as três de recuperação são deliberadas. Isso arranha o argumento central do `ADR-0002`, que era justamente a conferibilidade produção a produção. A mitigação é que os desvios são **exatamente os três da §5.1**, nomeados no comentário do topo do `parser.ts`, e não crescem sem que alguém decida. Se crescerem, o argumento do `ADR-0002` some e ele merece ser reaberto.

**Armadilha herdada.** Toda ação do parser que toque token ou retorno de sub-regra precisa estar dentro de `ACTION`, e todo `CONSUME` precisa estar **fora** dele. As duas violações são silenciosas no editor e explodem só na construção do parser.

## Reversão

**O sinal** seria as produções de tolerância passarem de três. A §5.1 fixa três casos; se a implementação acumular exceções que a spec não pede, a gramática de implementação virou outra linguagem e a conferência contra a EBNF deixou de significar algo.

**O custo da volta é baixo e localizado.** Ligar `recoveryEnabled` e remover as três alternativas é uma edição pequena. Voltar para `CstParser` é maior — reescrever as ações como visitor —, mas mecânico, e o alvo (`AST_SCHEMA.md` §2–§4) não muda.

**O que já foi construído em cima:** o parser inteiro e 7 golden files passando. A partir do validador, nada mais depende desta decisão — ele consome a AST, não o parser.
