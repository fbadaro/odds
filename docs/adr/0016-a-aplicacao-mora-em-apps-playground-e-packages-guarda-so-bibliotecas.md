---
adr: 0016
title: A aplicação mora em apps/playground, e packages/ guarda só bibliotecas
status: accepted
date: 2026-10-22
deciders: Fabio Badaro, Claude
tags: estrutura, monorepo, playground
supersedes: —
---

# ADR-0016 — A aplicação mora em apps/playground, e packages/ guarda só bibliotecas

## Contexto

O `ADR-0004` fixou o monorepo em `packages/` com três pacotes, e o terceiro era `@odds/playground`, *"o produto: editor, diagrama, URL, auto-save"*. Quando ele foi escrito, em 2026-09-05, não havia uma linha de interface, nem framework, nem bundler. Os três vieram depois: o `ADR-0009` pôs o layout num pacote `@odds/layout`, o `ADR-0014` decidiu React no chrome e o `ADR-0015` trouxe o Vite só para a aplicação.

Em 2026-10-20, ao fechar essas duas últimas decisões de stack, o autor reabriu onde a aplicação mora. Na conversa de 2026-10-21 sobre como construir a aplicação, a pergunta ficou concreta. Havia agora duas espécies de coisa no repositório:

- **bibliotecas**, `@odds/core`, `@odds/messages` e o `@odds/layout` que ia nascer, publicáveis, construídas por `tsc` sem bundle (`ADR-0005`), sem DOM e sem React;
- **um produto**, que é um site estático montado pelo Vite, com React, CSS Modules e um servidor de desenvolvimento, e que ninguém importa.

O autor pôs uma exigência que pesava sobre a escolha: ele vai manter a aplicação pessoalmente, e quer achar onde mexer sem precisar conhecer o ODDS nem pedir a uma IA. A estrutura precisava ser a que quem já trabalhou com React e Vite reconhece.

## Decisão

**A aplicação mora em `apps/playground` (pacote `@odds/playground`), e `packages/` guarda só bibliotecas.** O `package.json` da raiz declara `"workspaces": ["packages/*", "apps/*"]`. Dentro da aplicação, a organização é a do template do Vite, com `src/` dividido por funcionalidade no modelo do bulletproof-react (`components/ui/`, `features/<área>/`, `lib/`, `stores/`, `styles/`).

O argumento que venceu é que **a pasta passa a dizer a espécie do que está nela**. `apps/` é o que se publica como site e `packages/` é o que se importa: é a convenção dos monorepos JavaScript, e quem abre o repositório entende sem ler nada. A regra que o `ADR-0009` pôs no `@odds/layout`, nada de DOM nem de React, vale para todo `packages/` como consequência, e fica fácil de conferir: React só aparece debaixo de `apps/`.

Isto **refina** o `ADR-0004` e não o substitui. A fronteira que ele existe para garantir, `@odds/core` sem dependência de `@odds/messages`, continua intacta, e a divisão entre núcleo e produto continua a que ele decidiu. O que muda é só o endereço do terceiro pacote, que o próprio ADR deu antes de existir framework ou bundler.

## Alternativas consideradas

### `packages/playground`, como o `ADR-0004` previa

Era o plano registrado, e funciona: os workspaces do npm não distinguem um pacote de uma aplicação. Rejeitada porque junta na mesma pasta coisas que se constroem de jeitos diferentes. As bibliotecas saem do `tsc --build` com project references e são importadas, e a aplicação sai do Vite como site e nunca é importada. Na mesma pasta, a regra "sem DOM e sem React" do `ADR-0009` passa a ter exceção, e quem procura onde fica a tela tem de abrir cada pacote para descobrir qual deles é o produto. O custo de ficar com o plano era zero naquele momento, e foi isso que tornou a escolha real e não óbvia.

## Consequências

- `packages/` tem três bibliotecas, `@odds/core`, `@odds/messages` e `@odds/layout`, e nenhuma importa React nem toca DOM. `apps/` tem uma aplicação. O próximo produto, se a landing virar site próprio, já tem endereço.
- A aplicação aponta os pacotes para a fonte (`apps/playground/vite.config.ts`), como o `vitest.config.ts` da raiz já fazia, porque os pacotes publicam `./dist` e ele não existe num checkout limpo.
- O `AGENTS.md` lista `@odds/layout` e `apps/playground` na tabela *Layout*.
- **Piora: o glob de workspace tem duas entradas**, e o Vitest da raiz passou a abrir o projeto de `apps/*` também. É pouco, mas é uma configuração a mais que precisa lembrar das duas árvores.
- **Piora: o `ADR-0004` passa a ser lido junto com este.** Quem o ler sozinho encontra `@odds/playground` em `packages/`. Ele ganhou uma nota de topo apontando para cá.

## Reversão

**O sinal** seria aparecer uma segunda espécie que não cabe em nenhuma das duas pastas, ou a aplicação precisar ser importada por outro pacote, o que a faria biblioteca.

**O custo da volta é baixo:** mover `apps/playground` para `packages/playground` é um `git mv`, uma linha no glob de workspace e os caminhos relativos do `vite.config.ts`. Nenhum import muda, porque todos usam o nome do pacote.

**O que já foi construído em cima:** a aplicação inteira do primeiro incremento (editor, colmeia fora da reconciliação, contadores de severidade), o gerador de tokens em `apps/playground/scripts/` (`ADR-0018`) e o ESLint, que cobre só `apps/playground` (`ADR-0019`).
