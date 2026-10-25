---
adr: 0010
title: A localidade do layout vem de degraus de capacidade, arranjo fixo e territórios que se resolvem sozinhos
status: accepted
date: 2026-10-06
deciders: Fabio Badaro, Claude
tags: render, layout, playground, localidade
supersedes: —
superseded-by: —
---

# ADR-0010 — A localidade do layout vem de degraus de capacidade, arranjo fixo e territórios que se resolvem sozinhos

> **Fechado em 2026-10-24.** A `colmeia-v4.html`, onde estes mecanismos nasceram, e o `colmeia-v4.check.mjs`, que conferia a localidade edição por edição, foram apagados depois de validados, junto com a v3 (`ADR-0023`). Os mecanismos vivem no `@odds/layout`, a família 6 do check virou o teste de localidade de `packages/layout/test/properties.test.ts`, e as páginas seguem no git, no commit `e282c83`.

> **O ADR-0009 foi aceito em 2026-10-06**, depois do teste de digitação humana. O bloco abaixo descreve o estado em que este ADR foi escrito.

> **Depende do ADR-0009, que segue `proposed`.** Este ADR decide *como* o layout próprio cumpre a primeira das duas condições de aceite daquele, a localidade. Ele não aceita o ADR-0009: falta a segunda condição, alguém digitar um mapa de tamanho real no `colmeia-ao-vivo` sem perder a peça que estava olhando. Se o ADR-0009 for revertido, este perde o objeto.

## Contexto

O protótipo `docs/design/pages/colmeia-ao-vivo.html` mostrou, em 2026-09-28, que a colmeia v3 acompanha a digitação mas não tem localidade: acrescentar um contexto movia 15 a 17 das 17 peças, e acrescentar uma relação, 3 a 8. O ADR-0009 transformou isso em condição de aceite e deu a forma da exigência: acrescentar ou remover um contexto de um subdomínio só pode mover peças daquele subdomínio, e renomear não pode mover nenhuma. Também apontou o tipo de remédio: capacidade em degraus com folga, massas ancoradas por posição. Continuou valendo a restrição que ele mesmo fixou: o layout é função pura do texto, sem posição anterior como semente, por causa da URL compartilhada (`PRD.md` §10.3).

Lendo o layout da v3, a falta de localidade não tinha uma causa só. Era uma cadeia:
- o tamanho do território era função exata da contagem de contextos;
- a posição de cada massa dependia do tamanho do core;
- os territórios de uma massa disputavam células em sequência;
- três escolhas discretas olhavam o mapa inteiro: a orientação dos territórios (permutações × 12 rotações, pontuadas pela distância aos parceiros), o ângulo do `external` e a ordem dos domínios na prateleira;
- as peças eram posicionadas por uma passada gulosa única, numa ordem global.

Cinco perguntas não tinham resposta técnica única, e o autor as decidiu nesta rodada:
1. O que fazer quando um território enche: relayout global, crescer para fora com forma irregular, ou folga tão grande que quase nunca enche.
2. Se a localidade vale também para relação, ou só para contexto.
3. O quanto pode mexer dentro do próprio subdomínio.
4. Qual invariância vence no empate entre contextos estruturalmente idênticos. Para embaralhar não mover nada, a ordem não pode vir do arquivo. Para renomear não mover nada, ela não pode vir do nome. Nesse empate, as duas não cabem juntas.
5. Se o trabalho acontece numa página de design ou já num pacote `@odds/layout`.

A régua de qualidade da v3 (cruzamentos à metade da v2, nenhuma aresta sobre peça alheia, desvio até 2×, composição sem colisão) continuava obrigatória. Localidade comprada com mapa pior não valia.

## Decisão

A localidade é uma propriedade **verificada edição por edição**, e é obtida por três mecanismos, todos dentro da função pura:

1. **Degraus de capacidade.** O território é dimensionado pelo degrau (4, 8, 12, 20, 32… contextos), não pela contagem. Dentro de um degrau ele não muda de forma, e então nada fora dele pode mudar. Cruzar o degrau refaz o mapa, e isso é aceito: é raro, e a animação mostra para onde cada peça foi.
2. **Arranjo fixo.** A orientação dos territórios numa massa e a ordem dos domínios na prateleira passam a seguir a ordem de id. O `external` continua apontando para os parceiros dele, mas é posto por último, no raio do próprio ângulo, sem empurrar massa alheia.
3. **Territórios que se resolvem sozinhos.** Uma peça só lê o próprio território. Parceiro de outro território puxa para o centro do território dele, que só muda no degrau. Parceiro no `external` ou em outro domínio não puxa. A distância a peça alheia vira regra de terreno: peça não ocupa célula vizinha de território alheio. A ordem dentro do território é grau, depois a assinatura (em que territórios estão os parceiros), depois o nome. No empate entre células, decide a coordenada relativa à massa, nunca o ruído de ponto flutuante nem a ordem de varredura.

As respostas às cinco perguntas, na ordem: relayout no degrau, com degraus moderados; localidade também para relação; reorganização livre dentro do território; o nome desempata, e renomear pode trocar de lugar um gêmeo estrutural; trabalho na `colmeia-v4.html`, não em pacote.

O argumento que venceu foi a medição. Desligar uma escolha discreta por vez mostrou que a orientação pontuada pelos parceiros era a principal fonte de movimento sob edição de relação. Mostrou também que ela só podia sair junto com as outras duas: desligada sozinha, o domínio único ia de 1 para 9 cruzamentos. Com as três fixas e o `external` reposicionado, as 71 edições de contexto, as 70 de renome e as 35 de relação dos dois modelos ficaram locais, e a régua passou: 1 cruzamento em cada modelo, nenhuma aresta sobre peça alheia, nenhuma colisão. O robô do protótipo, ao acrescentar `Loyalty` a Atendimento, mede agora **0 de 17** peças andaram.

## Alternativas consideradas

### Território crescendo para fora, do lado oposto ao core (saída b da pergunta 1)

Evitaria o relayout no degrau: o território só ganharia células na borda que não encosta em ninguém. Rejeitada porque a forma passaria a depender do histórico de crescimento, e não de uma função do tamanho. Ou seria pura e irregular, ou regular e dependente da sessão. A segunda é o layout grudento que o ADR-0009 recusa. A primeira deixa território comprido e torto, que lê como erro de desenho.

### Folga grande o bastante para quase nunca encher (saída c)

Medido em degraus de 4: 10% das edições de contexto cruzam degrau, com 76% a mais de território que a contagem exata. Os degraus testados formam uma curva contínua: 2, 4, 8 dá 37% de cruzamento e +23%; 3, 6, 10 dá 24% e +52%. Não há ponto livre de custo. A escolha de 4, 8, 12, 20 é a saída (a) com folga moderada, não a (c). O próximo passo nessa curva, que é menos relayout com mais água, continua disponível trocando uma linha (`TIERS`).

### Localidade só para contexto (pergunta 2)

Era o que o ADR-0009 exigia, e era mais barato: bastava o degrau e o território autônomo. Rejeitada porque relação é a edição mais comum depois de contexto, e na v3 ela mexia em territórios alheios em 10 de 17 edições. A medição mostrou que a versão estrita era alcançável sem piorar a régua. Prometer menos do que se consegue cumprir seria deixar o sinal de reversão do ADR-0009 aceso à toa.

### Manter a orientação pelos parceiros, que é a geografia que a v3 desenhou

Territórios virados para quem conversa com eles encurtam aresta e são parte do que fazia a colmeia ler como mapa. Rejeitada porque é uma escolha discreta sobre o mapa inteiro: qualquer relação de um território pode girar a massa e levar o vizinho junto. Foi a causa de quase todas as violações de relação, e nenhuma pontuação a torna contínua. O ganho dela foi parcialmente recuperado dentro do território: as peças continuam se virando para os parceiros.

### Peças paradas e só a nova procura lugar (pergunta 3)

Daria mais estabilidade visual que a reorganização do território. Rejeitada porque, numa função pura, a peça nova muda o grau e a ordem gulosa das outras. Garantir que nenhuma se mova pede posição anterior como entrada, e isso é o layout grudento de novo. O mapa mental que importa é o do território, e é ele que fica parado.

### Desempatar pela ordem do arquivo (pergunta 4)

Faria renomear não mover nada, nem o gêmeo. Rejeitada porque a invariância à ordem do arquivo é a propriedade mais antiga e mais testada da colmeia (24 embaralhamentos por modelo, 0 peças movidas), e o empate custa no máximo uma troca entre dois contextos idênticos em tudo menos o nome.

### Começar já como `packages/layout` (pergunta 5)

Seria escrever uma vez só. Rejeitada porque o ADR-0009 está `proposed`, e criar o pacote antes de aceitá-lo inverte a ordem que o torna barato de desfazer. A checagem de localidade foi escrita para virar teste do pacote sem mudança de forma.

### Caixa do domínio como união de todos os ângulos do `external`

Tentada para que o giro do `external` nunca deslocasse outro domínio na prateleira. Funcionou: zero violações. Mas espalhou o arquipélago a ponto de o mapa ficar minúsculo no meio da água. Rejeitada na captura. No lugar entrou a origem de cada domínio encaixada na grade, com desempate translação-invariante, para que o domínio deslocado ande **inteiro, por um único vetor**. A checagem confere isso.

## Consequências

- A v4 (`docs/design/pages/colmeia-v4.html`) substitui a v3 como o layout embutido no `colmeia-ao-vivo`. A família 6 do `colmeia-v4.check.mjs` verifica a localidade sobre toda edição de contexto, renome e relação dos dois modelos. O teste de mutação, que é devolver a puxada para o `external`, a derruba com as três edições esperadas.
- As duas buscas fatoriais `perms()` saíram. O risco que o ADR-0009 apontava, 10 domínios travando a aba, deixa de existir no layout.
- **Piora:** território vazio. Subdomínio de um contexto ocupa 19 células, e a folga é visível.
- **Piora:** os territórios não se viram mais para os parceiros, e duas puxadas saíram (para o `external` e para outro domínio). A régua não piorou, mas ela é medida em dois modelos. Um terceiro modelo pode mostrar o custo que estes dois não mostram.
- **Piora:** a direção do desempate entre células simétricas (maior q, depois maior r) é arbitrária, e foi a única das quatro que passou a régua. É ajuste a dois modelos, e está escrito no código como tal.
- Fica fora da regra, contado à parte pela checagem:
  - a edição que cruza um degrau (2 de 31 e 5 de 40 nos dois modelos);
  - no arquipélago, o domínio deslocado inteiro pela prateleira (1 edição). Ele só existe sob a hipótese de vários domínios, que hoje é `INVALID_DOMAIN_CARDINALITY`. A prateleira é a primeira coisa a rever quando a cardinalidade abrir.
- Defeito herdado e não resolvido: domínio sem subdomínio e sem `external` ainda derruba o layout, e o `colmeia-ao-vivo` continua contornando isso.

## Reversão

Os sinais de erro:
- **O teste de digitação humana perde a peça de vista mesmo com a localidade.** Aí o problema não é este ADR, é o fork 2 do README de design (posição derivada ou escolhida), e o ADR-0009 entra na reversão dele.
- **Um mapa real cruza degrau toda hora.** Por exemplo, subdomínios que oscilam em torno de 4 contextos. O remédio barato é mudar `TIERS`; o caro é a saída (b).
- **Um terceiro modelo piora a régua por causa do arranjo fixo**, com territórios de costas para os parceiros, e de um jeito que nenhuma regra fixa conserta. Aí volta a pergunta 2, com o custo da localidade de relação agora medido, e a resposta pode ser localidade só de contexto.

Desfazer custa pouco: tudo vive numa página de design e numa checagem. A v3 continua no repositório, intacta, e o build do ao-vivo volta para ela trocando um caminho. O que já foi construído em cima: a família 6 da checagem, que é o teste que o `@odds/layout` vai herdar, e o ao-vivo embutindo a v4.
