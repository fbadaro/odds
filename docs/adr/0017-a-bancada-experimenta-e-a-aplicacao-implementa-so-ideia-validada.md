---
adr: 0017
title: A bancada experimenta e a aplicação implementa só ideia validada
status: superseded
date: 2026-10-22
deciders: Fabio Badaro, Claude
tags: processo, ui, playground, bancada
supersedes: —
superseded-by: 0021
---

# ADR-0017 — A bancada experimenta e a aplicação implementa só ideia validada

> **Fechado em 2026-10-24.** A `colmeia-v4.html`, que este ADR congelou como registro do `ADR-0010`, foi apagada depois de validada (`ADR-0023`). O que ela desenhava ficou congelado nos goldens do `@odds/layout`, e a página segue no git: `git show e282c83:docs/design/pages/colmeia-v4.html`.

> **Substituído em 2026-10-23 pelo `ADR-0021`.** A bancada deixa de ser "especificação visual e de comportamento" e passa a validar só a funcionalidade: o que atravessa para a aplicação é o comportamento, e a aplicação o constrói com os componentes do Base UI e o visual do `DESIGN.md`. Todo o resto deste ADR fica de pé no `ADR-0021`: a bancada como lugar barato de errar, a aplicação sem feature inventada, biblioteca compartilhada e tela não.

## Contexto

O `ADR-0007` pôs a exploração de UI/UX em páginas HTML descartáveis, antes de qualquer escolha de stack. Ela produziu a `docs/design/pages/playground.html`, que desde 2026-10-16 é a **bancada única**: feature nova de interface nasce nela, por regra de trabalho combinada com o autor naquele dia. Em 2026-10-20 o `ADR-0007` ganhou a nota de cumprido: as três escolhas de stack estavam feitas e a exploração continuava como bancada, mas já não antecedia decisão nenhuma.

O `ADR-0014` deixou em aberto o destino dessa página, e a pergunta voltou quando a aplicação em React (`ADR-0016`) estava para nascer. A bancada tinha cerca de 5 mil linhas de JavaScript sem framework, com o ciclo da tecla, a câmera, a seleção, a ficha e o rodapé de diagnósticos testados pelo autor, e era o único lugar onde uma ideia de interface tinha sido vista funcionando. A aplicação ia começar do zero, num modelo de componentes que a bancada não tem.

Havia duas forças. Uma página sem build se muda numa tarde e se joga fora sem custo, e foi isso que permitiu testar quatro variantes de tela, cinco heróis e quatro versões da colmeia. Um componente React com estado, testes e estilo por módulo custa mais para desfazer, e esse custo cresce a cada tela. Ao mesmo tempo, manter dois lugares que desenham a mesma tela convida a deriva: se as duas evoluírem livremente, nenhuma é a referência.

## Decisão

**A bancada continua viva como o lugar onde ideias de interface nascem e são validadas, e a aplicação implementa só o que a bancada validou.** Para a aplicação, a bancada é a especificação visual e de comportamento. As duas compartilham **código de biblioteca, nunca de tela**: `@odds/core`, `@odds/messages` e `@odds/layout`, que a bancada embute compilados pelo `colmeia-embed.mjs` e a aplicação importa.

O argumento que venceu é do autor: *"a bancada continua como um cenário de experimento, e depois a aplicação implementa uma ideia validada"*. Ele separa o lugar barato de errar do lugar caro de errar. A ideia é testada onde desfazer custa uma tarde, e só chega ao código mantido quando já foi vista funcionando. É o mesmo argumento de ordem de informação do `ADR-0007`, levado da escolha de stack para cada feature: o que se constrói no lugar caro precisa de fatos que só o lugar barato produz.

Compartilhar biblioteca, e não tela, é o que impede a deriva onde ela custaria caro. O desenho do mapa é uma função só (`@odds/layout`), e as duas telas o recebem pronto. O que cada uma escreve por conta própria é interação (clique, câmera, foco, teclado), que é justamente o que a bancada existe para experimentar.

## Alternativas consideradas

### Aposentar a bancada e fazer da aplicação o único lugar de interface

Era a saída que o `ADR-0014` deixava aberta, e a mais econômica em arquivos: um lugar só, sem a pergunta "isto já está na aplicação?". Rejeitada porque leva a experimentação para o lugar caro. Uma variante de tela feita em React nasce com estado, estilo por módulo e teste, e ninguém joga isso fora com a mesma facilidade, então a exploração tende a virar implementação sem que alguém decida. O `ADR-0007` registrou o mesmo risco na escolha de stack: protótipo feito no framework definitivo raramente é jogado fora.

### Compartilhar também código de tela entre bancada e aplicação

Seria a forma de não escrever a mesma interação duas vezes: a bancada embutiria componentes da aplicação, ou as duas consumiriam um pacote de tela comum. Rejeitada porque a bancada deixaria de ser HTML sem build. Para embutir React ela passaria a depender do Vite e do modelo de componentes, que é o que a torna barata de mexer, e uma ideia experimental teria de respeitar a estrutura da aplicação antes de ser validada. A duplicação que sobra é a de interação, que muda pouco depois de validada e é exatamente o que se quer poder mudar livre na bancada.

## Consequências

- A ordem de trabalho de interface fica fixa: bancada, validação com o autor, aplicação. A aplicação não inventa interface, e uma ideia que chega a ela sem ter passado pela bancada é desvio deste ADR.
- `colmeia-v4.html` congela como registro do `ADR-0010`, com aviso no topo. O layout vivo é o `@odds/layout`, e as duas páginas que montam a partir do `colmeia-embed.mjs` (`playground.html` e `colmeia-ao-vivo.html`) o embutem no lugar do script da v4.
- O primeiro incremento da aplicação seguiu a regra: o ciclo da tecla (300 ms de pausa, `SYNTAX_ERROR` congela o último diagrama bom marcado como obsoleto) é o da bancada, por paridade e não por meta nova (`PRD.md` §5.2).
- **Piora: a interação existe duas vezes**, em JavaScript na bancada e em React na aplicação, e as duas podem divergir sem que nada avise. Nenhuma checagem compara as duas telas. Quem confere é o autor, olhando.
- **Piora: as duas se chamam "playground"**, e o vocabulário de trabalho (bancada × aplicação) não está nos nomes dos arquivos. Renomear ficou fora do passe.
- **Piora: a aplicação anda no ritmo da bancada.** Uma feature que o autor quer no produto passa antes pela página, mesmo quando a forma dela parece óbvia.

## Reversão

**O sinal** seria a bancada parar de produzir fatos: features passando para a aplicação sem mudança nenhuma em relação ao que se teria escrito direto, ou o autor pulando a bancada porque ela atrasa. Outro sinal é a deriva: a mesma interação divergindo entre as duas telas a ponto de a bancada deixar de ser referência confiável.

**O custo da volta é baixo para os arquivos e alto para o hábito.** Aposentar a bancada é congelar o `playground.html` como as `colmeia-*` foram congeladas. O que se perde é o lugar barato de errar, e o custo aparece depois, nas ideias que vão nascer já em React.

**O que já foi construído em cima:** o `@odds/layout` como fonte única do desenho para as duas telas, o `colmeia-embed.mjs` embutindo o pacote, o congelamento da `colmeia-v4.html` e o primeiro incremento da aplicação, construído por paridade com a bancada.
