# A aplicação `apps/playground` e a fundação que ela exige: design

Data: 2026-10-21 · Branch de origem: `design/colmeia-playground` · Decisões de stack: `ADR-0014`, `ADR-0015`

## 1. Intenção

Fazer nascer a **aplicação** do ODDS em React, separada da **bancada** de exploração, com uma estrutura que o autor consiga navegar e ajustar sozinho, sem pedir a uma IA.

O autor vai manter a aplicação pessoalmente, e o pedido dele foi direto: *"eu preciso ter a facilidade de fazer ajustes sem ter que gastar tokens para isso"*. Daí vêm as três exigências que governam o resto do documento:

- **Estrutura previsível.** É o padrão que qualquer pessoa com experiência em React, ou qualquer IA, já conhece, e achar onde mexer não pode depender de conhecer o ODDS.
- **Pouco código nosso.** O comportamento vem de dependência (Base UI, `ADR-0014`), não de código copiado.
- **O ajuste parte do nome do componente.** O estilo mora ao lado dele, e o que é do sistema inteiro mora num lugar só.

### Vocabulário deste documento

| Termo | O que é |
|---|---|
| **bancada** | `docs/design/pages/playground.html` (e as páginas `colmeia-*` irmãs): HTML e JavaScript puro, onde ideias de interface nascem e são validadas (`ADR-0007`) |
| **aplicação** | `apps/playground`: o produto em React, que implementa só o que a bancada validou |

Os dois se chamam "playground" hoje. Renomear qualquer um deles fica fora deste trabalho.

## 2. O ciclo bancada → aplicação (decidido pelo autor)

> *"A bancada continua como um cenário de experimento, e depois a aplicação implementa uma ideia validada."*

- A bancada continua viva, e a regra de trabalho de 2026-10-16 continua valendo: feature nova de UI nasce nela.
- A aplicação **não inventa interface**. Para ela, a bancada é a especificação visual e de comportamento.
- As duas compartilham **código de biblioteca, nunca de tela**: `@odds/core`, `@odds/messages` e o novo `@odds/layout`.

## 3. Objetivos

1. **`@odds/layout` existe como pacote.** O layout da colmeia sai de `docs/design/pages/colmeia-v4.html` para `packages/layout`, em TypeScript, sem DOM e sem React (`ADR-0009`). As garantias que o `colmeia-v4.check.mjs` confere (localidade, invariância à ordem, zero movimento por tag ou conector) viram testes do Vitest do pacote, e passam.
2. **A bancada consome o pacote.** O `colmeia-embed.mjs` passa a embutir o `@odds/layout` compilado, como já embute o core, em vez do script da v4. A bancada não pode ficar com uma segunda cópia do layout.
3. **Os tokens são gerados do `DESIGN.md`.** Um gerador lê o front matter YAML e escreve `apps/playground/src/styles/tokens.css`. Um plugin do Vite regenera o arquivo ao salvar o `DESIGN.md`, então a aplicação aberta atualiza sem comando. Um teste falha se o `tokens.css` versionado divergir do `DESIGN.md`, no mesmo modelo do `messages.json` / `MESSAGES.md` (`CLAUDE.md`, *Build, test, typecheck*).
4. **Sombras e gradiente vão para o front matter do `DESIGN.md`**, como tokens (decidido pelo autor). Hoje estão só na prosa, como CSS.
5. **`apps/playground` existe**, com o esqueleto descrito na §5, e roda com `npm run dev`. O build gera um site estático.
6. **O primeiro incremento prova a costura entre React e colmeia** (§7): digitar `.odds` num editor e ver a colmeia e os contadores de diagnóstico atualizarem, com a colmeia fora do React.
7. **O ambiente acompanha:** Vitest atualizado para a linha 5 (custo nomeado no `ADR-0015`), com os 44 golden files e todos os testes atuais passando; ESLint configurado; `npm test`, `npm run typecheck` e o `health_check.py` verdes.

## 4. Não-objetivos

- **Reproduzir a bancada inteira.** Ficha de propriedades, trilho, painéis, zoom, export, URL compartilhável e auto-save entram depois, uma ideia validada por vez, e cada uma é um trabalho próprio.
- **Construir os sete componentes padrão de uma vez.** Os componentes de `components/ui/` nascem quando uma feature precisa deles. Construí-los antes de haver uso é decidir no vazio, o mesmo argumento do `ADR-0005` para adiar o linter.
- **A landing page.** O autor vai decidir depois se ela entra na aplicação ou vira site próprio.
- **Mudar a bancada além do necessário para o objetivo 2.** Os nomes de variáveis CSS dela (`--c-bg`, `--c-panel`…) ficam como estão.
- **Renomear bancada ou aplicação.**

## 5. Estrutura (decidida pelo autor)

O padrão do template do Vite, com `src/` organizado por funcionalidade no modelo do bulletproof-react, e a aplicação em `apps/` (convenção de monorepo: `apps/` é o que se publica, `packages/` é biblioteca):

```
apps/
  playground/
    index.html
    public/
    vite.config.ts
    src/
      main.tsx
      App.tsx
      components/
        ui/                      ← componentes padrão, nossos, sobre o Base UI
          Button/
            Button.tsx
            Button.module.css
      features/
        <área>/
          components/            ← os componentes da funcionalidade, cada um com seu .module.css
          hooks/
          types.ts
      hooks/                     ← compartilhados
      lib/                       ← onde a aplicação conversa com core, messages, layout
      stores/                    ← estado de interface
      styles/
        tokens.css               ← GERADO do DESIGN.md, nunca editado à mão
        global.css
packages/
  core/  messages/  layout/
```

Regras que a estrutura carrega:

- **As features importam de `components/ui/`, nunca de `@base-ui/react` direto.** É o que mantém a troca de biblioteca barata (`ADR-0014`, *Reversão*). O ESLint deve impor isso (`no-restricted-imports`), em vez de depender de lembrar.
- **Nenhum pacote de `packages/` importa React nem toca DOM.** O `@odds/layout` depende só do `@odds/core`, para os tipos do AST.
- **Todo `.module.css` usa só tokens**, nunca valor cru de cor, raio, espaço ou sombra.
- O `package.json` da raiz passa a declarar `"workspaces": ["packages/*", "apps/*"]`.

### 5.1 A fronteira do pacote (escolha minha)

O desenho que a bancada mostra não é só o script da v4. O `playground.html` acrescenta peças por cima: `toModel(ast)` (AST → modelo da v4), `targetOf` e as âncoras (diagnóstico → elemento), `navOf`, e `decorate()`, que reescreve o SVG por regex (`data-type`, relação inválida na vista de fluxo, rótulos de longe). E o `build()` da v4 lê um `state` global mutável (`view`, `tags`, `filt`, `selDiag`).

A regra que separa o que vai para `packages/` do que fica em cada tela:

- **Vai para o pacote tudo o que transforma dados em geometria ou em SVG.** Inclui `toModel`, `targetOf`/âncoras, `navOf` e o que o `decorate()` faz. O `decorate()` deixa de ser reescrita por regex e passa a ser parte da montagem do SVG.
- **O estado vira parâmetro.** A montagem recebe `(AST, diagnósticos, opções de vista)` explicitamente (vista, tags, filtro, diagnóstico selecionado, rótulos) e não lê global nenhum. É função pura, como o `ADR-0009` exige do layout.
- **Fica em cada tela o que é interação:** clique, câmera (pan/zoom), seleção, foco, teclado e a costura com o editor.

Com isso, o objetivo 2 reescreve no `playground.html` só o que chama essas funções. As peças acima saem dele, em vez de ficarem duplicadas.

### 5.2 O CSS do desenho (escolha minha)

O CSS do SVG mora hoje no `<style>` da v4 (embutido como `V3CSS`). Ele usa os nomes da bancada (`--c-bg`, `--c-panel`, `--c-dim`, `--c-border`) e variáveis próprias do mapa (`--tile-core`, `--tile-sup`, `--tile-gen`, `--tile-edge`, `--mix-*`) que não existem no `DESIGN.md`.

- **O pacote publica um arquivo CSS do desenho**, com variáveis próprias e prefixadas (`--odds-map-*`) e valores padrão. É uma fonte só, consumida pelas duas telas.
- **Cada tela liga os próprios tokens às variáveis do desenho**, num bloco curto de apelidos: a bancada a partir de `--c-bg`…, a aplicação a partir de `--c-canvas`…
- **As cores do mapa não entram no `DESIGN.md` neste trabalho.** O `ADR-0013` deixou as cores do diagrama sem token de propósito, até serem decididas, e o `DESIGN.md` declara isso na seção de escopo. O trabalho no `DESIGN.md` fica restrito a sombras e gradiente.

### 5.3 Quais páginas da bancada mudam (escolha minha)

- **Passam a embutir o `@odds/layout`:** as duas páginas que hoje montam a partir do `colmeia-embed.mjs`, que são o `playground.html` e a `colmeia-ao-vivo.html`. Elas mudam juntas, pelo próprio script compartilhado.
- **`colmeia-v4.html` congela como registro histórico do `ADR-0010`**, com um aviso no topo de que o layout vivo é o pacote. Não é cópia viva: ninguém a edita mais.
- **As demais `colmeia-*` também congelam.** A `colmeia-navegacao` já está congelada desde 2026-10-10.
- **Os fixtures do `colmeia-v4.check.mjs`** (`MODELS`, `BREAKS`, `EXTRA`, `sourceOf`) e o gerador do marketplace de 50 contextos (`colmeia-50.model.mjs` com `colmeia-navegacao.docs.mjs`) **viram fixtures de teste do `@odds/layout`**. É de lá que a aplicação tira o texto de exemplo.

## 6. Estilo e tokens

Duas camadas (`ADR-0014`):

1. **Tokens**, variáveis CSS globais geradas do front matter do `DESIGN.md`.
2. **Componentes**, um `.module.css` ao lado de cada `.tsx`. A variante de tamanho e de cor é uma classe do módulo que troca quais tokens o componente lê.

O `DESIGN.md` manda nos **valores**, não nos nomes dos componentes no código.

O gerador:

- Cores viram **triplets RGB** (`--c-accent: 108 64 217;`), consumidos com `rgb(var(--c-accent) / <alpha>)`, como o `DESIGN.md` já prescreve na seção *Colors*.
- As chaves com sufixo `-dark` (`accent-dark`) compõem o bloco `[data-theme="dark"]`; as demais, o `:root`.
- **Os nomes das variáveis seguem os nomes do `DESIGN.md`** (`--c-canvas`, `--c-surface`, `--c-ink-mute`), não os da bancada (`--c-bg`, `--c-panel`, `--c-dim`). A aplicação nasce nova e não tem o que migrar.
- Raios, espaços e tipografia viram variáveis pelos grupos do front matter (`rounded`, `spacing`, `typography`).
- Sombras e gradiente, depois do objetivo 4, saem do front matter como as demais. `--shadow-strength`, que varia por tema, entra como token com a variante `-dark`.
- **Forma dos valores compostos no front matter (escolha minha):** um grupo novo, `elevation`, com strings CSS que referenciam outros tokens pela sintaxe do próprio formato (`{colors.accent}`, `{elevation.shadow-strength}`). O gerador resolve essas referências para `var(--…)`. A sintaxe de referência do formato é preservada, e o `calc()` e o alfa ficam como CSS literal. Se a ferramenta do formato `design.md` não ler o grupo, o arquivo continua válido como texto: o que depende dele é o nosso gerador. Esse é o sinal de *Reversão* do `ADR-0013` a observar.
- O grupo `components` do front matter **não** gera CSS: é especificação visual para quem escreve o `.module.css`.

## 7. O primeiro incremento

A tela mínima que prova a decisão mais arriscada do `ADR-0014`, que é a costura entre o React no chrome e a colmeia imperativa:

- um editor de texto `.odds`, que nesta fase pode ser um `<textarea>` com a fonte mono e ligaduras desligadas, como o `DESIGN.md` pede;
- a colmeia renderizada a partir do texto: `@odds/core` → `@odds/layout` → string SVG, injetada num contêiner que o React não reconcilia;
- os contadores por severidade (erro, aviso, info, cada um com seu ícone), lidos dos diagnósticos;
- o comportamento que a bancada já validou: o layout roda depois de **300 ms de pausa** na digitação, e um `SYNTAX_ERROR` puro **congela o último diagrama bom, marcado como obsoleto** (`ADR-0009`, `PRD.md` §5.2);
- um `.odds` de exemplo carregado de início. O marketplace de 50 contextos (`colmeia-50.model.mjs`) é o caso que mede desempenho.

- **Vista e opções iguais às da bancada ao abrir:** vista de fluxo, tags ligadas, rótulos de contexto. O primeiro incremento não traz alternador de vista.
- **Layout na thread principal**, como na bancada: os ~170 ms do marketplace de 50 contextos foram aprovados pelo autor nesse arranjo. Web Worker fica fora, e entra só se o critério abaixo falhar. Mesmo assim, a API do pacote deve receber e devolver dados serializáveis, para que essa porta não feche.

**Pronto quando:** digitar no marketplace de 50 contextos não trava o editor, e a colmeia e os contadores refletem o texto depois da pausa, **com o mesmo comportamento da bancada** (paridade, não meta nova).

## 8. Escolhas minhas (Claude), a conferir na leitura

O autor não as discutiu; foram propostas na conversa sem veto, e ficam aqui marcadas como minhas.

| Escolha | Por quê |
|---|---|
| **Estado:** o texto `.odds` é o único estado de verdade. AST, diagnósticos e geometria são **derivados**, nunca guardados à parte. Estado de interface (seleção, painel aberto, tema, zoom) num store **Zustand** | `ADR-0003` (o texto é fonte única). Zustand tem ~1 KB e quase nenhuma cerimônia. Redux seria peso para uma tela só |
| **React Compiler** ligado | Faz a memoização que se escreveria à mão com `useMemo`/`useCallback`: menos código nosso |
| **Testes:** Vitest 5 + Testing Library; ponta a ponta no navegador fica de fora por ora | Teste de navegador só se justifica quando houver fluxo |
| **ESLint** com as regras oficiais de hooks do React e `no-restricted-imports` para o Base UI | O `ADR-0005` adiou o linter até haver código para discutir; com React, há |
| **Ordem:** `@odds/layout` primeiro, depois a aplicação | A aplicação não tem diagrama sem o pacote |
| **Editor do primeiro incremento é `<textarea>`** | Escolher um editor de código (CodeMirror, Monaco) é decisão própria, com peso de dependência, e o incremento existe para provar a costura, não o editor |
| **A colmeia renderiza a partir de `packages/`**, inclusive a montagem da string SVG, para que a bancada a embuta sem cópia | O objetivo 2 exige isso: se o SVG fosse montado na aplicação, a bancada continuaria com a própria cópia |

## 9. Restrições

- **100% no navegador**: sem servidor, sem armazenamento remoto (`PRD.md`).
- `@odds/core` não ganha dependência de `@odds/messages` (`ADR-0004`).
- **Nada da linguagem muda**: a `ODDS Language Version`, os golden files e o comportamento do validador ficam como estão.
- O `messages.json` continua gerado do `MESSAGES.md`, como hoje.
- **ADRs a escrever no passe**, pela autorização do `ADR-0001`:
  - a aplicação em `apps/` (o `ADR-0004` previa um `@odds/playground` em `packages/`);
  - o ciclo bancada → aplicação, que muda um protocolo de trabalho;
  - os tokens gerados do `DESIGN.md`, que é a saída prevista na *Reversão* do `ADR-0013`;
  - as práticas da §8 que adotam dependência (Zustand, React Compiler, ESLint).
- O passe fecha com `CHANGELOG.md` e `HEALTH.md` (R6.4 e R6.6, sob a rubrica da §9.2).

## 10. Deixado ao construtor

- Como o código da v4 se divide em módulos dentro de `packages/layout` (geometria, roteamento, territórios, montagem do SVG), e se a montagem do SVG vira uma segunda entrada do pacote ou um pacote próprio. Vale uma regra só: sem DOM e sem React.
- A forma da API do `@odds/layout`, contanto que receba o AST validado e devolva geometria e SVG.
- O formato exato do gerador de tokens (script Node chamado pelo plugin do Vite, ou o plugin fazendo tudo).
- Os nomes das variáveis de tipografia, raio e espaço.
- A configuração do ESLint além das duas regras citadas.
- Como o editor e a colmeia trocam eventos no primeiro incremento, contanto que a colmeia fique fora da reconciliação do React.
