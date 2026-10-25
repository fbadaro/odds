---
adr: 0019
title: Zustand para o estado de interface, React Compiler para a memoização e ESLint na aplicação
status: accepted
date: 2026-10-22
deciders: Fabio Badaro, Claude
tags: toolchain, ui, react, lint, testes, playground
supersedes: —
superseded-by: —
---

# ADR-0019 — Zustand para o estado de interface, React Compiler para a memoização e ESLint na aplicação

## Contexto

O `ADR-0014` decidiu React no chrome e deixou em aberto *"as práticas de React a adotar"*. O `ADR-0005` tinha adiado o linter de propósito, porque escolher regras antes de existir código sobre o qual discutir seria decidir no vazio, e o `HEALTH.md` §9.2 segurava 2 pontos do R6.6 por essa ausência.

Na conversa de 2026-10-21 sobre como construir a aplicação, essas práticas foram propostas por Claude e o autor não as vetou. O que pesava:

- **O texto é o único estado de verdade** (`ADR-0003`). AST, diagnósticos e geometria derivam dele, mas não no mesmo instante: o layout espera 300 ms de pausa na digitação, e um `SYNTAX_ERROR` congela o último diagrama bom, marcado como obsoleto (`PRD.md` §5.2). Esse ciclo tem relógio e memória entre teclas, e na bancada ele vivia fora de qualquer componente.
- **A colmeia fica fora da reconciliação** (`ADR-0014`), num contêiner que o React não toca. O componente que a hospeda só precisa da string SVG pronta, não de como ela foi calculada nem de quando.
- **O autor vai manter a aplicação**, e quer pouco código nosso. Memoização escrita à mão (`useMemo`, `useCallback`, listas de dependência) é código que ele teria de entender e acertar.
- O `ADR-0014` pediu que a troca de biblioteca de componentes ficasse barata: o código da aplicação importa os nossos componentes, nunca o `@base-ui/react` direto. Isso precisava de alguma coisa que impusesse a regra.

## Decisão

**O estado de interface mora num store Zustand, a memoização é feita pelo React Compiler, e a aplicação tem ESLint.** Os testes da aplicação usam o Vitest do repositório com Testing Library, e componentes rodam em jsdom.

1. **Zustand** (5.0) guarda o texto e o que deriva dele, mais o estado de interface (vista, seleção). O ciclo da bancada mora nas ações do store: `setText` analisa, decide se o desenho muda já ou depois da pausa, e congela o diagrama quando o texto quebra. Os derivados só são escritos por essas ações, a partir do texto, e nenhuma ação os escreve por outro caminho. O store é criado por instância (`createPlaygroundStore`), e é testado em node, sem renderizar nada.
2. **React Compiler** (`babel-plugin-react-compiler` 1.0, ligado no Vite pelo `reactCompilerPreset` do `@vitejs/plugin-react` 6 e pelo `@rolldown/plugin-babel`). Não se escreve `useMemo` nem `useCallback` à mão.
3. **ESLint** (10, configuração plana) com `typescript-eslint`, as regras recomendadas do `eslint-plugin-react-hooks` 7, que incluem as que vêm do compilador, e `no-restricted-imports` proibindo `@base-ui/react` fora de `src/components/ui/**`. O lint cobre só `apps/playground` (`npm run lint`).

O argumento que venceu é o mesmo nas três: **cada uma tira da nossa mão uma coisa que daria errado em silêncio.** O Zustand tira o ciclo do texto de dentro dos componentes: o relógio da pausa e a memória entre teclas ficam num store que existe fora do React e é testado sem montar tela, e os componentes, o da colmeia inclusive, só leem o resultado. O compilador tira a memoização, cujo erro típico (dependência esquecida) não quebra nada, só deixa a tela velha ou lenta. O ESLint tira de quem revisa duas regras que nenhuma pessoa segura de memória: as regras do React, que o compilador pressupõe e cuja violação o faz desistir do componente sem avisar, e a fronteira do Base UI, que o `ADR-0014` pôs como o que protege a reversão dele.

**Por que o lint cobre a aplicação e não os pacotes, e por que isso é coerente com o `ADR-0005`.** O motivo daquele adiamento era não escolher regras sem código sobre o qual discutir. Na aplicação as duas regras têm motivo concreto antes da primeira linha: uma é condição para o compilador funcionar, a outra é uma fronteira já decidida em ADR. Nos pacotes, que têm código desde 2026-09-05, ninguém ainda propôs uma regra com motivo, e a fronteira que importa ali (`@odds/core` sem `@odds/messages`, `ADR-0004`) é garantida pelo grafo de dependências, não por lint. A ausência lá continua sendo a do `ADR-0005`: deliberada, e com o mesmo critério para acabar.

## Alternativas consideradas

### Redux (Redux Toolkit) para o estado

É o padrão mais conhecido, e o mais documentado. Rejeitado por peso: ações, *reducers* e *slices* para uma tela só, cujo estado é um texto, o que deriva dele e alguns sinalizadores. O ganho do Redux (ferramentas de depuração, convenção para equipes grandes) não paga a cerimônia numa aplicação mantida por uma pessoa.

### `useMemo` e `useCallback` escritos à mão

É o React sem nada a mais, e o que a maioria do código existente faz. Rejeitado porque é código nosso que o compilador escreve sozinho, e é o tipo de código cujo erro não aparece: uma lista de dependências incompleta deixa um valor velho na tela, uma memoização a mais só custa leitura. O compilador está estável desde a versão 1.0.

### Continuar sem linter também na aplicação

Manteria o `ADR-0005` inteiro, sem configuração nova para manter. Rejeitado porque as duas regras acima ficariam por conta de lembrar. A violação das regras do React com o compilador ligado é a pior das duas: o componente continua funcionando, só que sem a otimização, e ninguém percebe até ficar lento.

### Teste de ponta a ponta no navegador desde já

Playwright ou equivalente, rodando a aplicação de verdade. Ficou de fora por ora. O comportamento do primeiro incremento (a pausa, o diagrama congelado, os contadores) é testável com relógio falso em jsdom, e teste de navegador só se paga quando houver fluxo de várias telas para percorrer.

## Consequências

- A regra "o texto é o único estado de verdade" vira forma de código: os derivados só têm uma porta de entrada, a ação que muda o texto.
- O código dos componentes fica sem `useMemo`, `useCallback` e `React.memo`. Quem vier de outro projeto React pode estranhar a ausência e querer pôr de volta, e as regras do compilador no lint apontam a memoização manual que ele não consegue preservar.
- A fronteira do Base UI fica imposta antes de o Base UI entrar: a regra já está no `eslint.config.js`, e `src/components/ui/` nasce quando a primeira feature precisar de um componente padrão.
- O `HEALTH.md` §9.2 R6.6 deixa de perder pontos pela ausência de linter, e o `CLAUDE.md` passa a dizer o que existe: lint na aplicação, pacotes ainda sem.
- **Piora: o build tem uma etapa de Babel** só para o compilador, e o compilador é mais uma peça com ciclo próprio entre o código e o navegador. Um erro dele aparece como comportamento estranho, não como erro de compilação.
- **Piora: o lint é desigual no repositório.** `apps/playground` tem regras e os pacotes não, e quem mexe nos dois precisa saber disso.
- **Piora: são mais quatro dependências de desenvolvimento diretas no lint** (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`), mais o Babel e o plugin do compilador, que o repositório não tinha.
- O ESLint não foi comparado com Biome ou oxlint. O critério era ter o plugin oficial de hooks do React, que é um plugin de ESLint e é quem traz as regras do compilador. Se outra ferramenta passar a cobri-las, a comparação está por fazer.

## Reversão

**Os sinais.** Para o Zustand: o estado de interface crescer a ponto de pedir várias lojas que conversam entre si, ou ferramentas de depuração que ele não tem. Para o compilador: um bug que só aparece com ele ligado, ou um custo de build que incomode o ciclo de ajuste de estilo. Para o ESLint: regras que geram mais supressão do que correção.

**O custo da volta, por peça.** Desligar o compilador é tirar o preset do `vite.config.ts`: o código continua correto, só sem memoização, e os pontos lentos aparecem para receber `useMemo` à mão. Trocar o Zustand é reescrever o store e os seletores dos componentes, e o custo cresce com o número de componentes que leem o store. Tirar o ESLint é apagar um arquivo, mas a fronteira do Base UI volta a depender de memória.

**O que já foi construído em cima:** o store do primeiro incremento com o ciclo da bancada e os testes dele, o contêiner da colmeia, que lê do store só a string SVG pronta, os componentes `Editor` e `SeverityCounters` sem memoização manual, e o `eslint.config.js` com a fronteira do Base UI.
