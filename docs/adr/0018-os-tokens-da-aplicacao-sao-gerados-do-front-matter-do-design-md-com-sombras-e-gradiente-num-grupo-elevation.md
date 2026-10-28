---
adr: 0018
title: Os tokens da aplicação são gerados do front matter do DESIGN.md, com sombras e gradiente num grupo elevation
status: accepted
date: 2026-10-22
deciders: Fabio Badaro, Claude
tags: ui, design-system, build, playground
supersedes: —
---

# ADR-0018 — Os tokens da aplicação são gerados do front matter do DESIGN.md, com sombras e gradiente num grupo elevation

> **Nota de 2026-10-23, só de contexto.** Na paridade com a bancada, o front matter do `DESIGN.md` ganhou a linha do mapa (`edge`, `edge-lit`, `edge-far`) e as tintas por tipo (`core-ink`, `sup-ink`, `gen-ink`), com as variantes escuras. O gerador os absorveu sem caso especial, então o sinal da *Reversão* não disparou. Mas o custo da volta cresceu como a *Reversão* previa: 32 `.module.css` de `apps/playground` constroem agora sobre os nomes do front matter. Nada do que este ADR decidiu muda.

## Contexto

O `ADR-0013` fez do `DESIGN.md` a fonte única do sistema visual, com os tokens no front matter YAML do formato `design.md`. Ele recusou, por ora, um arquivo de tokens de máquina separado, porque dois arquivos para uma fonte única reabrem a deriva entre texto e valor e não havia build de UI que gerasse um a partir do outro. A *Reversão* dele deixou a saída nomeada: tokens num arquivo de máquina *gerado ou validado por build*, quando houvesse framework e bundler. O `ADR-0014` (React, CSS Modules sobre variáveis CSS globais) e o `ADR-0015` (Vite) tornaram isso possível, e o `ADR-0014` deixou a forma para a conversa sobre como construir a aplicação.

Em 2026-10-21 essa conversa encontrou três fatos:

- O `DESIGN.md` trazia um bloco CSS escrito à mão na seção *Colors*, com os nomes da bancada (`--c-bg`, `--c-panel`, `--c-dim`), e as páginas da bancada copiavam esse bloco à mão. Os nomes do front matter eram outros (`canvas`, `surface`, `ink-mute`).
- **Sombras e gradiente não estavam no front matter.** Existiam só na prosa, como CSS, e uma delas, `--shadow-strength`, muda por tema. O formato `design.md` não tem um grupo pronto para valores compostos.
- O repositório já tinha um precedente para derivado versionado: o `messages.json` é gerado do `MESSAGES.md` e um teste falha se os dois divergirem (`MESSAGES.md` §8).

## Decisão

**O `apps/playground/src/styles/tokens.css` é gerado do front matter do `DESIGN.md`, versionado, e nunca editado à mão.** O gerador é `apps/playground/scripts/generate-tokens.mjs` (`npm run generate:tokens`). Um plugin do Vite o roda quando o `DESIGN.md` é salvo, então a aplicação aberta atualiza sem comando, e um teste da aplicação falha se o arquivo versionado divergir do que o gerador produz agora.

O que o gerador faz:

- Cores viram triplets RGB (`--c-accent: 108 64 217;`), consumidos com `rgb(var(--c-accent) / <alpha>)`, como a seção *Colors* do `DESIGN.md` prescreve. Chaves com sufixo `-dark` compõem o bloco `[data-theme="dark"]`, e as demais o `:root`.
- `rounded`, `spacing` e `typography` viram variáveis pelos grupos do front matter. O grupo `components` não gera CSS: é especificação visual para quem escreve o `.module.css` (`ADR-0014`).
- **Sombras e gradiente entram no front matter num grupo novo, `elevation`**, como strings CSS que referenciam outros tokens pela sintaxe do próprio formato (`{colors.accent}`, `{elevation.shadow-strength}`). O gerador resolve as referências para `var(--…)` e deixa `calc()` e alfa como CSS literal. `shadow-strength` tem a variante `-dark`, como as cores.
- **Os nomes das variáveis seguem o front matter** (`--c-canvas`, `--c-surface`, `--c-ink-mute`), não a bancada. A aplicação nasce nova e não tem o que migrar.
- O gerador falha alto em referência sem destino, chave `-dark` sem a clara correspondente e cor que não seja `#RRGGBB`. Durante a edição no servidor de desenvolvimento, uma falha mantém o `tokens.css` anterior e o servidor de pé.

O argumento que venceu é que **gerar é a única forma de o `DESIGN.md` continuar sendo a única coisa que se edita**. Um CSS validado, mas escrito à mão, ainda é uma segunda cópia: alguém edita o valor nos dois lugares, e o teste só diz que um dos dois esqueceu. Gerado, o valor muda num lugar e o resto segue. Versionar o derivado e conferir por teste é o arranjo que o repositório já usa para o `messages.json`, então não há mecanismo novo para aprender.

## Alternativas consideradas

### `tokens.css` escrito à mão e só validado contra o `DESIGN.md`

Era a outra metade da saída que o `ADR-0013` previa, e o `ADR-0014` a citou como opção. Daria liberdade de nomear e de organizar o CSS sem passar por um gerador. Rejeitada pelo argumento acima: a validação acusa a divergência mas não a evita, e cada mudança de valor vira duas edições. O validador ainda precisaria saber a correspondência entre cada token e cada variável, que é quase o gerador inteiro.

### Sombras e gradiente fora do front matter, escritos no CSS global da aplicação

Manteria o front matter só com o que o formato `design.md` já define (cores, tipografia, raios, espaço, componentes) e deixaria sombra e gradiente como CSS na aplicação. O autor decidiu o contrário, levar as duas ao front matter. A razão que sustenta a escolha: a sombra tingida de roxo é parte do sistema tanto quanto a cor, e deixá-la fora faria dela o único valor visual da aplicação sem fonte no `DESIGN.md`. É também o caso que a *Reversão* do `ADR-0013` previa como sinal de problema, valores que o front matter não sabe expressar empurrados de volta para a prosa.

### Os nomes da bancada (`--c-bg`, `--c-panel`, `--c-dim`) nas variáveis geradas

Pouparia uma tradução de cabeça entre bancada e aplicação, e o bloco CSS do `DESIGN.md` já usava esses nomes. Rejeitada porque o gerador teria de manter uma tabela de apelidos entre o nome do token e o nome da variável, que é exatamente o tipo de correspondência escrita à mão que se queria eliminar. Os nomes do front matter são os que o `DESIGN.md` usa para falar de cada valor, e o `ADR-0014` já tinha separado valores (obrigatórios) de nomes (livres).

## Consequências

- O `DESIGN.md` é a única coisa que se edita para mudar um valor visual da aplicação. Salvar o arquivo atualiza a tela aberta.
- O formato `design.md` ganha um grupo que ele não define, `elevation`. Se a ferramenta do formato não o ler, o arquivo continua válido como texto, e só o nosso gerador depende dele.
- O `AGENTS.md` diz que o `tokens.css` é gerado, como o `messages.json`.
- **Piorava: a bancada e a aplicação usavam nomes diferentes para os mesmos valores**, e nada conferia o arquivo de tokens da bancada. A bancada saiu da árvore (`ADR-0025`), e com ela a deriva.
- **Piora: as cores do mapa seguem sem token.** O `@odds/layout` publica um `map.css` com variáveis próprias (`--odds-map-*`), e cada tela as liga aos próprios tokens. Isso é deliberado (`ADR-0013` deixou as cores do diagrama em aberto), mas significa que o gerador não cobre tudo o que aparece na tela.
- **Piora: mais uma dependência de desenvolvimento**, o parser `yaml`, para ler o front matter.

## Reversão

**O sinal** seria o gerador precisar de casos especiais a cada token novo (o nome `grad-primary` e o `shadow-strength` já são dois), ou o grupo `elevation` brigar com uma versão futura do formato `design.md`. Também é sinal o autor editar o `tokens.css` à mão por ele ser mais fácil de ler que o front matter.

**O custo da volta é baixo enquanto o gerador for pequeno.** Parar de gerar é commitar o último `tokens.css` e apagar o teste de deriva e o plugin. O que encareceria a volta é a aplicação crescer usando os nomes do front matter, porque eles passariam a ser contrato de cada `.module.css`.

**O que já foi construído em cima:** o grupo `elevation` no front matter do `DESIGN.md`, o `tokens.css` da aplicação, o teste de deriva e o plugin do Vite, e os `.module.css` do primeiro incremento, que consomem só esses tokens.
