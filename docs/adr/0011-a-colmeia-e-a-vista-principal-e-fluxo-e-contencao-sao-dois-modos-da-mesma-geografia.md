---
adr: 0011
title: A colmeia é a vista principal, e fluxo e contenção são dois modos da mesma geografia
status: accepted
date: 2026-10-07
deciders: Fabio Badaro, Claude
tags: render, playground, vistas, prd
supersedes: —
superseded-by: —
---

# ADR-0011 — A colmeia é a vista principal, e fluxo e contenção são dois modos da mesma geografia

## Contexto

O `PRD.md` §4.4 exige duas vistas que respondem a perguntas diferentes e mostram coisas diferentes de propósito. A de **fluxo** ("como isto se integra?") desenha nós e arestas, com conectores e tags. A de **contenção** ("como isto está organizado?") desenha domínio, subdomínios e contextos aninhados, com o `external` fora da fronteira. O PRD foi escrito imaginando dois desenhos distintos: um grafo e caixas aninhadas.

A colmeia, nascida na rodada de render de 2026-09-11, fez as duas coisas ao mesmo tempo: o território mostra a hierarquia, e a linha mostra a relação. Isso virou o fork 4 do README de design, com três saídas:
1. a colmeia é o mapa, com duas ênfases;
2. a colmeia é só a contenção, e o fluxo vira um grafo livre (o `ADR-0009` nomeia o ELK como primeiro candidato);
3. uma vista só, mudando o PRD.

Até 2026-10-06, a evidência favorecia a saída 1: nos modelos de 17 e 24 contextos, a v4 dava 1 cruzamento cada, nenhuma aresta sobre peça alheia e desvio máximo de 1,88×. Em 2026-10-07, o `colmeia-50` mediu um marketplace sintético de 50 contextos, 12 subdomínios e 64 relações (`docs/design/pages/colmeia-50.html`). A contenção continuou legível. O fluxo não:
- 120 cruzamentos;
- uma aresta de 43 células;
- 18 colisões entre linha e chip;
- 2,4 s de layout.

A v3 deu 125 cruzamentos no mesmo modelo. Então a causa é a posição subordinada à hierarquia, não o arranjo fixo do `ADR-0010`: dois contextos que conversam muito mas moram em territórios opostos ficam longe.

## Decisão

**A colmeia é a vista principal do playground.** Fluxo e contenção são dois modos dela, sobre a mesma posição de cada peça. O fluxo mostra as ligações. A contenção esconde as ligações e deixa o terreno em primeiro plano. O §4.4 do PRD fica atendido sem mudança.

O argumento que venceu é de **uso**: o mapa grande é lido por navegação, não de uma vez. O arquiteto que quer a visão do todo aproxima e afasta, foca num contexto, clica e vê as relações dele acesas. A legibilidade do fluxo num mapa de 50 contextos é responsabilidade dessas ferramentas de interface, não do layout sozinho. Os 120 cruzamentos medem o mapa visto inteiro e parado, que não é como ele vai ser usado nesse tamanho.

Isso vale também a favor da troca de vista: com a mesma geografia, passar do fluxo para a contenção não move peça nenhuma, e o mapa mental sobrevive à troca. Com um grafo livre no fluxo, cada troca seria um mapa novo.

## Alternativas consideradas

### A colmeia só como contenção, e o fluxo como grafo livre (ELK)

A resposta direta à medição: um layout guiado pelas relações põe lado a lado quem conversa, e os 120 cruzamentos cairiam muito. Rejeitada por três razões:
- São dois layouts para manter, e dois mapas mentais: trocar de vista embaralha tudo, que é justamente o que a localidade do `ADR-0010` existe para evitar dentro de uma vista.
- O grafo livre perde a hierarquia no desenho, e a pergunta "como isto se integra?" num mapa estratégico raramente vem sem "e onde isso mora?".
- A medição é do mapa parado. O ganho do ELK é sobre o caso que as ferramentas de navegação deixam de tornar central.

Continua sendo a alternativa certa se o sinal da *Reversão* aparecer.

### Uma vista só, sem o modo sem ligações

Mudaria o PRD §4.4. Rejeitada porque o modo sem ligações tem valor próprio: é a pergunta "como isto está organizado" sem ruído, e é onde o `[BBM]` deliberadamente não aparece (o PRD explica por quê). Custa um botão, não um layout.

### Melhorar o layout até o fluxo de 50 contextos ficar legível parado

Por exemplo, roteamento que atravessa território em vez de contornar o mapa, ou massas posicionadas pelo volume de relações entre elas. Não é rejeitada, é **adiada**: pode reduzir os 120 cruzamentos, mas não muda a decisão. Escolhas discretas que olham o mapa inteiro tendem a quebrar a localidade, como o `ADR-0010` mediu.

## Consequências

- O fork 4 está fechado, e o `ADR-0009` segue sem o terceiro sinal de reversão aceso.
- **Nasce uma exigência de interface**, que é condição desta decisão e não enfeite: zoom e pan, foco num contexto (apagar o resto) e marcação ao clicar (as relações do contexto acesas). Foco e marcação já existem na v4; zoom e pan não foram feitos em rodada nenhuma.
- **Piora:** num mapa grande, o fluxo visto inteiro e parado é ilegível (120 cruzamentos aos 50 contextos), e um export vetorial do mapa todo vai mostrar isso. O export reproduz a tela (`PRD.md` §5.2), então quem exporta um mapa de 50 contextos exporta o espaguete.
- **Fica em aberto, separado desta decisão:** o layout leva 2,4 s aos 50 contextos, 70% no roteamento A* das arestas. A estimativa do `ADR-0009`, de folga até ~50 contextos, não se confirmou, e isso precisa de solução antes de mapas desse tamanho serem o caso comum.

## Reversão

O sinal de erro é um arquiteto, **com zoom, foco e marcação disponíveis**, ainda não conseguir responder "como isto se integra?" num mapa real de 40 a 60 contextos. Se isso acontecer, a alternativa do ELK para o fluxo é reaberta, e o `ADR-0009` já a prevê. O mesmo vale se a exportação do mapa inteiro virar uso frequente e ninguém quiser o fluxo da colmeia exportado.

Desfazer custa pouco agora: não há playground de produto, só páginas de design. Depois de o `@odds/layout` existir e o playground desenhar o fluxo com ele, a volta é escrever um segundo layout, para o fluxo, e uma transição entre vistas que deixa de ser trivial. O que já foi construído em cima: a v3 e a v4, que desenham as duas vistas na mesma geografia, e o `colmeia-50`, que mediu o custo.
