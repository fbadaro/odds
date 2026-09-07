# DESIGN

O sistema visual do produto ODDS: cor, tipografia, elevação, forma, ritmo e os componentes que se repetem. Vale para as duas telas que o `PRD.md` descreve — a página de apresentação e o playground — e para tudo que vier depois delas.

**O que este arquivo é.** Normativo para a interface: quando um mock ou um componente divergir daqui, quem está errado é o mock. **O que ele não é:** não faz parte da `ODDS Language Version`, não muda o significado de nenhum `.odds`, e não entra no ciclo fixo de adicionar regra do `CLAUDE.md`. Onde ele encostar num requisito de produto, o `PRD.md` manda.

Estado: **rascunho de trabalho**. A origem está registrada abaixo porque decisão de origem some primeiro e é a que mais gera discussão depois.

---

## 1. Origem, e a linha que não se cruza

O vocabulário abaixo foi extraído de uma referência trazida pelo autor: <https://studio.mjolnix.com.br/>. O que foi tomado é o **método** — como o sistema é construído — e não a identidade.

**Tomado:**

| Coisa | O que é |
|---|---|
| Arquitetura de tokens | Cores como *triplas RGB* em variável CSS (`--c-accent: 43 76 140`), consumidas com `rgb(var(--c-accent) / <alpha>)`. É o que permite opacidade sem duplicar cor |
| `--shadow-strength` por tema | Uma variável por tema multiplicando a opacidade de toda sombra. Sombra colorida que funciona no claro fica invisível no escuro; um número resolve os dois |
| Três famílias com papéis fixos | display / sans / mono, cada uma com um trabalho e nenhuma sobreposição |
| A *eyebrow* monoespaçada | 11px, caixa alta, `letter-spacing: .22em`, cor secundária. Sinaliza seção sem gastar tamanho |
| A *pill* monoespaçada | Borda 1px, fundo de painel, raio total, texto 12px mono. O elemento mais repetido da referência, e o mais barato de acertar |
| Sombra colorida com espalhamento negativo | `0 18px 44px -22px rgb(accent / .28)` — sombra que tinge em vez de escurecer |
| Malha de fundo | Grade de 28px a ~7% do acento, atrás do herói e do canvas |

**Não tomado, e é deliberado:** a paleta (violeta + ciano é a identidade *deles*), o nome, a marca, a estrutura das páginas, a ilustração e qualquer texto. Uma referência ensina como um sistema se organiza; copiar a identidade seria vestir a roupa de outro produto — e a ODDS tem uma tese própria para comunicar, a de um linter que julga desenho estratégico.

O acento da ODDS é o **azul de planta** que já vinha sendo usado nos mocks (`docs/design/README.md`), não o violeta da referência.

---

## 2. Tipografia

Três famílias, três trabalhos. Nenhuma faz o trabalho da outra.

| Papel | Família | Onde |
|---|---|---|
| **Display** | **Bricolage Grotesque** | Título de herói, títulos de seção grandes. Só isso |
| **Sans** | **Inter** | Todo texto de interface e de leitura: corpo, botões, rótulos, painéis |
| **Mono** | **JetBrains Mono** | Editor `.odds`, `DiagnosticCode`, spans (`L24:5`), pills, eyebrows, qualquer coisa que seja *dado* e não prosa |

Fallbacks com métrica próxima, sempre: `"Bricolage Grotesque", "Inter", system-ui, sans-serif` · `"Inter", "Segoe UI", system-ui, sans-serif` · `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`.

### Escala

| Token | Tamanho / entrelinha | Peso | Ajuste | Uso |
|---|---|---|---|---|
| `display-hero` | 42px → 60px (≥640px) / 1.04 | 700 | `-0.025em` | Uma vez por página, no herói |
| `display-section` | 30px → 34px / 1.12 | 700 | `-0.02em` | Abertura de seção |
| `title` | 20px / 1.3 | 600 | `-0.01em` | Título de card |
| `body-lg` | 18px / 1.65 | 400 | — | Subtítulo do herói, parágrafo de destaque |
| `body` | 16px / 1.6 | 400 | — | Texto corrente |
| `ui` | 13px / 1.4 | 400–500 | — | Interface densa: botões, rótulos, listas do playground |
| `ui-sm` | 12px / 1.35 | 400–500 | — | Metadados, contadores |
| `code` | 13px / 20px | 400 | — | Editor e trechos `.odds` |
| `eyebrow` | 11px / 1 | 500 | `+0.22em`, caixa alta | Rótulo de seção, mono |
| `mono-xs` | 11px / 1.3 | 400 | — | `DiagnosticCode`, span de linha/coluna |

Pesos usados: **400, 500, 600, 700**. Não há 300 nem 800 — quatro pesos cobrem tudo e um quinto só cria discussão.

**Regra de mono.** Monoespaçado é sinal de *dado literal*, não de estilo. Um `DiagnosticCode`, um nome de contexto citado, um span, uma tag `[OHS]`: mono. Uma frase sobre eles: sans. Essa fronteira é a mesma que o `MESSAGES.md` mantém entre `data` e prosa, e vale a pena que a tela a torne visível.

---

## 3. Cor

Tokens como triplas RGB, para que a opacidade não exija uma segunda cor.

### Tema claro (padrão)

```css
:root {
  color-scheme: light;
  --c-bg:        248 248 246;  /* #F8F8F6  fundo da página */
  --c-panel:     255 255 255;  /* #FFFFFF  card, ilha, painel */
  --c-panel2:    242 242 238;  /* #F2F2EE  faixa, trilho, estado inativo */
  --c-border:    230 230 225;  /* #E6E6E1 */
  --c-ink:        27  27  25;  /* #1B1B19  texto primário */
  --c-dim:       110 110 103;  /* #6E6E67  texto secundário */
  --c-accent:     43  76 140;  /* #2B4C8C  azul de planta: ação e seleção */
  --c-accent-lift: 60 107 196; /* #3C6BC4  topo do gradiente do botão primário */
  --c-pulse:      15 124 138;  /* #0F7C8A  segundo acento, uso escasso */
  --c-error:     192  52  43;  /* #C0342B */
  --c-warning:   166 106   0;  /* #A66A00 */
  --c-info:       91 107 124;  /* #5B6B7C */
  --shadow-strength: .14;
}
```

### Tema escuro

```css
[data-theme="dark"] {
  color-scheme: dark;
  --c-bg:         23  23  21;  /* #171715 */
  --c-panel:      30  30  27;  /* #1E1E1B */
  --c-panel2:     38  38  34;  /* #262622 */
  --c-border:     51  51  45;  /* #33332D */
  --c-ink:       242 241 236;  /* #F2F1EC */
  --c-dim:       163 162 154;  /* #A3A29A */
  --c-accent:    127 166 232;  /* #7FA6E8 */
  --c-accent-lift: 157 189 242;/* #9DBDF2 */
  --c-pulse:      79 200 214;  /* #4FC8D6 */
  --c-error:     224 121 111;  /* #E0796F */
  --c-warning:   217 164  65;  /* #D9A441 */
  --c-info:      147 163 179;  /* #93A3B3 */
  --shadow-strength: .5;
}
```

O escuro é **neutro quente**, a mesma família do claro invertida — não azul-acinzentado. Acento e pulse clareiam no escuro; manter o mesmo hex nos dois temas é o erro clássico, e ele aparece como um botão que some no fundo.

### Três regras de cor, e elas não são estéticas

1. **Acento nunca comunica severidade.** Azul é *ação e seleção*; erro, aviso e info têm as três cores funcionais e mais nada. Um botão azul dentro de uma linha de erro não vira "erro azul" — continua sendo um botão.
2. **Severidade nunca depende só de cor.** Cada uma carrega ícone próprio — círculo com X, triângulo, círculo com i —, porque daltonismo e export em escala de cinza são reais, e o `PRD.md` §5.2 manda o export sair *com* os marcadores.
3. **O gradiente aparece no máximo duas vezes por tela:** uma no botão primário, uma opcional numa expressão do título de herói. A partir da terceira, ele deixa de ser ênfase e vira textura.

---

## 4. Elevação

Sombra aqui **tinge**, não escurece: a cor sai do acento e o espalhamento é negativo, de modo que a sombra fica menor que o elemento e sugere altura sem sujar a borda.

```css
--sh-sm:    0 1px 2px rgb(27 27 25 / calc(var(--shadow-strength) * .4));
--sh-card:  0 18px 44px -22px rgb(var(--c-accent) / calc(var(--shadow-strength) * 2));
--sh-cta:   0 10px 30px  -8px rgb(var(--c-accent) / calc(var(--shadow-strength) * 4));
--sh-island:0 2px 10px       rgb(27 27 25 / calc(var(--shadow-strength) * .5));
--sh-lift:  0 22px 48px -20px rgb(var(--c-accent) / calc(var(--shadow-strength) * 5));  /* :hover de card */
```

Quatro níveis e nada mais: **repouso** (`sm`, borda de 1px faz o trabalho), **card**, **ação** (`cta`) e **ilha** (o chrome flutuante do playground, que precisa se separar do canvas sem parecer marketing). `lift` é estado, não nível.

Sombra nunca sai de cor funcional: não existe sombra vermelha em elemento com erro. O marcador comunica; a sombra é profundidade.

---

## 5. Forma

| Token | Valor | Uso |
|---|---|---|
| `r-pill` | 999px | Pills, contadores de severidade, badges |
| `r-card` | 16px | Cards, painéis grandes, ilhas do playground |
| `r-button` | 12px | Botões e campos altos |
| `r-control` | 8px | Controles densos: segmented, botão de ícone, quadrados do trilho |
| `r-chip` | 6px | Chip de code, chip de tag `[OHS]` |
| `r-mark` | 3px | Nó do diagrama, marcador no canvas |

Borda é sempre **1px** e sempre `--c-border`. Não há borda de 2px no sistema: ênfase se faz com fundo, cor de texto ou sombra — nunca engrossando linha, que é o caminho mais rápido para uma tela parecer um formulário antigo.

---

## 6. Espaçamento e ritmo

Base **4px**. A escala usada é `4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 64 · 96`.

| Contexto | Valor |
|---|---|
| Largura de leitura (landing) | 1152px, gutter 24px |
| Respiro de seção (landing) | 96px vertical (64px abaixo de 640px) |
| Padding de card | 24px, 32px nos cards grandes |
| Gap padrão dentro de pill/linha | 8px |
| Altura de controle | 30px denso (playground), 44px confortável (landing) |
| Alvo de toque mínimo | 44px |
| Linha de lista (diagnósticos) | 34px |
| Cabeçalho de painel | 36px |

O playground é **denso**; a landing é **espaçosa**. É a mesma paleta e a mesma tipografia com duas densidades, e a diferença é deliberada: uma tela é lida uma vez, a outra é habitada.

---

## 7. Componentes

**Pill mono** — o elemento mais repetido do sistema.
`r-pill` · borda 1px `--c-border` · fundo `--c-panel` · padding `6px 14px` · mono 12px · `--sh-sm` · gap 8px quando leva ícone ou ponto de status.

**Eyebrow** — mono 11px, caixa alta, `letter-spacing: .22em`, `--c-dim`. Abre seção na landing e nomeia painel no playground.

**Card** — `r-card` · borda 1px · fundo `--c-panel` · padding 24–32px · `--sh-card`. No hover (só na landing): `--sh-lift` e elevação de 4px, com `prefers-reduced-motion` respeitado.

**Botão primário** — `r-button` · gradiente vertical `--c-accent-lift` → `--c-accent` · texto branco 600 · padding `12px 24px` · `--sh-cta` · hover `brightness(1.08)`.

**Botão secundário** — mesma caixa, fundo `--c-panel`, borda 1px, texto `--c-ink` 600, `--sh-sm`; hover troca a borda para `rgb(var(--c-accent) / .5)`.

**Contador de severidade** — `r-pill`, fundo com 8% da cor funcional, texto na cor funcional escurecida, ícone à esquerda, número em mono. Três deles lado a lado no rodapé do playground, e eles são filtro, não enfeite.

**Chip de code** — `r-chip`, mono 11px, fundo com 8% da cor funcional. Carrega o `DiagnosticCode` literal, nunca a frase.

**Ilha** — `r-card`, borda 1px, fundo `--c-panel`, `--sh-island`. É o chrome flutuante do playground: identidade, troca de vista, ações, zoom, diagnósticos.

**Malha de fundo** — grade de 28px na landing (`rgb(var(--c-accent) / .07)`) e de 22px no canvas do playground, em pontos em vez de linhas. A landing usa linha porque é atmosfera; o playground usa ponto porque é referência de posição.

---

## 8. Movimento

Duas animações e nenhum enfeite: **rise** na entrada do herói (translação de 8px + opacidade, 0.7s, `cubic-bezier(.2,.7,.2,1)`, escalonada em 80ms por elemento) e **lift** no hover de card. O playground não anima nada além do estritamente funcional — abrir e fechar painel, 180ms.

Tudo isso desliga em `prefers-reduced-motion: reduce`. Não é acessibilidade opcional: um diagrama que se move enquanto alguém lê um erro atrapalha a única tarefa da tela.

---

## 9. Onde isto se aplica

- **Landing** — página de apresentação, com link para o playground. Densidade espaçosa, display grande, pills e cards.
- **Playground** — a tela do produto. A base de layout é a variante D do canvas de exploração (`docs/design/README.md`); este arquivo dá a ela cor, tipo, elevação e forma.

Ainda **em aberto**, e propositalmente: o desenho da renderização do diagrama e os estados de degradação do `PRD.md` §5.2, que esperam a escolha da biblioteca (`ADR-0007`).
