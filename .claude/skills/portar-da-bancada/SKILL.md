---
name: portar-da-bancada
description: Porta para apps/playground uma feature validada em docs/design/pages/playground.html. Use ao portar ou implementar na aplicação algo da bancada, ao falar de paridade ou do Playground ODDS, quando apps/playground/test/parity.test.ts falhar, e quando uma feature nova da bancada ganhar data-feature.
---

# Portar da bancada para a aplicação

A bancada é a especificação (`ADR-0017`); a aplicação só implementa o que ela validou. A **marca de validação** é o atributo `data-feature="<id>"` no elemento-raiz da feature, e o `apps/playground/test/parity.test.ts` exige, nas duas direções, um componente com o mesmo literal (`ADR-0020`). Na dúvida entre o que a spec diz e o que a bancada faz, vale a bancada.

## O roteiro

1. **Ler a feature na bancada** pelo `data-feature`: o markup (logo depois do último `<style>` do cabeçalho), o CSS e o script (último `<script>`, depois de `<!--/M50-->`). O texto da interface sai dali, em português, palavra por palavra.
2. **Achar a casa.** `src/features/<área>/components/` para o que é do ODDS, `src/components/ui/` para a primitiva Base UI, `src/features/<área>/lib/` ou `src/lib/` para lógica pura, e o store Zustand para estado.
3. **Portar o estilo** para o `.module.css` ao lado do componente, só com tokens. Os nomes de variável da bancada são traduzidos pela tabela no comentário de `apps/playground/src/styles/global.css`. Os pares principais:

   | Bancada | Aplicação |
   |---|---|
   | `--c-bg` | `--c-canvas` |
   | `--c-panel` | `--c-surface` |
   | `--c-panel2` | `--c-surface-muted` |
   | `--c-border` | `--c-hairline` |
   | `--c-dim` | `--c-ink-mute` |

4. **Testar**: o componente com Testing Library e a lógica pura à parte. Nomes de teste em inglês.
5. **Marcar**: `data-feature="<id>"` como literal no elemento-raiz do TSX, e tirar o id do `PENDING` em `parity.test.ts`.
6. **Conferir lado a lado**: a bancada com a skill `page-shot`, a aplicação no navegador (`npm run dev`).

## O que não se faz

- Inventar UI que a bancada não tem. Todo `data-feature` da aplicação existe também na bancada.
- Importar `@base-ui/react` fora de `src/components/ui/` (regra de lint, `ADR-0014`).
- Pôr o mapa dentro da reconciliação do React: o SVG entra como markup e seleção, hover, câmera e FLIP mexem no DOM por código imperativo (`ADR-0014`).
- Escrever valor cru de cor ou de espaço. Medida em px segue a bancada só quando o `DESIGN.md` não tem token.
- Montar o `data-feature` dinamicamente: a varredura lê o literal.
- Mexer nos blocos gerados da bancada (`<!--TOKENS-->`, `<!--V3CSS-->`, `<!--CORE-->`, `<!--V3SRC-->`, `<!--M50-->`) ou no `@odds/layout`.

## Feature nova na bancada

Quando o autor valida algo, o elemento-raiz ganha `data-feature` com um id kebab-case em inglês, nunca reutilizado. Rode `node docs/design/pages/playground.build.mjs` (código 0) e o teste de paridade vai pedir o componente: ou se porta, ou o id entra em `PENDING` com a razão.

## O teste

```bash
npx vitest run apps/playground/test/parity.test.ts
```
