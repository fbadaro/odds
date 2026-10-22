# A aplicação alcança a bancada, e o harness que mantém as duas juntas: design

Data: 2026-10-22 · Branch: `feat/apps-playground` · Antecede: `2026-10-21-aplicacao-playground-design.md` · Decisões em vigor: `ADR-0014`, `ADR-0016`, `ADR-0017`, `ADR-0018`, `ADR-0019`

## 1. Intenção

O autor testou o primeiro incremento (editor, mapa e contadores) e decidiu: *"a versão aprovada é a que está no Playground ODDS, então precisamos implementar absolutamente todas as features que estão lá"*. E sobre o jeito de fazer: *"o que for validado lá posteriormente precisa virar componente na aplicação final, faça seguindo os padrões estabelecidos, usando componentização para fazer tudo"*.

Por isso, este trabalho tem duas partes:

1. **Paridade.** Tudo o que `docs/design/pages/playground.html` faz, a aplicação passa a fazer, com a aparência e o comportamento de lá, em componentes React no padrão já estabelecido.
2. **Harness.** O ciclo "a bancada valida → a aplicação implementa" deixa de depender de alguém repetir a instrução. Uma marca na bancada diz o que foi validado, e um teste na aplicação falha enquanto faltar o componente correspondente. A skill do projeto ensina o caminho, e o `CLAUDE.md` aponta para ela.

Este documento substitui o não-objetivo "reproduzir a bancada inteira" do design de 2026-10-21 (§4 de lá). O autor reverteu essa decisão depois de testar.

## 2. O harness (decisão do Claude, a registrar em ADR-0020)

### 2.1 A marca de validação: `data-feature`

Cada elemento-raiz de uma feature validada na bancada leva `data-feature="<id>"`. **A marca é o ato de validar**: algo em experimento fica sem ela, e o que o autor aprova ganha a marca. Os ids são estáveis, em kebab-case inglês, e nunca são reutilizados para outra coisa.

Na aplicação, o elemento-raiz do componente que implementa a feature leva **o mesmo** `data-feature="<id>"`, como literal no TSX.

### 2.2 O teste de paridade

`apps/playground/test/parity.test.ts`:

- lê `docs/design/pages/playground.html` e extrai o conjunto **B** dos ids de `data-feature`;
- varre `apps/playground/src/**/*.tsx` e extrai o conjunto **A** dos literais `data-feature="…"`;
- mantém uma lista `PENDING` de ids, cada um com a razão.

Ele afirma, **nas duas direções** (o mesmo contrato do `PENDING` de `packages/core/test/conformance.test.ts`):

- todo id de B que não está em `PENDING` está em A;
- todo id de `PENDING` está em B e **não** está em A, para que um id implementado saia da lista;
- todo id de A está em B, porque a aplicação não inventa feature (`ADR-0017`).

Varrer o código-fonte, e não o DOM renderizado, é deliberado. Ficha, toast e menu só existem no DOM em certos estados, e o teste de paridade responde apenas "existe um componente para isto". O comportamento é conferido pelos testes de cada componente.

### 2.3 A skill `portar-da-bancada`

`.claude/skills/portar-da-bancada/SKILL.md`, em português como as outras skills do projeto. Ela dispara quando se fala em portar, implementar na aplicação, paridade, uma feature validada na bancada, ou quando o teste de paridade falha. O conteúdo é o roteiro:

1. Ler o trecho da bancada pelo `data-feature` (markup, CSS, script).
2. Achar a casa: `src/features/<área>/components/` para o que é do ODDS e `src/components/ui/` para a primitiva Base UI. Lógica pura vai em `src/features/<área>/lib/` ou `src/lib/`, e estado no store Zustand.
3. Portar o estilo para o `.module.css` ao lado, só com tokens. O nome de variável da bancada (`--c-bg`, `--c-panel`…) é traduzido pela tabela da §6.
4. Escrever o teste do componente (Testing Library) e o da lógica pura.
5. Pôr o `data-feature` no elemento-raiz e tirar o id do `PENDING`.
6. Conferir lado a lado com a skill `page-shot` (bancada) e com o navegador (aplicação).

A skill também diz o que **não** se faz: inventar UI que a bancada não tem, importar `@base-ui/react` fora de `components/ui/`, pôr o mapa dentro da reconciliação do React ou escrever valor cru de cor ou espaço.

### 2.4 O lembrete

Um hook `PostToolUse` em `.claude/settings.json`, no mesmo molde do que já existe para `GRAMMAR.md`. Ao editar `docs/design/pages/playground.html`, ele mostra uma `systemMessage`: se a edição valida uma feature, a feature ganha `data-feature`, e o teste de paridade vai exigir o componente.

### 2.5 O ponteiro

O `CLAUDE.md`, na linha de `apps/playground` da tabela de código (ou logo abaixo dela), ganha uma frase com a regra, o teste e a skill.

## 3. O inventário da paridade

Cada linha é um id de `data-feature`. Tudo o que está descrito abaixo está no script e no CSS da bancada, e esse código **é a especificação**. Na dúvida, vale a bancada.

| id | Na bancada | O que faz |
|---|---|---|
| `map` | `#map` | Mapa em tela inteira atrás das ilhas. Arrastar move; roda, pinça (`ctrlKey`) e `+ − 0` dão zoom; as setas movem. Clique numa peça seleciona o contexto, numa linha a relação, num território o subdomínio (de novo no mesmo território, desfaz) e no vazio limpa. Passar o mouse sobre um território o acende. A câmera enquadra a **área livre** (`safe()`), com os limites de `LIM`. O detalhe muda com o zoom (`svg.far`, `--k`), e a mudança de topologia anima por FLIP (`lv-anim`, `born`). No estado congelado, o mapa fica atenuado (`frozen`). |
| `file-menu` | `.i-file` + `#fileMenu` | A palavra `odds` e o nome do arquivo abrem um menu com marketplace.odds (50 contextos), vendas.odds (17 contextos) e "restaurar o texto inicial". Trocar de arquivo zera a seleção, a câmera, o `lastType` e o cursor. |
| `view-switch` | `#segView` | Fluxo / Contenção: troca `view` no `renderSvg`. |
| `share` | `#btnShare` | Botão primário Compartilhar. Mostra o toast de que o formato do link está em aberto, com o texto da bancada. Fica só como lugar do botão (§4). |
| `export-svg` | `#btnExport` | Exporta o mapa inteiro em repouso, sem classes de seleção, com tokens, CSS do mapa e CSS de navegação embutidos, e `data-theme` do tema atual. O arquivo se chama `<arquivo>.svg`, e o toast diz quantos marcadores foram. |
| `theme-toggle` | `#btnTheme` | Alterna `data-theme` entre light e dark no `<html>`. Começa em light. |
| `rail` | `nav.rail` | Trilho com três quadrados: Código, Estrutura e Como ler. Abre um painel por vez, e o mesmo quadrado fecha (`aria-pressed`). |
| `panel-code` | `#pCode` | O editor: gutter com o número da linha e o ícone da pior severidade daquela linha, posição `arquivo · Lx:y` no cabeçalho, `Tab` insere dois espaços e `Esc` sai do editor para o mapa. |
| `panel-tree` | `#pTree` | A estrutura, lida da AST e não do mapa: domínio, subdomínios com tipo e owner, contextos, external e relações, cada um com a pior severidade. Nós recolhíveis que lembram o estado durante a digitação. Clicar seleciona e enquadra, ou leva à linha se o item não estiver no mapa. Passar sobre um subdomínio o acende no mapa. A linha selecionada fica marcada. |
| `panel-help` | `#pHelp` | Como ler: a legenda gerada do mapa atual (tipos com contagem, external, seta, acesa, inválida, tag encostada) e os atalhos. |
| `ficha` | `#ficha` | A ficha à direita, que só existe com algo selecionado. **Contexto:** título, subdomínio clicável, domínio e linha; veredito; contrato, com cada relação e o papel clicável; propriedades; a cerca "propriedade é documentação". **Subdomínio:** tipo, título, domínio e linha; description e owner; os derivados (contextos, internas, que atravessam); a lista de contextos com o grau. **Relação:** voltar ao contexto de origem; forma e texto-fonte com a linha; veredito; fronteira; os dois lados com papel, tags do glossário e documentação; a cerca "tag é contrato". Abrir e fechar a ficha muda a área livre. |
| `selection-caption` | `#selCap` | A legenda curta da seleção (nome + resto), anunciada por `aria-live`. |
| `frozen-flag` | `#flag` | "Diagrama congelado." com a mensagem: erro de sintaxe em `Lx:y` ou falha do layout. |
| `wait-indicator` | `#wait` | "topologia mudou · o mapa redesenha na pausa", visível durante a pausa. |
| `diagnostics-dock` | `#dock` | O rodapé: os contadores filtram por severidade, com a soma ao lado ou "nenhum diagnóstico · o modelo é coerente". A lista recolhe, mostra até três e tem "ver os N diagnósticos" / "mostrar só os três primeiros". Clicar num diagnóstico seleciona e enquadra o alvo, abre o painel de código e seleciona o trecho. O rodapé se centra entre o painel e o zoom. |
| `zoom-controls` | `.i-zoom` | − / porcentagem / + / mapa inteiro. |
| `toast` | `#toast` | A mensagem passageira (4,2 s), `role="status"`. |

O `Esc` global segue a ordem da bancada: fecha o menu se estiver aberto; se não, numa relação vinda de um contexto, volta ao contexto; se não, limpa a seleção. Dentro do editor, o `Esc` só sai dele.

A largura estreita (≤ 760 px) segue a bancada: outra área livre e o rodapé sem centragem.

**O que fica de fora, por não ser feature:** o gancho `globalThis.__pg` e o `claude.use("downloads")`, que só existem por causa do host da bancada. O export da aplicação usa o `<a download>`, como o caminho de reserva da bancada.

## 4. Não-objetivos

- **Nada além da bancada.** Auto-save, URL compartilhável de verdade, persistência do tema e as features do PRD que a bancada ainda não validou ficam de fora. Compartilhar continua sendo o lugar do botão, como lá.
- **Mudar a bancada**, exceto para pôr os `data-feature` (§2.1). Nenhuma mudança visual ou de comportamento nela.
- **Mexer no `@odds/layout`.** A interação (`.lit`, `.focus`, `svg.far`…) é tela, e o `map.css` a deixou de fora de propósito. Ela vem para a aplicação.

## 5. Como se constrói (os padrões que já valem)

- **Componentes por feature**, em `src/features/<área>/components/<Nome>.tsx`, com o `<Nome>.module.css` ao lado. As áreas são decisão do builder, uma por grupo do inventário (por exemplo `honeycomb`, `editor`, `diagnostics`, `inspector`, `structure`, `help`, `topbar`, `panels`).
- **Ilha** é um componente próprio do ODDS, `src/components/island/Island.tsx`, que todas as ilhas usam. Nada fica grudado nas bordas da tela.
- **Base UI só em `src/components/ui/`**, como invólucros nossos (`ADR-0014`, regra de lint já ativa). Menu do arquivo, grupo Fluxo/Contenção e toast são candidatos naturais. O builder escolhe a primitiva e fixa a versão exata do `@base-ui/react`, que entra como dependência.
- **Estado de interface no Zustand** (`ADR-0019`): arquivo atual, vista, seleção, hover, painel aberto, filtros, lista aberta e toast. **A câmera não passa pelo store a cada quadro**: ela é um controlador imperativo dentro da feature do mapa, que publica só o que outro componente lê (a porcentagem de zoom).
- **O mapa continua fora da reconciliação** (`ADR-0014`): seleção e hover aplicam classes no SVG por uma função pura sobre o DOM do mapa, testável no jsdom, e não por JSX.
- **Lógica pura fora dos componentes, e testada.** Entram aqui a ficha a partir da AST, o glossário de tags e formas, a matemática da câmera (`frameOf`, `camFor`, `clampCam`, `fitFrame`), as marcas de severidade da árvore, o gutter, a legenda e a montagem do SVG exportado.
- **O texto é da bancada**, em português, palavra por palavra. A frase de um diagnóstico vem de `@odds/messages` (`render(d, "pt")`), com o trecho entre crases em mono, montado em React e nunca por `innerHTML`.
- **A aplicação passa a ocupar a tela inteira**, como a bancada: some o layout atual de três faixas (`App.module.css`).

## 6. Tradução de tokens (bancada → aplicação)

A bancada usa os nomes de `bancada-tokens.css` (`--c-bg`, `--c-panel`, `--c-panel2`, `--c-border`, `--c-dim`, `--c-edge`…), e a aplicação usa os do front matter do `DESIGN.md` (`--c-canvas`, `--c-surface`…; ADR-0018). Antes de portar o primeiro estilo, o builder monta a tabela de equivalência a partir dos dois arquivos e a deixa como comentário no `global.css`. Se um token da bancada não tem par no `DESIGN.md` (as tintas por tipo `--c-core-ink` / `--c-sup-ink` / `--c-gen-ink`, `--c-edge-lit`, `--c-edge-far`), ele entra no front matter do `DESIGN.md` e se regenera o `tokens.css`. Valor cru num `.module.css` não vale.

## 7. Critérios de pronto

- O teste de paridade passa com o `PENDING` vazio.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:app` e o `health_check.py` passam.
- O `playground.build.mjs` confere a bancada sem diferença, porque `data-feature` fica fora dos blocos gerados.
- Conferência no navegador, lado a lado com a bancada, nos dois temas: cada linha do inventário, digitação com pausa, congelado, seleção pelos três caminhos (mapa, árvore, diagnóstico), ficha dos três tipos, export e largura estreita.
- Os registros: ADR-0020 (o harness) e a entrada no `CHANGELOG.md`. Se mudar o `DESIGN.md`, também a nota do ADR-0018 e o `HEALTH.md`, conforme o §6 dele. Mais o `CLAUDE.md` e a memória do projeto.

## 8. O que fica com o builder

- As áreas e os nomes dos componentes, desde que sigam a §5.
- Qual primitiva do Base UI usar em cada caso.
- Como a área livre mede as ilhas (refs ou consulta por `data-feature`), desde que dê o mesmo resultado que o `safe()` da bancada.
- Como o editor recebe o pedido de selecionar um trecho (ação no store, ref, evento), desde que funcione a partir da árvore, da ficha e do rodapé.
- **Decisão do Claude:** o vendas.odds sai do mesmo gerador da bancada, `sourceOf(declared("one", "clean", 0, 0), "rich").text + "\n"` de `@odds/layout/fixtures`. Isso põe o gerador no bundle, um custo pequeno e aceito, para não manter uma segunda cópia do texto.
