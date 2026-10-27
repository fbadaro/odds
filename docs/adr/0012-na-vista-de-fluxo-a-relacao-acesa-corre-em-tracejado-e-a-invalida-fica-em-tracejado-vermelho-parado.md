---
adr: 0012
title: Na vista de fluxo, a relação acesa corre em tracejado e a inválida fica em tracejado vermelho parado
status: accepted
date: 2026-10-09
deciders: Fabio Badaro, Claude
tags: render, playground, vistas, degradação
supersedes: —
---

# ADR-0012 — Na vista de fluxo, a relação acesa corre em tracejado e a inválida fica em tracejado vermelho parado

> Os protótipos que este ADR cita (as páginas da exploração de UI em `docs/`) saíram da árvore depois de validados e seguem no git, no commit `e282c83`. A decisão segue em vigor no `@odds/layout`. O `@odds/layout` escreve o `data-flow` no SVG, e a animação mora em `apps/playground`.

## Contexto

A rodada de navegação do `ADR-0011` (a página de navegação) pôs um mapa de 50 contextos na mão de quem navega. Ao clicar num contexto, as relações dele acendiam só por cor e espessura. O autor pediu que as linhas de conexão fossem tracejadas e animadas.

Uma restrição já existia. O `RULES-EN.md` §5 define a marca do estado degradado: *"a dashed red edge for an invalid relationship"*. O tracejado já tinha dono. Usá-lo para outra coisa apagaria a única distinção visual que a especificação pede para a relação inválida.

Havia quatro saídas. A primeira era manter a linha sólida, como estava. A segunda era um pulso de luz correndo sobre a linha sólida. A terceira era tracejado animado só nas relações acesas. A quarta era toda linha tracejada e animada, trocando a marca de inválida. As duas do meio foram construídas lado a lado na página, com um seletor, e comparadas no mesmo mapa.

Uma pergunta ficava em aberto em qualquer saída: o que acontece com a animação numa relação inválida.

## Decisão

**Na vista de fluxo, a relação válida é sólida em repouso. Quando o contexto é selecionado, as relações dele viram tracejado em movimento, do upstream para o downstream. A relação inválida é tracejado vermelho e parado, sempre, acesa ou não.**

O argumento que venceu foi do autor: **movimento é reservado para o que funciona.** A animação diz que a relação está de pé e mostra o sentido da dependência. Uma relação inválida não tem dependência confiável para mostrar, então ela perde o movimento e fica com a marca que o §5 já pedia. Isso também fecha a pergunta em aberto. O tracejado deixa de ser ambíguo, porque cor e movimento separam os dois casos: tracejado colorido em movimento é relação válida e acesa; tracejado vermelho parado é relação inválida.

O que conta como inválida segue o vocabulário de severidade: é a relação com pelo menos um diagnóstico `error` (fases 3 e 4, por exemplo `ROLE_CONFLICT`, `INCOMPLETE_MUTUAL_TAG`, `SEPARATION_CONFLICT`). `warning` e `info` não invalidam. Uma relação arriscada anima normalmente, e a severidade dela aparece no chip da porta. Isso é coerente com o princípio do erro-raiz do `RULES-EN.md` §3: só o `error` tira o elemento do pipeline.

Dois casos sem sentido de dependência ficam parados por natureza, não por invalidade. A mútua (`<->`) acesa fica tracejada e parada. A *Separate Ways* (`-x-`) nunca se move.

## Alternativas consideradas

### Pulso de luz sobre linha sólida

Um segmento curto de luz correndo pela linha, em todas as relações em repouso, ou só nas acesas quando há seleção. Não disputava nada com a marca de inválida, porque não é tracejado. Foi construído e comparado na página. Perdeu por escolha do autor diante das duas opções lado a lado. Ficou também uma fraqueza técnica: o pulso tinha comprimento proporcional à aresta, longo nas compridas e quase invisível nas curtas, e precisaria de outra técnica para ter tamanho fixo. Num mapa de 64 relações, todas pulsando em repouso, ele também acrescentava movimento justamente onde a página do marketplace de 50 contextos já mostrava excesso de linhas.

### Toda linha tracejada e animada, sempre

Era o pedido ao pé da letra. Rejeitada porque obrigaria a trocar a marca de relação inválida do `RULES-EN.md` §5 (e do `PRD.md` §5.2 e do `RULES-PT.md`). Seria uma mudança normativa feita para resolver um gosto de animação. Também tiraria do repouso a calma que o mapa grande precisa: com 64 relações em movimento constante, nenhuma chama atenção.

### Linha sólida, sem animação

O estado anterior. A relação acesa já se distinguia por cor e espessura. Rejeitada porque o sentido da dependência só aparecia na ponta da seta, que num mapa de 50 contextos costuma estar fora da tela depois do enquadramento. O movimento leva o sentido para a linha inteira.

## Consequências

- O `@odds/layout` e o playground herdam duas marcas de linha com significados disjuntos: o tracejado em movimento (relação válida, acesa) e o tracejado vermelho parado (relação inválida). Qualquer terceiro uso do tracejado precisa passar por este ADR.
- A rodada de estados (degradação, diagrama obsoleto) ganha a marca de relação inválida já desenhada e conferida. A página de navegação tem o arquivo *com erros* com três erros plantados só nas tags, e o build confere que exatamente essas três relações saem vermelhas.
- **Piora:** num mapa parado e visto de longe, a relação inválida em tracejado fino pode passar despercebida no meio de 64 linhas. A marca depende do chip de severidade na porta e do painel de diagnósticos para ser achada, e não só da linha.
- **Piora:** o export vetorial (`PRD.md` §5.2) não carrega movimento. No arquivo exportado, a relação acesa vira tracejado colorido parado, e a distinção para a inválida fica só na cor. O export precisa decidir se exporta a seleção.
- Com "reduzir movimento" ligado no sistema, a animação desliga. A relação acesa fica tracejada e colorida, e a distinção para a inválida fica de novo só na cor.

## Reversão

O sinal de erro seria um usuário confundir relação acesa com relação inválida, ou deixar de ver uma inválida porque o tracejado vermelho se perde no mapa. Outro sinal seria o movimento cansar em sessões longas de navegação. O teste humano da rodada de navegação é a primeira oportunidade de ver isso.

Desfazer custa pouco hoje: são algumas regras de CSS e o atributo `data-flow` numa página de design. Depois de o playground existir, a marca de inválida terá virado vocabulário do usuário, e mudá-la exigirá mudar o `RULES-EN.md` §5 e o `RULES-PT.md` no mesmo passe. O que já foi construído em cima: a página de navegação, com o seletor de arquivo e as checagens de sentido e de invalidade no build dela.
