---
adr: 0020
title: A paridade entre bancada e aplicação é um contrato: data-feature na bancada, teste de paridade na aplicação
status: accepted
date: 2026-10-22
deciders: Fabio Badaro, Claude
tags: processo, ui, playground, bancada, testes
supersedes: —
superseded-by: —
---

# ADR-0020 — A paridade entre bancada e aplicação é um contrato: data-feature na bancada, teste de paridade na aplicação

## Contexto

O `ADR-0017` fez da bancada (`docs/design/pages/playground.html`) a especificação e da aplicação (`apps/playground`) a implementação só do que foi validado. Faltava um mecanismo: nada dizia, em código, o que a bancada já tinha validado, nem acusava uma feature validada que a aplicação ainda não tinha. A primeira aplicação nasceu com uma fração da bancada, e a diferença só era visível a quem comparasse as duas telas a olho.

O design de 2026-10-21 (`docs/superpowers/specs/2026-10-21-aplicacao-playground-design.md`) tinha como não-objetivo reproduzir a bancada inteira. Este trabalho reverte esse não-objetivo: a aplicação passa a ter paridade com a bancada, feature por feature. Isso exige uma forma de manter as duas juntas depois da primeira rodada, quando o autor validar mais uma ideia na bancada.

## Decisão

**Cada elemento-raiz de uma feature validada na bancada leva `data-feature="<id>"`, e `apps/playground/test/parity.test.ts` exige, nas duas direções, um componente com o mesmo literal na aplicação.** A marca é o ato de validar: o que está em experimento fica sem ela. O teste lê o conjunto B (a bancada) e o conjunto A (os `.tsx` da aplicação) e mantém uma lista `PENDING` com a razão de cada id ainda não portado. Todo id de B fora de `PENDING` está em A; todo id de `PENDING` está em B e fora de A; todo id de A está em B. A skill `portar-da-bancada` é o roteiro, e um hook lembra de marcar ao editar a bancada.

Ganhou porque transforma "lembre de portar" em uma falha de teste, que é o único lembrete que não depende de quem lê o `CLAUDE.md`. O formato espelha o `PENDING` de `packages/core/test/conformance.test.ts`, que o projeto já usa.

## Alternativas consideradas

### Só a instrução no `CLAUDE.md`

Barata, mas depende de memória: quem edita a bancada precisa lembrar da regra, e nada falha se esquecer. A deriva que o `ADR-0017` quis evitar volta em silêncio. Mantida apenas como ponteiro para o mecanismo.

### Um manifesto em Markdown

Um arquivo listando as features validadas e seu estado. Legível, mas deriva sem teste: o manifesto e a bancada são dois lugares a manter, e nada os compara.

### Um teste sobre o DOM renderizado

Renderizar a aplicação e procurar as marcas. Rejeitado porque ficha, toast e menu só existem no DOM em certos estados; o teste precisaria dirigir a aplicação até cada um, e passaria a ser um teste de comportamento disfarçado de teste de paridade. Varrer o código-fonte responde só "existe um componente para isto"; o comportamento fica nos testes de cada componente.

## Consequências

- Toda feature nova validada na bancada exige a marca e, logo depois, o componente, ou uma entrada em `PENDING` com razão. O teste é a fila de trabalho.
- A marca é só presença: o teste não confere que o componente se parece com a bancada. A conferência visual continua manual (skill `page-shot`).
- O literal `data-feature` precisa estar escrito no TSX; um id montado dinamicamente não é visto pela varredura.
- Os 17 ids são estáveis e nunca reutilizados para outra coisa.
- Um id esquecido de `PENDING` depois de implementado quebra o teste: é o desenho, e o custo é uma linha a apagar.

## Reversão

O sinal de erro é o autor querer validar uma ideia sem marcá-la, ou a marca virar ruído (ids adicionados só para calar o teste, `PENDING` crescendo sem razão). Voltar custa pouco: apagar o teste, a skill e o hook, e tirar os atributos `data-feature` da bancada e dos componentes, que não carregam comportamento. Em cima do mecanismo estão apenas essas peças e as tasks de paridade de 2026-10-22; nada de código de produto depende dele.
