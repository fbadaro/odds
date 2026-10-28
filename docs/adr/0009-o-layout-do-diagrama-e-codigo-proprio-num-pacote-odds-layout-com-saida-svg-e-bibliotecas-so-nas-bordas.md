---
adr: 0009
title: O layout do diagrama é código próprio num pacote @odds/layout, com saída SVG e bibliotecas só nas bordas
status: accepted
date: 2026-09-28
deciders: Fabio Badaro, Claude
tags: render, layout, playground, stack, desempenho
supersedes: —
---

# ADR-0009 — O layout do diagrama é código próprio num pacote @odds/layout, com saída SVG e bibliotecas só nas bordas

> Os protótipos que este ADR cita (as páginas da exploração de UI em `docs/`) saíram da árvore depois de validados e seguem no git, no commit `e282c83`. A decisão segue em vigor no `@odds/layout`. O que a v4 desenhava ficou congelado nos goldens dele, e as famílias 3 a 6 dos checks seguem em `packages/layout/test/properties.test.ts`.

> **Confirmado em 2026-10-10 num mapa de tamanho real.** O teste de aceite de 2026-10-06 foi feito no modelo de 17 contextos. Em 2026-10-10 o autor repetiu a digitação no marketplace de 50 contextos, no protótipo ao vivo (com zoom, foco e ficha), e o resultado foi: *"Não perdi o foco de onde estava, e acho que fazer o block no desenho e mostrar no final da digitação ficou bom, aprovado!"*. O sinal da *Reversão* "layout ilegível num mapa real de 40 a 60 contextos" não acendeu, e o custo de layout que pesava nesse tamanho (2,4 s) caiu para cerca de 170 ms no mesmo dia, com a mesma geometria. A pausa de 300 ms antes do relayout, que segura o desenho até o fim da digitação, foi aprovada como está.

> **Aceito em 2026-10-06.** As duas condições abaixo foram cumpridas. A localidade veio da colmeia v4, pelos mecanismos do `ADR-0010`, e é conferida edição por edição pelo check da v4. O teste de digitação humana foi feito pelo autor no protótipo ao vivo com a v4 embutida, e o resultado foi que *"funcionou bem"*: nenhum sinal da *Reversão* apareceu. Os dois blocos a seguir ficam como estavam, porque são o registro do que se sabia antes.

> **Proposto, não aceito.** A decisão foi registrada antes do protótipo que a confirma porque a análise que a produziu, com os números abaixo, se perderia com a sessão. O protótipo ao vivo existe desde o mesmo dia e já acendeu metade do primeiro sinal da *Reversão* — ver *Consequências*, "O que o protótipo mediu". A passagem a `accepted` exige duas coisas: o layout cumprir a exigência de **localidade** que o protótipo fez nascer, e alguém digitar um mapa de tamanho real sem perder a peça que estava olhando.

> **Esta foi uma rodada de validação, e ela fechou (2026-09-28).** O risco que a motivou era de ordem, não de gosto: a exploração de UI/UX vinha desenhando a colmeia havia três rodadas, e nada garantia que aquele desenho fosse **desenvolvível** — que um layout daquele tipo acompanhasse a digitação, rodasse no navegador sob a política de conteúdo real e exportasse os marcadores. Seguir refinando a tela sobre um desenho impossível seria o desperdício mais caro da exploração, e é o risco que a exploração de UI em mocks descartáveis aceitou ao adiar a biblioteca de render. O protótipo respondeu: o `@odds/core` real e o layout da v3 rodam juntos no navegador, a cada tecla, em milissegundos, com congelamento no erro de sintaxe, marcador no lugar e export vetorial — **a funcionalidade é viável**. O que ele achou de ruim — a falta de localidade, que faz um contexto novo refazer o mapa — é trabalho do `@odds/layout` quando ele nascer, não motivo para mudar o desenho. Por decisão do autor, a exploração **volta aos refinamentos de UI/UX**; a exigência de localidade e o teste de digitação humana ficam como condição de aceite deste ADR, sem prazo, e o status segue `proposed` até lá.

## Contexto

A exploração de UI em mocks descartáveis adiou a escolha da biblioteca de layout/render até a exploração de UI produzir exigências concretas, e nomeou as três perguntas que mock nenhum responde: custo de re-render a cada tecla (`PRD.md` §8.2), qualidade do layout automático do grafo, e export vetorial **com os marcadores** (`PRD.md` §5.2). A rodada de render aberta em 2026-09-11 terminou, em 2026-09-27, na colmeia v3: territórios hexagonais por tipo de subdomínio, contexto como peça na grade, rotas A* sobre a grade com custo de curva, tag na porta, posição derivada do grafo numa ordem canônica — embaralhar o arquivo move zero peças.

A colmeia foi escrita à mão, em ~1.200 linhas de JS sem dependência, e já roda sem DOM: o check da v3 a carrega em Node, passa a fonte gerada pelo `@odds/core` real e mede cruzamentos, sobreposição e invariância. Isso tornou a pergunta "é viável gerar este desenho enquanto o usuário edita a DSL?" mensurável em vez de opinável. As medições de 2026-09-28, com o layout isolado em Node:

| Modelo | Contextos | Layout |
|---|---|---|
| `one` (vendas) | 24 | ~15 ms |
| `many` (grupo) | 29 | ~12 ms |
| sintético, relações aleatórias | 48 | ~100 ms |
| sintético, relações aleatórias | 80–100 | 260–450 ms |
| sintético, 8 domínios | 48 | ~890 ms |

A montagem da string SVG custou ~4 ms nos dois modelos reais. O `@odds/core` não importa nada de Node, e a única dependência dele é o Chevrotain (~140 KB minificado): roda no navegador como está.

Duas descobertas pesavam mais que o tempo. A primeira é uma **explosão fatorial**: o `perms()` da v3 enumera toda ordem de domínios para escolher a prateleira; com 8 domínios leva quase um segundo, com 10 não termina. Hoje é latente, porque o `RULES-EN.md` §0.5 mantém um `domain` por arquivo — mas o fork da cardinalidade está aberto no README de design. A segunda é **instabilidade sob edição**: a invariância à ordem não é invariância à edição. Acrescentar uma única relação ao `mapping` moveu 3 a 8 das 17–18 peças (18% a 47%), medido com as três relações extras de cada modelo da própria página.

As saídas plausíveis eram três: adotar uma biblioteca de layout de grafo e ajustar o desenho a ela, adotar um motor de diagrama interativo completo, ou promover o layout escrito à mão a código de produto. Nenhuma das bibliotecas examinadas produz território hexagonal — mas também não era certo que a colmeia sobreviveria ao contato com digitação real, e manter layout próprio é um custo que biblioteca nenhuma cobra.

## Decisão

O layout do diagrama é **código próprio**, num pacote **`@odds/layout`** que recebe o AST validado e devolve geometria, e a renderização é **SVG montado por nós**. Bibliotecas entram **só nas bordas**, onde o problema é genérico: pan/zoom, transição animada entre dois layouts, e — se o tamanho do modelo exigir — o transporte até um Web Worker.

O argumento que venceu é que **o desenho é o produto e a biblioteca não o alcança**. As bibliotecas de layout resolvem grafos genéricos de caixas e setas; a colmeia é uma geografia — o território do subdomínio *é* a forma, a grade *é* o espaço de roteamento, e a tag mora na porta da peça. Adotar uma biblioteca não seria economizar a colmeia, seria trocá-la pelo desenho que a biblioteca sabe fazer, e essa troca é decidir a biblioteca pela porta dos fundos, que a exploração de UI em mocks descartáveis queria evitar, só que ao contrário. Os três requisitos que aquela exploração deixou para esta decisão ficam, com layout próprio, assim: o **custo por tecla** cabe folgado até ~50 contextos e é problema de engenharia, não de viabilidade, acima disso; a **qualidade do layout** é código nosso, testável sem navegador como o `@odds/core`; e o **export vetorial com os marcadores** sai de graça, porque o que está na tela já é uma string SVG — o `PRD.md` §5.2 exige que o export seja exatamente o canvas, e aqui não há canvas raster para converter.

A mesma decisão fixa como o desenho acompanha a edição, porque sem isso o número dos 18–47% derruba a proposta:

1. **Topologia recalcula, o resto repinta.** Um hash da forma canônica — quais contextos existem, em que subdomínio, quais pares se relacionam — decide se o layout roda. `description`, `team`, título e diagnóstico só repintam sobre a geometria anterior, sem layout nenhum. Tag e conector rodam o layout de novo, porque a porta e a seta são geometria, mas **não podem mover peça**: a posição não depende deles (medido: trocar todas as tags e conectores da v3 move 0 peças). O ganho desta medida é custo e garantia, não estabilidade — o layout já é função pura da topologia, então uma propriedade editada nunca moveria nada; o que ela acrescenta é não pagar layout por isso, e poder afirmar a garantia em vez de medi-la.
2. **O layout roda quando a digitação pausa**, não a cada tecla. Quase toda tecla intermediária é `SYNTAX_ERROR`, e o `PRD.md` §5.2 já manda congelar o último diagrama bom marcado como obsoleto; esperar ~300 ms de pausa é a mesma regra vista do lado do layout.
3. **A troca de layout é animada** (FLIP: cada peça desliza da posição antiga para a nova). O que preserva o mapa mental não é a peça ficar parada, é ver para onde ela foi.

E fixa o que fica **fora**: o layout continua **função pura do texto**. Posição anterior não entra no cálculo.

`@odds/layout` depende de `@odds/core` (dos tipos do AST) e de nada de DOM, na mesma lógica de fronteira do `ADR-0004`: o que não se importa não se acopla.

## Alternativas consideradas

### ELK (`elkjs`) ou dagre, e ajustar o desenho ao que eles fazem

A alternativa séria, e a que qualquer pessoa proporia primeiro: layout em camadas e ortogonal, maduro, com roteamento de arestas resolvido e anos de casos-limite pagos por outros. Resolveria bem uma vista de fluxo clássica. Rejeitada porque o que ela produz são caixas em camadas, não territórios: o subdomínio viraria um retângulo-contêiner (o *compound node* do ELK), o tipo de subdomínio deixaria de ser geografia e a tag voltaria para cima da aresta. A colmeia não é um tema aplicado sobre um layout genérico — é o próprio layout. Continua sendo a alternativa certa **se** o fork 4 do README de design decidir que a colmeia é só a vista de contenção e a de fluxo precisa ser um grafo convencional; aí o ELK entra para aquela vista, e este ADR não o proíbe.

### Motor de diagrama interativo completo (Cytoscape, React Flow, JointJS)

Dão de graça seleção, arrasto, pan/zoom e eventos por elemento. Rejeitados por três motivos. Nenhum gera território hexagonal, então o layout continuaria nosso e o motor viraria só uma camada de desenho cara. Vários desenham em canvas, o que põe o export com marcadores atrás de uma conversão raster→vetor que o `PRD.md` §5.2 não tolera. E o que eles mais oferecem — arrastar nó — é exatamente o que o `ADR-0003` recusa: o diagrama nunca escreve de volta no texto, e posição arrastada que não volta para o texto some no próximo layout.

### Bibliotecas de grade hexagonal (`honeycomb-grid`, `d3-hexbin`)

Resolvem só a matemática da grade — coordenada axial, vizinhança, conversão pixel↔célula —, que na v3 são umas trinta linhas já escritas e já testadas. Uma dependência para isso seria custo de manutenção sem ganho. Rejeitadas.

### Layout "grudento": a posição anterior entra como semente e o deslocamento é penalizado

A medida mais eficaz contra os 18–47% de peças movidas, e a que um editor de diagramas convencional usaria. Rejeitada por uma promessa de produto: o `PRD.md` §10.3 exige que a URL compartilhada abra o playground *"with my exact design loaded"*, e a URL carrega o texto, não a sessão. Com layout dependente de histórico, dois usuários com o mesmo arquivo veriam mapas diferentes, e o mapa de quem recebe o link seria outro que o de quem mandou. Seria também a primeira vez que o diagrama tem estado próprio fora do texto, que é a fresta que o `ADR-0003` fecha. As três medidas adotadas atacam o mesmo problema sem abrir essa fresta; se não bastarem, a volta passa por decidir de novo o fork 2 do README de design — posição derivada ou escolhida —, não por esconder estado no layout.

### Recalcular a cada tecla, sem separar topologia de repintura

A leitura literal de *"the visualization updates automatically"* (`PRD.md` §5.2). Rejeitada por duas razões medidas. Cada letra de um nome novo é uma topologia diferente — `context L`, `Lo`, `Loy` são três contextos distintos para o layout —, então quem digita um nome vê o mapa se refazer a cada letra, e é a primeira delas que move o mapa inteiro (ver *Consequências*). E o custo, irrelevante a 24 contextos, vira 260–450 ms por tecla a 100. Uma versão anterior deste texto dizia que editar um `description` poderia deslocar o mapa; o protótipo mostrou que não pode — o layout ignora propriedades —, e a frase foi corrigida no mesmo dia, antes de o ADR ser aceito.

## Consequências

- Nasce um terceiro pacote, `@odds/layout`, puro e testável em Node — a colmeia v3 e o check dela são o ponto de partida, não protótipo a reescrever do zero. As checagens que o check já faz (invariância à ordem, cruzamentos, aresta sobre peça alheia, colisão de rótulos) viram teste do pacote.
- O export vetorial com marcadores deixa de ser risco: é serializar o SVG que está na tela.
- A única dependência de render obrigatória é nenhuma. Pan/zoom e transição são escolhas pequenas e trocáveis, tomadas no protótipo, e só viram ADR se uma delas trouxer peso.
- **Piora, e é o preço principal:** a qualidade do layout é nossa para sempre. Os modelos sintéticos de 80–100 contextos com relações aleatórias deram centenas de cruzamentos. Relação aleatória é o pior caso — mapas reais têm vizinhança —, mas melhorar isso é trabalho que biblioteca nenhuma fará por nós.
- **Piora também:** a busca exaustiva de prateleira (`perms()`) tem de virar heurística **antes** de a cardinalidade de `domain` mudar. Se o fork da cardinalidade abrir sem essa troca, 10 domínios travam a aba.
- Acima de ~50 contextos o layout sai da thread principal (Web Worker), para que a digitação não trave enquanto o mapa se recalcula — o `PRD.md` §8.2 cobra responsividade durante a digitação, não layout instantâneo.
- O mapa ainda se move quando a topologia muda. As três medidas tornam o movimento raro, adiado e visível, não inexistente — e é por isso que este ADR nasce `proposed`.

### O que o protótipo mediu (2026-09-28)

O protótipo ao vivo liga um editor, o `@odds/core` real e o layout da v3 **sem cópia** — o script da v3 é embutido por um build próprio, junto com o core e o Chevrotain convertidos para scripts clássicos inline, sem bundler. A primeira versão usava import map com módulos em `data:` URL e abria vazia no visualizador de artifact, cuja política de conteúdo barra o que um `file://` deixa passar — o que o `ADR-0009` escolhe precisa rodar sob essa política, e script inline é o que roda. Um robô digita quatro cenários tecla a tecla, e as três medidas ligam e desligam para comparar. Três resultados:

- **As medidas fazem o que prometem.** Editar uma descrição: 17 teclas, 17 repinturas, zero layout. Tag no lado errado: congela enquanto a tag está incompleta, uma rerrota no fim, o marcador cai na porta, zero peças andam. Relação nova: congela ou repinta enquanto o segundo nome não resolve — referência que não resolve fica fora do grafo —, e faz um único relayout quando resolve. Parse e validação custam ~1 ms por tecla num arquivo de 185 linhas.
- **O que move o mapa é contexto, não relação.** Peças que andam por edição, no modelo de vendas: renomear um contexto 0–1 de 16; tag ou conector, 0; +1 relação, 3–8 de 17; **+1 contexto, 15–17 de 17** em quatro dos seis subdomínios; **−1 contexto, 14–16 de 16** em três. A edição estrutural mais comum refaz o mapa quase inteiro, e pausa e animação só a tornam legível.
- **A causa é do algoritmo, não do ciclo de atualização.** O tamanho de uma massa é função direta do número de contextos dela, e toda massa se reposiciona quando uma cresce. Isso faz nascer uma quarta exigência para o `@odds/layout`, do mesmo tipo da invariância à ordem que a v3 já cumpre: **localidade** — acrescentar ou remover um contexto de um subdomínio só pode mover peças daquele subdomínio, e renomear não pode mover nenhuma. É propriedade de função pura (capacidade de massa em degraus, com folga, em vez de exata; massas ancoradas pela posição, não pelo tamanho), verificável como teste, e não pede o layout grudento que este ADR recusa.

Um defeito lateral também apareceu: domínio sem subdomínio e sem `external` derruba o layout da v3 — um estado que todo arquivo novo atravessa. O protótipo o contorna deixando esse domínio fora do desenho; o `@odds/layout` tem de desenhá-lo.

## Reversão

O sinal de erro é o protótipo mostrar qualquer destes, digitando um mapa de tamanho real:

- **O movimento incomoda mesmo animado** — o usuário perde a peça que estava olhando depois de acrescentar um contexto ou uma relação, apesar do FLIP e da espera pela pausa. O protótipo já mostrou que, com o layout da v3, isso acontece ao acrescentar um contexto; o que falta saber é se a **localidade** resolve. Se um layout que cumpra a localidade ainda perder a peça de vista, o fork 2 volta à mesa, e a alternativa do layout grudento é reaberta contra a promessa da URL, com o custo agora medido. Se a localidade se mostrar incompatível com um mapa legível — massas com folga demais, território que não fecha —, o sinal é o mesmo.
- **A qualidade do layout em mapa real** (não sintético) de 40–60 contextos ficar ilegível, e melhorá-la custar mais que adotar o ELK para a vista de fluxo.
- **A decisão do fork 4** for que a colmeia é só a vista de contenção. Este ADR não é desfeito — a colmeia continua própria —, mas a vista de fluxo ganha um ADR próprio, e o ELK é o primeiro candidato dele.

Desfazer é barato **enquanto** este ADR estiver `proposed`: existe uma página de design e um script de checagem, nada de produto depende do layout. Depois de `@odds/layout` existir e o playground desenhar com ele, a volta para uma biblioteca é reescrever a vista inteira e perder a geografia da colmeia — o custo que justifica ter o protótipo antes do `accepted`. O que já foi construído em cima desta decisão: a colmeia v3, que a antecede, e o protótipo ao vivo, que a testa — ambos descartáveis.
