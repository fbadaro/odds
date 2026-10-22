---
adr: 0013
title: O DESIGN.md é a fonte única do sistema visual, em inglês, com tokens em front matter YAML no formato design.md
status: accepted
date: 2026-10-17
deciders: Fabio Badaro, Claude
tags: ui, design-system, documentacao, playground, landing
supersedes: —
superseded-by: —
---

# ADR-0013 — O DESIGN.md é a fonte única do sistema visual, em inglês, com tokens em front matter YAML no formato design.md

> **Leitura fixada em 2026-10-20 pelo `ADR-0014`.** O arquivo manda nos **valores** (cor, espaço, raio, sombra, tipografia), e os componentes que ele descreve são especificação visual, não nomes obrigatórios no código: um `<Button variant="primary">` que cumpra o `button-primary` está conforme. A saída prevista na *Reversão* abaixo, tokens gerados ou validados por build, fica possível agora que há framework (`ADR-0014`) e bundler (`ADR-0015`), e é decidida na conversa sobre como construir a aplicação.

> **A saída da *Reversão*, tomada em 2026-10-22 pelo `ADR-0018`.** Os tokens da aplicação são gerados do front matter deste arquivo para `apps/playground/src/styles/tokens.css`, versionado e conferido por teste, como o `messages.json`. Sombras e gradiente entraram no front matter num grupo novo, `elevation`. O front matter continua sendo a única coisa que se edita, então a recusa de *dois arquivos para uma fonte única* continua de pé: o segundo arquivo é derivado, não um segundo original.

## Contexto

O `DESIGN.md` nasceu em 2026-09-07 como rascunho de trabalho em português, em prosa com nove seções numeradas. Ele misturava três coisas: o sistema propriamente dito (tokens de cor como triplas RGB, três famílias tipográficas, escala de raios, sombras tingidas), a **procedência** do sistema e o **histórico das hipóteses**. A procedência era o método de tokens, a sombra tingida, a eyebrow e a pill mono, tomados da referência <https://studio.mjolnix.com.br/>, sem tomar nome, marca, estrutura de página nem texto. O histórico incluía o azul de planta trocado pelo roxo na segunda rodada, o marca-texto solar recusado na v4, a troca da Bricolage pela Montserrat e o playground estilizado apagado em 2026-09-11.

Enquanto isso, a exploração do `ADR-0007` produziu páginas que não seguiam o arquivo, e não precisavam: as colmeias, a bancada e o `playground.html` eram testes de hipótese. O playground de 2026-10-16 chegou a vestir a pele da variante D (azul de planta, IBM Plex, neutros quentes), e a landing v5 usa raios de 20px e 14px onde o arquivo diz 16px e 12px. O autor confirmou que o `DESIGN.md` sempre foi a fonte da verdade e que, a partir daqui, tudo passa a considerá-lo: o site e o playground.

Para isso o arquivo precisava ser consumível como âncora de implementação, e havia mais de um jeito de chegar lá. O autor trouxe como referência um design system no formato `design.md` (o da Stripe, em `stripe-DESIGN.md`, fora do versionamento): um front matter YAML com `colors`, `typography`, `rounded`, `spacing` e `components` referenciando os outros por `{grupo.token}`, seguido de seções padronizadas (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts, Responsive Behavior, Iteration Guide).

## Decisão

O `DESIGN.md` segue o formato `design.md`, **em inglês**, com os tokens declarados no front matter YAML e as regras nas seções padronizadas, e é a **fonte única** do sistema visual de toda interface da ODDS. Quando uma página e o arquivo divergem, a página está errada.

O argumento que venceu é o de **consumo, não o de aparência**. Prosa normativa obriga quem implementa a extrair valores de parágrafos, e foi exatamente assim que a landing v5 derivou para 20px e 14px sem ninguém perceber. Um front matter com tokens nomeados transforma "o valor do card" numa consulta, deixa referências entre tokens verificáveis (`{colors.accent}` resolve ou não resolve) e é o formato que ferramentas e agentes já leem. O inglês acompanha a escolha: os nomes de seção do formato, os tokens e o código que os consome já são em inglês, e a versão final do sistema é o ponto em que a língua do artefato se alinha com a do código.

Na mesma passada, o arquivo foi reduzido ao que estava **definido**: nenhum valor foi alterado. Saíram a procedência, o histórico das hipóteses, a arte do herói (a escolha entre as cinco candidatas segue aberta em `docs/design/README.md`) e as cores do diagrama, que o arquivo nunca definiu e que a landing e a colmeia pintam de modos diferentes. A procedência e o histórico ficam neste ADR e no `git log`, não no artefato normativo.

## Alternativas consideradas

### Manter a prosa em português, só limpando o texto hipotético

O menor custo, e preservaria a língua dos demais documentos de design. Rejeitada porque não resolve o problema que motivou a mudança: os valores continuariam em parágrafos e tabelas soltas, sem nomes estáveis para referenciar, e a próxima página derivaria do mesmo jeito que a landing v5.

### Tokens em arquivo de máquina separado (JSON de design tokens ou CSS) e o `DESIGN.md` só como guia

É o arranjo clássico de design system maduro (W3C Design Tokens, Style Dictionary). Rejeitado por agora: dois arquivos para uma fonte única abrem a mesma deriva entre texto e valor que se queria fechar, e o projeto ainda não tem bundler nem build de UI (`ADR-0005`) que gerasse um a partir do outro. O formato `design.md` mantém tokens e regras no mesmo arquivo, que é o que uma equipe de um só autor consegue manter sincronizado.

### Formato `design.md` em português

Manteria a língua do repositório de design. Rejeitada porque o formato tem nomes de seção padronizados em inglês e é lido por ferramentas que os esperam; traduzir as seções quebraria a compatibilidade, e deixá-las em inglês com o corpo em português produziria um artefato híbrido.

## Consequências

- Toda página nova de `docs/design/pages/` e toda interface do produto consome os tokens do `DESIGN.md`. As páginas existentes **não** seguem: o `playground.html` (pele da variante D), as colmeias (pele própria do mapa) e a landing v5 (raios 20/14) precisam ser ajustadas, e esse trabalho ainda não foi feito.
- O arquivo perde a procedência e o porquê de cada escolha. Quem perguntar "por que roxo e não o azul de planta" encontra a resposta aqui e no histórico do git, não no artefato — é o preço de um normativo enxuto.
- As cores do diagrama (tipo de subdomínio, aresta, linha acesa, linha inválida) seguem **sem token**. Até serem decididas, a colmeia continua com as dela, e o `DESIGN.md` declara isso na própria seção de escopo.
- Duas escolhas de preenchimento foram feitas na conversão, porque o formato exige um valor onde o original não dava um: o token `typography.button` (Inter 16px/600, o corpo do `body` com o peso que o original dá aos botões) e a regra de cinco pesos (o original dizia "não há 800" mas usava 800 no herói; ficou 800 só no `display-hero`).
- O `DESIGN.md` continua fora da `ODDS Language Version` e do ciclo fixo de regras do `CLAUDE.md`: mudar um token não exige entrada no `CHANGELOG.md` nem no `HEALTH.md`.

## Reversão

O sinal de erro seria o formato atrapalhar mais do que ancorar: tokens que ninguém consulta, páginas que continuam derivando apesar dele, ou a necessidade recorrente de valores que o front matter não sabe expressar (gradientes, opacidades, estados), empurrando as regras de volta para a prosa. Se isso acontecer, a saída natural é a segunda alternativa: tokens num arquivo de máquina gerado ou validado por build, o que só faz sentido quando houver framework e bundler decididos (R6.4).

O custo da volta é baixo enquanto nenhuma página consome os tokens: o conteúdo é o mesmo, só muda a forma. Ele cresce a cada página ajustada ao `DESIGN.md`, porque elas passam a citar os nomes dos tokens.
