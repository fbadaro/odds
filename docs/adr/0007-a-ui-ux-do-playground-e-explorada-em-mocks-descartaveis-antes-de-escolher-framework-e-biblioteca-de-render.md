---
adr: 0007
title: A UI/UX do playground é explorada em mocks descartáveis antes de escolher framework e biblioteca de render
status: accepted
date: 2026-09-07
deciders: Fabio Badaro, Claude
tags: ui, processo, playground, prototipagem
supersedes: —
superseded-by: —
---

# ADR-0007 — A UI/UX do playground é explorada em mocks descartáveis antes de escolher framework e biblioteca de render

> **Cumprido em 2026-10-20.** As três escolhas de stack que este ADR adiou estão feitas: layout e render no `ADR-0009`, framework de UI e componentes no `ADR-0014`, bundler no `ADR-0015`. A exploração em mocks continua como bancada de UI/UX (`docs/design/pages/playground.html`), mas deixou de anteceder decisão de stack. Uma ressalva honesta: a rodada de estados (degradação, diagrama obsoleto, vazio) que o `docs/design/README.md` punha antes destas ADRs ainda não foi feita. Ela é desenho de render, não de chrome, e nada nela dependia do framework do chrome.

> **Continuado em 2026-10-22 pelo `ADR-0017`.** A bancada que esta exploração deixou passa a ter um protocolo próprio: ideia de interface nasce e é validada nela, e a aplicação (`apps/playground`, `ADR-0016`) implementa só o que foi validado. As duas compartilham biblioteca, nunca tela.

## Contexto

Com a `@odds/core` e a `@odds/messages` fechadas — 44 golden files verdes, o diagnóstico virando frase —, a Fase 1 do `PRD.md` §9.3 estava entregue e a Fase 2, o playground, era o próximo trabalho. Três decisões de stack seguiam em aberto, nomeadas na rubrica do `HEALTH.md` §9.2 sob o critério R6.4: framework de UI, biblioteca de layout/render do diagrama e bundler.

A ordem aparente era decidi-las primeiro. Elas são pré-requisito técnico de qualquer linha de código de interface, e o critério da rubrica as trata como um bloco — quem lê "stack e toolchain decididos: 14 de 20" entende que faltam três escolhas e que o caminho é fazê-las.

Duas coisas trabalhavam contra essa ordem. A primeira é que a mais pesada das três — a biblioteca de render — não é escolhível por catálogo neste produto: o `PRD.md` §4.4 exige **duas vistas com poder expressivo deliberadamente diferente**, a §5.2 exige que elementos com erro sejam desenhados *visivelmente marcados* em vez de sumirem, e a mesma §5.2 exige export vetorial **com os marcadores**, o que já elimina qualquer biblioteca que rasterize em canvas. Sem saber quais áreas a tela tem e o que cada uma precisa mostrar, a comparação entre bibliotecas seria feita sobre requisitos inventados.

A segunda é assimetria de custo. Um framework adotado atrai código, dependências e hábitos; uma tela desenhada em HTML estático se joga fora numa tarde. Os `ADR-0002` e `ADR-0005` já haviam pago o preço de decidir cedo em outra frente e registrado que ali havia razão para isso — a gramática estava fechada e o alvo, conhecido. Aqui não estava: nem o autor sabia, no início da sessão, se o editor de texto seria metade da tela ou um painel recolhível.

Havia ainda um risco de forma. Mock desenhado com fidelidade demais decide sem declarar: desenhar nós, arestas e tags do diagrama produziria um alvo visual que só uma biblioteca específica alcança, e a escolha estaria feita pela porta dos fundos, sem ADR e sem alternativas registradas.

## Decisão

A UI/UX do playground é explorada em **mocks HTML estáticos e descartáveis**, num canvas de design versionado em `docs/design/`, **antes** de escolher framework de UI, biblioteca de layout/render e bundler. A **área do diagrama entra nos mocks como wireframe neutro**, e nenhuma rodada de exploração termina sem uma **base** — uma variante escolhida contra a qual as seguintes são testadas.

O argumento que venceu é o de **ordem de informação, não o de custo**. Não é que mock seja mais barato que protótipo — é que a decisão adiada precisa de fatos que só a exploração produz. Escolher a biblioteca de render exige saber quantas áreas a tela tem, quanto espaço sobra para o diagrama, se o mesmo desenho é reaproveitado nas duas vistas e onde os marcadores de erro precisam caber. Todos esses fatos são resultado do desenho da tela, não entrada dele. Decidir primeiro seria decidir sobre requisitos supostos, e a `Reversão` deste ADR mostra que essa é a decisão cara de desfazer, não esta.

O wireframe neutro é parte da decisão, não uma limitação dela: é o que impede a exploração de decidir a biblioteca sem passar por um ADR.

A base cumpre a função inversa: impede que a exploração termine de mãos vazias. A variante D — canvas de ilhas com trilho de quadrados isolados governando os painéis, e o diagnóstico ancorado no rodapé — foi fixada como base em 2026-09-07, e as variantes A, B e C saíram do canvas mas continuam versionadas, porque cada uma carrega um tradeoff recusado por escrito.

## Alternativas consideradas

### Decidir a stack primeiro e prototipar direto no framework

A ordem natural, e a que o R6.4 sugere ao tratar as três escolhas como um bloco. Rejeitada porque inverte a dependência de informação: a biblioteca de render se escolhe contra requisitos que a exploração ainda não tinha produzido. Tem um segundo custo, menos visível: protótipo feito no framework definitivo raramente é jogado fora — vira o começo do produto, e com ele entram decisões de estrutura que ninguém tomou deliberadamente.

### Explorar em ferramenta de design dedicada (Figma e similares)

Melhor ferramenta de desenho, e ninguém discute isso. Rejeitada por duas razões desta casa. A primeira é que o artefato não versiona junto com o repositório — o `PROPAGATION-MAP.md` e o `GRILLING.md` existem porque este projeto trata registro como parte do trabalho, e um link para um arquivo externo com histórico próprio quebra isso. A segunda é que HTML é o meio de saída real: uma tela desenhada em HTML já responde perguntas de tipografia, quebra e densidade que uma prancha vetorial responde por aproximação.

### Pular a exploração e ir direto ao código do playground

Defensável num produto cuja tela é óbvia. Não é o caso: o `PRD.md` §4.4, §5.2 e §5.3 descrevem comportamentos — degradação por elemento, diagrama congelado marcado como obsoleto, navegação em domínios complexos — que não têm forma canônica. Sem exploração, essas decisões seriam tomadas uma a uma dentro de commits de implementação, que é o lugar onde decisão nenhuma consegue ser encontrada depois.

### Mocks de alta fidelidade, com o diagrama desenhado

Foi a tentação real, e a mais perigosa das quatro: produz a imagem mais convincente para discutir. Rejeitada porque desenhar nós, arestas e tags fixa um alvo visual que passa a exigir uma biblioteca capaz de reproduzi-lo — a escolha da §4.4 e da §5.2 estaria feita, sem ADR e sem alternativas registradas. O wireframe neutro é o preço pago para manter a decisão da biblioteca aberta e explícita.

## Consequências

- A biblioteca de render passa a ser escolhida contra uma lista de exigências concretas — áreas da tela, espaço útil do diagrama, onde marcadores cabem — em vez de contra requisitos supostos.
- Existe uma base (`docs/design/canvas/Main.dc.html`) contra a qual toda hipótese nova é testada, e para onde se volta quando nada convence. Exploração deixa de poder terminar sem desenho.
- As hipóteses ficam escritas com o que as derrubaria (`docs/design/README.md`), e as referências ficam **anotadas** — o que pegar e o que não pegar de cada uma. O `REFERENCES.md` da raiz é lista de URLs sem anotação, e é exatamente isso que a rubrica do `HEALTH.md` §9.1 desconta.
- **Piora, e é o preço:** a Fase 2 do `PRD.md` §9.3 começa mais tarde. Nenhuma linha de código de produto sai desta rodada, e o R6.4 continua em 14 de 20 — a exploração não conquista pontos de stack, porque não decide stack.
- **Piora também:** parte do desenho terá de ser refeita quando a biblioteca entrar. Tudo o que depende do render — as duas vistas, os estados de degradação, a marca de diagrama obsoleto — ficou deliberadamente de fora, então essa rodada não é a última.
- O canvas publicado é um artefato fora do git (só as fontes `.dc.html` e o `canvas.json` são versionados). Quem só olhar o repositório vê as fontes, não a montagem — e quem só olhar o canvas não vê as hipóteses.

## Reversão

O sinal de erro seria a exploração deixar de produzir fatos novos: uma rodada em que as perguntas em aberto passam a ser todas sobre comportamento de biblioteca — quão bom é o layout automático, quanto custa re-renderizar a cada tecla, o export vetorial sai com os marcadores — e não mais sobre áreas, densidade ou fluxo. Essas três já estão nomeadas em `docs/design/README.md` como *o que mock nenhum resolve*. Quando forem a maioria, a exploração acabou e insistir nela vira procrastinação com aparência de método.

Desfazer é barato **agora** e fica caro depressa. Hoje o que existe é documentação e cinco arquivos HTML estáticos sem dependência nenhuma: abandonar custa apagar um diretório. O que se perderia não é o desenho — é o registro de por que a base é o que é, que vive nas variantes recusadas e nas hipóteses com critério de refutação.

Em cima desta decisão já foram construídas: a base do protótipo, a fronteira "diagnóstico tem lugar fixo no rodapé" (fechada em 2026-09-07 contra a alternativa de virar um quadrado do trilho) e a regra de que o desenho do render espera a biblioteca. Se esta decisão for revertida — stack escolhida primeiro —, as três voltam a ficar em aberto, e a primeira delas é a mais cara de redecidir, porque foi tomada com uma alternativa concreta à vista em vez de no papel.
