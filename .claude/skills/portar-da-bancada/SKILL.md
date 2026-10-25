---
name: portar-da-bancada
description: Porta para apps/playground uma feature validada em docs/design/pages/playground.html, levando a funcionalidade e construindo-a com os componentes do Base UI. Use ao portar ou implementar na aplicação algo da bancada, ao falar de paridade ou do Playground ODDS, quando apps/playground/test/parity.test.ts falhar, e quando uma feature nova da bancada ganhar data-feature.
---

# Portar da bancada para a aplicação

A bancada **valida a funcionalidade**: o que a feature faz, não o HTML nem o CSS com que faz (`ADR-0021`). A aplicação constrói cada feature validada com os **componentes do Base UI** sempre que existir um para aquele comportamento, e o visual sai do `DESIGN.md`, não do CSS da bancada. A **marca de validação** é o atributo `data-feature="<id>"` no elemento-raiz da feature, e o `apps/playground/test/parity.test.ts` exige, nas duas direções, um componente com o mesmo literal (`ADR-0020`).

## O que atravessa e o que não atravessa

| Atravessa: é o que foi validado | Não atravessa: a bancada fez como quis |
|---|---|
| Estados da feature e o que leva de um a outro | Markup e estrutura do DOM |
| O que clique, teclado e foco fazem | Nomes de classe e CSS |
| Tempos (300 ms da tecla, 4200 ms do aviso) | ARIA e tratadores de teclado escritos à mão |
| O efeito no mapa (seleção, câmera, enquadrar) | Composição exata da tela, medidas, posições |
| Os textos da interface, palavra por palavra | |

O mapa é uma exceção natural: é o `@odds/layout` nas duas telas, então sai igual por ser a mesma função, e não se porta.

## O roteiro

1. **Ler a feature na bancada** pelo `data-feature`: o markup (logo depois do último `<style>` do cabeçalho), o CSS e o script (último `<script>`, depois de `<!--/M50-->`). Leia para extrair **o comportamento**. Escreva, antes de codar, a lista do que a feature faz: estados, gatilhos, teclas, foco, tempos, textos. É essa lista que se porta, não o HTML.
2. **Escolher o componente Base UI** para cada comportamento da lista. É o passo que decide a estrutura, e vem antes de qualquer markup:

   | Comportamento na bancada | Base UI |
   |---|---|
   | dica ao passar o mouse (`title`, balão próprio) | `Tooltip` |
   | botão que liga e desliga (`aria-pressed`) | `Toggle` |
   | escolha única ou múltipla entre botões | `ToggleGroup` |
   | fileira de controles com setas entre eles | `Toolbar` |
   | área que abre e recolhe (`aria-expanded`) | `Collapsible`, ou `Accordion` se forem várias |
   | menu de ações ou de escolhas | `Menu` |
   | painel flutuante ancorado num botão | `Popover` |
   | janela com foco preso | `Dialog`, ou `AlertDialog` para confirmação |
   | abas | `Tabs` |
   | campo com sugestões | `Combobox` ou `Autocomplete` |
   | lista de escolha fechada | `Select` |

   A lista completa está em `node_modules/@base-ui/react/package.json` (`exports`). Se o comportamento não tem componente no Base UI (a colmeia, as ilhas, o inspetor, a disposição do rodapé), ele é componente próprio, e o comportamento padrão que ele contiver ainda passa pelo Base UI. Se o Base UI tem o componente e ele não serve, a exceção vai **escrita no componente, com a razão**, como o `src/components/ui/Toast.tsx` faz.
3. **Achar a casa.** O wrapper do componente Base UI vai em `src/components/ui/`, que é o único lugar que importa `@base-ui/react` (regra de lint, `ADR-0014`). Se o wrapper ainda não existe, crie-o ali, genérico, recebendo o `Button` próprio pela prop `render` quando o gatilho for um botão (veja `Menu.tsx` e `ToggleGroup.tsx`). A feature fica em `src/features/<área>/components/` e consome o wrapper. A lógica pura vai em `src/features/<área>/lib/` ou `src/lib/`, e o estado no store Zustand. Estado de aberto e fechado que outra parte da aplicação precise saber vai para o store, nunca é deduzido do DOM do Base UI.
4. **Estilizar a partir do `DESIGN.md`**, no `.module.css` ao lado do componente, só com tokens. O estado vem dos atributos que o Base UI expõe (`[data-pressed]`, `[data-open]`, `[data-highlighted]`, `[data-disabled]`), não de classes trocadas à mão. O CSS da bancada é pista do que se quis mostrar, não valor a copiar. Ao lê-lo, a tabela no comentário de `apps/playground/src/styles/global.css` traduz os nomes de variável (`--c-bg` → `--c-canvas`, `--c-panel` → `--c-surface` e as outras).
5. **Testar o comportamento da lista do passo 1**: o componente com Testing Library, pelo papel e pelo nome acessível (`getByRole`), que é o que o Base UI garante, e a lógica pura à parte. Nomes de teste em inglês.
6. **Marcar**: `data-feature="<id>"` como literal no elemento-raiz do TSX, e tirar o id do `PENDING` em `parity.test.ts`.
7. **Conferir lado a lado o comportamento**: a bancada com a skill `page-shot`, a aplicação no navegador (`npm run dev`). Compare estados e reações, não pixels: as duas telas podem, e vão, parecer diferentes.

## O que não se faz

- **Transcrever o markup ou o CSS da bancada.** A estrutura da aplicação é a anatomia do componente Base UI, mesmo quando a bancada fez de outro jeito.
- **Escrever à mão um comportamento que o Base UI tem**: `aria-pressed`, `aria-expanded`, `role="menu"`, foco preso, setas, `Esc`, posicionamento de balão, `title` como dica.
- **Deduzir estado do DOM** que o Base UI gera (`document.querySelector('[role="menu"]')`): o markup dele muda entre versões e a checagem quebra sem erro.
- Inventar **feature** que a bancada não tem. Todo `data-feature` da aplicação existe também na bancada. As peças que a anatomia do Base UI acrescenta (`Positioner`, `Backdrop`, `Arrow`) são estrutura do componente, não feature.
- Importar `@base-ui/react` fora de `src/components/ui/`.
- Pôr o mapa dentro da reconciliação do React: o SVG entra como markup, e seleção, hover, câmera e FLIP mexem no DOM por código imperativo (`ADR-0014`).
- Escrever valor cru de cor ou de espaço. Medida em px só quando o `DESIGN.md` não tem token, e então tirada do `DESIGN.md` ou decidida, não copiada da bancada.
- Montar o `data-feature` dinamicamente: a varredura lê o literal.
- Mexer nos blocos gerados da bancada (`<!--TOKENS-->`, `<!--V3CSS-->`, `<!--CORE-->`, `<!--V3SRC-->`, `<!--M50-->`) ou no `@odds/layout`.

## Feature nova na bancada

Quando o autor valida algo, o elemento-raiz ganha `data-feature` com um id kebab-case em inglês, nunca reutilizado. Na bancada vale qualquer HTML: ela não precisa imitar o Base UI. Rode `node docs/design/pages/playground.build.mjs` (código 0), e o teste de paridade vai pedir o componente: ou se porta, ou o id entra em `PENDING` com a razão.

## O teste

```bash
npx vitest run apps/playground/test/parity.test.ts
```
