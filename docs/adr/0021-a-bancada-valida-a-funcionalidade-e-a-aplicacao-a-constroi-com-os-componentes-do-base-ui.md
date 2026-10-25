---
adr: 0021
title: A bancada valida a funcionalidade, e a aplicação a constrói com os componentes do Base UI
status: accepted
date: 2026-10-23
deciders: Fabio Badaro, Claude
tags: processo, ui, playground, bancada, componentes
supersedes: 0017
superseded-by: —
---

# ADR-0021 — A bancada valida a funcionalidade, e a aplicação a constrói com os componentes do Base UI

## Contexto

O `ADR-0017` fez da bancada (`docs/design/pages/playground.html`) o lugar onde ideia de interface nasce e é validada, e da aplicação (`apps/playground`) a implementação só do que passou por lá. Ele chamou a bancada de **"especificação visual e de comportamento"**, e o `ADR-0020` deu a isso um mecanismo: `data-feature` na bancada, teste de paridade na aplicação. A skill `portar-da-bancada` traduziu as duas coisas num roteiro que mandava ler o markup, o CSS e o script da feature, portar o estilo para o `.module.css` e, na dúvida, seguir a bancada.

A primeira paridade completa, as 17 features de 2026-10-22, seguiu esse roteiro, e o resultado mostrou uma tensão que o `ADR-0017` não tinha nomeado. A bancada é HTML sem build, de propósito, e por isso não pode usar o Base UI: todo comportamento dela é escrito à mão. O `ADR-0014` escolheu o Base UI justamente para que comportamento acessível (foco, teclado, ARIA, camadas, posicionamento) deixasse de ser resolvido caso a caso. Transcrever a bancada levou o caso a caso para a aplicação. Das 17 features, só duas passam pelo Base UI (`Menu` e `ToggleGroup`). O trilho e os filtros do rodapé são botões com `aria-pressed` escritos à mão, a lista do rodapé recolhe com `aria-expanded` próprio, as dicas são o atributo `title`, e `useGlobalEscape.ts` descobre se o menu está aberto procurando `[role="menu"]` no DOM.

Em 2026-10-23 o autor pôs a questão assim: *"eu gostaria de levar a funcionalidade que validamos, não necessariamente o layout que será gerado; o playground.html pode gerar qualquer html estilizado, mas quando vier para a aplicação precisamos seguir os componentes do Base UI"*.

Ficava em aberto o que exatamente atravessa da bancada para a aplicação (tudo, só o comportamento, ou comportamento e visual separados), e o que fazer onde o Base UI não tem componente ou onde o componente dele não serve.

## Decisão

**A bancada valida a funcionalidade: o que a feature faz, não o HTML nem o CSS com que faz. A aplicação constrói cada feature validada com os componentes do Base UI sempre que existir um para aquele comportamento, com o visual saindo do `DESIGN.md` e não do CSS da bancada.**

Na prática:

1. **O que atravessa** é o comportamento observável: os estados da feature e o que leva de um a outro, o que o clique, o teclado e o foco fazem, os tempos (os 300 ms da tecla, os 4200 ms do aviso), o que acontece com o mapa, e os textos da interface, que são conteúdo validado e não estilo. **O que não atravessa** é o markup, a estrutura do DOM, os nomes de classe, o CSS e a composição exata da tela. A bancada pode montar qualquer HTML estilizado para provar uma ideia.
2. **O comportamento vem do Base UI** quando ele tem o componente: dica é `Tooltip`, botão que liga e desliga é `Toggle`, conjunto de botões é `ToggleGroup` ou `Toolbar`, área que recolhe é `Collapsible`, menu é `Menu`, janela é `Dialog`, e assim por diante. A anatomia do componente (`Trigger`, `Positioner`, `Popup` e as outras partes) é a estrutura do DOM na aplicação, mesmo quando a bancada fez de outro jeito.
3. **O visual vem do `DESIGN.md`**, por tokens e pelos componentes que ele especifica, estilizando os atributos de estado do Base UI (`[data-pressed]`, `[data-open]`). O CSS da bancada vale como pista do que se quis mostrar, não como valor a copiar.
4. **Componente próprio só onde o Base UI não tem o que usar**: a colmeia (`ADR-0014`), as ilhas, a ficha, a disposição do rodapé. Se o Base UI tem o componente e ele não serve, a exceção é escrita no próprio componente com a razão, como o `Toast.tsx` já faz.

Fica de pé, do `ADR-0017`, tudo o que não era sobre o visual. A bancada continua sendo o lugar barato de errar. A aplicação não inventa feature. As duas compartilham biblioteca (`@odds/core`, `@odds/messages`, `@odds/layout`), nunca código de tela. O mapa, que é desenhado pelo `@odds/layout`, sai idêntico nas duas porque é a mesma função, e não por transcrição.

O argumento que venceu é que **as duas telas existem para coisas diferentes, e a decisão as separa onde a diferença está**. A bancada responde se uma ideia funciona para quem usa. A aplicação responde como ela fica mantível e acessível. Transcrever o HTML da bancada fazia a aplicação herdar exatamente a parte que a bancada não testou (o ARIA escrito à mão, o foco que ninguém conferiu com leitor de tela) e desfazia o motivo de ter adotado o Base UI.

## Alternativas consideradas

### Manter a bancada como especificação visual e de comportamento (o `ADR-0017` como estava)

Tem a vantagem de uma régua só: a aplicação está certa quando parece com a bancada, e a conferência é olhar as duas lado a lado. Rejeitada porque a régua mede a coisa errada. Ela premia reproduzir o DOM da bancada, que é comportamento escrito à mão, e entra em choque com o `ADR-0014` toda vez que a anatomia do Base UI é diferente do markup que a bancada usou. Foi o que a paridade de 2026-10-22 produziu, e o autor a recusou.

### A bancada também usa o Base UI

Faria o markup das duas coincidir, e a transcrição voltaria a ser segura. Rejeitada pelo argumento do `ADR-0017` contra compartilhar código de tela: o Base UI é React, e a bancada passaria a precisar de build e de modelo de componentes, que é o que a torna barata de mexer. A ideia experimental teria de respeitar a estrutura da aplicação antes de ser validada.

### A bancada especifica só o comportamento, e a aplicação escolhe livremente como construí-lo

É a metade desta decisão, sem a regra do Base UI. Rejeitada porque deixa aberto o caminho que produziu o problema: sem a regra, o mais curto continua sendo copiar o comportamento da bancada à mão, e o comportamento acessível volta a ser código do projeto. O ponto do `ADR-0014` era concentrar isso numa biblioteca.

### Base UI obrigatório, sem exceção

Mais simples de conferir: todo comportamento padrão passa pelo Base UI, e ponto. Rejeitada porque o caso já existe. O `Toast` do Base UI é um gerente de fila com ids, e o store guarda uma só mensagem (nota de 2026-10-23 no `ADR-0014`). Forçar o componente seria torcer o estado para servir à biblioteca. A exceção fica permitida, mas precisa ser escrita no componente com a razão, para que a próxima pessoa saiba que foi escolha e não esquecimento.

## Consequências

- O mecanismo do `ADR-0020` não muda: `data-feature`, o teste de paridade nas duas direções e o `PENDING`. Muda o que a marca afirma. Antes ela dizia que a aplicação tinha o componente que reproduz a bancada. Agora diz que a funcionalidade existe na aplicação. A conferência lado a lado (skill `page-shot`) passa a comparar estados e comportamento, não pixels.
- As 17 features portadas sob o `ADR-0017` ficam fora de conformidade onde transcreveram comportamento que o Base UI tem. Os candidatos já vistos são o trilho (`Rail.tsx`) e os filtros do rodapé (`DiagnosticsDock.tsx`), que são botões com `aria-pressed` escritos à mão (`Toggle` e `ToggleGroup`), a lista do rodapé, que recolhe com `aria-expanded` próprio (`Collapsible`), as dicas em `title` (`Tooltip`), e `useGlobalEscape.ts`, que lê o DOM do menu em vez do estado dele. Revisá-los é trabalho a fazer, não parte deste passe.
- A skill `portar-da-bancada`, o hook de `.claude/settings.json` e o `CLAUDE.md` passam a dizer "funcionalidade" onde diziam "especificação" e a mandar escolher o componente Base UI antes de escrever markup.
- **Piora: a bancada e a aplicação vão parecer diferentes**, e isso deixa de ser defeito. Quem compara as duas a olho já não sabe, pela imagem, se a aplicação está certa. Precisa saber o que a feature faz.
- **Piora: a decisão visual de cada componente passa a ser tomada na aplicação**, que é o lugar caro de errar. O `DESIGN.md` limita o estrago, mas um componente sem especificação ali vai ter a forma decidida no código, sem ter passado pela bancada.
- **Piora: a fronteira de "não inventar UI" fica menos óbvia.** A anatomia do Base UI acrescenta peças que a bancada não tem (`Positioner`, `Backdrop`, `Arrow`). Elas são estrutura do componente, não feature nova, e a proibição continua valendo para feature.

## Reversão

**O sinal** seria o autor pedir repetidamente que a aplicação "fique igual à bancada". Isso mostraria que o visual da bancada era, afinal, parte do que se validava. Outro sinal é a anatomia do Base UI brigar com o `DESIGN.md` a ponto de cada componente precisar de exceção, e a regra virar a lista das exceções.

**O custo da volta** é baixo nos documentos (este ADR, a skill, o hook, o `CLAUDE.md`) e médio no código. Um componente refeito sobre o Base UI pode voltar a ser markup próprio, mas cada volta reabre o comportamento acessível que o `ADR-0014` quis tirar da mão do projeto.

**O que já foi construído em cima:** a revisão da skill `portar-da-bancada`, do hook e do `CLAUDE.md` neste mesmo passe, e, a partir daqui, a revisão das features portadas sob o `ADR-0017`.
