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

**Também tomado, por decisão do autor em 2026-09-07 (segunda rodada):** a *direção* de paleta — **roxo como cor principal, com gradientes entre azul e roxo** — e o **fundo de manchas desfocadas**. A primeira versão deste arquivo dizia que a paleta não seria tomada e que o acento seria o azul de planta dos mocks; isso mudou por escolha explícita, e fica registrado aqui em vez de sumir. Os valores são nossos, harmonizados para esta interface — não os hexadecimais da referência.

**Não tomado, e segue não sendo:** o nome, a marca, a estrutura das páginas, a ilustração e qualquer texto. Uma referência ensina como um sistema se organiza e que temperatura ele tem; a identidade continua sendo coisa de cada produto — e a ODDS tem uma tese própria para comunicar, a de um linter que julga desenho estratégico.

**Consequência a resolver:** o canvas do playground estilizado ainda mostra o acento antigo (azul de planta). Ele fica incoerente com este arquivo até ser refeito.

---

## 2. Tipografia

Três famílias, três trabalhos. Nenhuma faz o trabalho da outra.

| Papel | Família | Onde |
|---|---|---|
| **Display** | **Montserrat** (a partir da v3) | Título de herói, títulos de seção grandes. Só isso |
| **Sans** | **Inter** | Todo texto de interface e de leitura: corpo, botões, rótulos, painéis |
| **Mono** | **JetBrains Mono** | Editor `.odds`, `DiagnosticCode`, spans (`L24:5`), pills, eyebrows, qualquer coisa que seja *dado* e não prosa |

Fallbacks com métrica próxima, sempre: `"Montserrat", "Inter", system-ui, sans-serif` · `"Inter", "Segoe UI", system-ui, sans-serif` · `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`.

### Escala

| Token | Tamanho / entrelinha | Peso | Ajuste | Uso |
|---|---|---|---|---|
| `display-hero` | 42px → 62px (≥640px) / 1.05 | 800 | `-0.04em` | Uma vez por página, no herói |
| `display-section` | 30px → 38px / 1.1 | 700 | `-0.03em` | Abertura de seção |

**Por que o ajuste de tracking mudou junto com a face.** A Montserrat é geométrica e **larga**: as contraformas redondas (`o`, `e`, `a`) ocupam mais espaço horizontal que as da Bricolage no mesmo corpo. Sem apertar o tracking para `-0.04em` e sem baixar o herói de 68px para 62px, a mesma frase quebra em uma linha a mais e o bloco perde a densidade. Peso 800 no herói, não 700: a Montserrat em 700 lê mais leve do que a Bricolage no mesmo número.
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
  --c-bg:        250 250 253;  /* #FAFAFD  fundo da página */
  --c-panel:     255 255 255;  /* #FFFFFF  card, ilha, painel */
  --c-panel2:    244 243 250;  /* #F4F3FA  faixa, trilho, estado inativo */
  --c-border:    230 228 242;  /* #E6E4F2 */
  --c-ink:        27  26  36;  /* #1B1A24  texto primário */
  --c-dim:       107 104 128;  /* #6B6880  texto secundário */
  --c-accent:    108  64 217;  /* #6C40D9  roxo: ação e seleção */
  --c-accent-lift:138  91 240; /* #8A5BF0  topo do gradiente do botão primário */
  --c-azure:      61 111 232;  /* #3D6FE8  ponta azul do gradiente azul→roxo */
  --c-pulse:      35 168 205;  /* #23A8CD  segundo acento, uso escasso */
  --c-solar:     255 197  61;  /* #FFC53D  terceira cor: superfície, nunca tinta */
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
  --c-bg:         18  17  26;  /* #12111A */
  --c-panel:      26  25  38;  /* #1A1926 */
  --c-panel2:     35  33  47;  /* #23212F */
  --c-border:     50  47  69;  /* #322F45 */
  --c-ink:       236 235 245;  /* #ECEBF5 */
  --c-dim:       154 151 174;  /* #9A97AE */
  --c-accent:    173 141 255;  /* #AD8DFF */
  --c-accent-lift:198 176 255; /* #C6B0FF */
  --c-azure:     125 163 255;  /* #7DA3FF */
  --c-pulse:      94 208 238;  /* #5ED0EE */
  --c-solar:     255 209  99;  /* #FFD163 */
  --c-error:     224 121 111;  /* #E0796F */
  --c-warning:   217 164  65;  /* #D9A441 */
  --c-info:      147 163 179;  /* #93A3B3 */
  --shadow-strength: .5;
}
```

Os neutros são **frios, com um sopro de violeta** (o cinza tem hue de roxo, não de bege): neutro quente ao lado de acento roxo lê como sujeira. O escuro é a mesma família invertida. Acento e pulse clareiam no escuro; manter o mesmo hex nos dois temas é o erro clássico, e ele aparece como um botão que some no fundo.

### O amarelo: superfície, nunca tinta

`--c-solar` (#FFC53D) é a terceira cor, e existe para **descaracterizar**: roxo com azul é a assinatura de meio mundo, e o amarelo quebra a temperatura sem brigar com nenhum dos dois — ele é o complementar aproximado do violeta-azul, então soma contraste em vez de disputar.

A regra que governa o uso dele é uma divisão de papéis, e ela é mais estreita do que parece:

> **Roxo e azul são a tinta** — ação, seleção, arestas, gradiente. **Amarelo nunca é tinta: é o chão em que se desenha.** Bloco, faixa, painel, superfície de numeral. Quando carrega texto, o texto é `--c-ink`.

O que essa fronteira resolve de uma vez:

- **Amarelo nunca é texto.** #FFC53D sobre branco não passa em contraste nenhum, e a regra torna isso estrutural em vez de uma lembrança.
- **A única cor de aviso continua sendo `--c-warning` (#A66A00)** — bem mais escura e menos saturada. E a confusão entre as duas só é possível na escala de chip: uma *faixa inteira* de cor nunca é lida como severidade. Amarelo grande é seguro; amarelo pequeno, ao lado de um diagnóstico, não é.
- **Amarelo nunca fica atrás nem embaixo de texto.** Marca-texto, sublinhado, realce de trecho — são todos tinta, e estão todos fora.

**O que a v3 tentou e por que caiu**, registrado aqui porque decisão de origem some primeiro: a redação anterior desta seção dizia apenas "grafismo, nunca estado", e por essa fresta passaram uma risca de marca-texto sob a última linha do título do herói e um fundo solar a 55% atrás dos numerais `01`/`02`/`03`. As duas foram recusadas na v4. O defeito não era a cor: era gastar em enfeite o gesto mais carregado deste produto — **marcar alguma coisa aqui é um veredito com severidade** —, numa cor a um passo do `--c-warning`.

**Uma prova de que a regra fecha**, e é o motivo de a composição do herói ser o que é: o marcador de erro da ilustração é vermelho e viraria lama sobre amarelo. Por isso o mapa vive num painel branco *à frente* do bloco solar, nunca em cima dele. O amarelo é o espaço atrás; o veredito acontece no branco.

### Três regras de cor, e elas não são estéticas

1. **Acento nunca comunica severidade.** Azul é *ação e seleção*; erro, aviso e info têm as três cores funcionais e mais nada. Um botão azul dentro de uma linha de erro não vira "erro azul" — continua sendo um botão.
2. **Severidade nunca depende só de cor.** Cada uma carrega ícone próprio — círculo com X, triângulo, círculo com i —, porque daltonismo e export em escala de cinza são reais, e o `PRD.md` §5.2 manda o export sair *com* os marcadores.
3. **O gradiente é sempre roxo → azul**, na mesma ordem (`--c-accent` → `--c-azure`), e aparece no máximo **duas vezes por tela**: uma no botão primário, uma numa expressão do título de herói. A partir da terceira ele deixa de ser ênfase e vira textura. Gradiente nunca atravessa texto de leitura — só título de display e superfície de botão.

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

## 4.1 Atmosfera: manchas desfocadas

O fundo da landing não é chapado. Quatro a cinco **manchas** circulares, muito desfocadas e muito esmaecidas, ficam atrás de tudo e derivam devagar. É o que dá profundidade sem sujar nenhuma superfície de leitura.

```css
.blob { position: absolute; border-radius: 50%; filter: blur(64px);
        background: radial-gradient(circle, <cor>, transparent 65%); }
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(3%, -4%) scale(1.06); }
  66%      { transform: translate(-3%, 3%) scale(.97); }
}
/* 16s ease-in-out infinite, com delay NEGATIVO diferente em cada mancha */
```

Regras que fazem a diferença entre atmosfera e borrão:

- **Tamanho grande, opacidade baixa:** 22–34rem de diâmetro, opacidade entre **0,28 e 0,50**. Mancha pequena e forte vira bola; grande e fraca vira luz.
- **Blur de 64px, sempre.** Menos que isso deixa a borda visível e o efeito vira adesivo.
- **Delay negativo por mancha** (`-5s`, `-9s`, `-12s`): sem isso as quatro pulsam em uníssono e o fundo respira como um bicho.
- **Paleta pálida, dentro da família azul→roxo:** violeta claro, azul claro, ciano claro. Uma quarta mancha pode sair da família para dar variação, nunca duas — o fundo é atmosfera, não arco-íris.
- **Nunca atrás de texto pequeno.** Manchas vivem no herói, no CTA final e nas bordas das seções; texto de leitura fica sobre superfície plana.
- Em `prefers-reduced-motion: reduce` elas **param** — continuam ali, sem deriva.

## 4.1.1 A prancheta em perspectiva

O motivo gráfico da casa: uma **grade em perspectiva** que recua até o horizonte, atrás do herói e atrás do CTA final. É uma prancheta vista de lado — e para uma ferramenta que desenha arquitetura, ela diz mais do que qualquer ilustração.

Feita sem imagem e sem biblioteca: um `div` com duas `linear-gradient` de 1px formando a malha, `transform: perspective(600px) rotateX(62deg)`, e um `mask-image` que dissolve a grade antes do horizonte. Linhas a ~8% do acento; mais que isso vira papel milimetrado.

## 4.2 Arte do herói

O herói é um **editor e um mapa lado a lado, ligados por uma passada de animação de 3,4 s**. A cena, fixada na v4 e chamada *o lado da linha*: uma tag está do lado errado do conector — o que é `UPSTREAM_ONLY_TAG_MISPLACED`, fase 4, severidade `error` — e um único gesto a atravessa para o outro lado. O mapa se cura: a aresta costura de vermelho para roxo, o marcador recolhe, o contador rola `1 → 0`.

Ela conta *o que a ferramenta faz* e depois sai da frente: uma passada, nunca um laço.

Quatro restrições, e as duas últimas importam mais do que parecem:

1. Sem dependência: SVG inline, animado em CSS. Nada de biblioteca de animação por causa de uma ilustração.
2. **A arte do herói é ilustração, não especificação de render.** Ela é deliberadamente abstrata — sem rótulo de contexto, sem tag desenhada na linha — porque o desenho do diagrama de verdade espera a escolha da biblioteca (`ADR-0007`). Se a ilustração ficar fiel demais, ela decide por antecipação o que aquele ADR mantém em aberto.
3. **O que se move é o texto; o mapa reage.** A tag atravessa o conector *no editor*, não sobre a aresta. Isso mantém a restrição 2 ao pé da letra e diz, sem legenda, o que o `ADR-0003` defende: o texto é a fonte única e o diagrama nunca escreve de volta.
4. **O estado natural do CSS é o mapa curado.** A animação parte do estado acusado e volta ao natural, em vez do contrário. Consequência prática: `prefers-reduced-motion: reduce` desliga tudo e sobra o frame final legível, sem nenhuma media query duplicando valores — e esse frame final é a composição do herói, que é o que a maioria das pessoas vai ver.

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
