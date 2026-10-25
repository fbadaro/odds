---
adr: 0008
title: Um subdomain declara description e owner, e nada além disso
status: accepted
date: 2026-09-12
deciders: Fabio Badaro, Claude
tags: linguagem, gramatica, propriedades, subdomain
supersedes: —
superseded-by: —
---

# ADR-0008 — Um subdomain declara description e owner, e nada além disso

> **Fechado em 2026-10-24.** O mock `docs/design/pages/colmeia-v2.html` que este ADR cita foi apagado depois de validado, junto com as colmeias v1, v3 e v4 (`ADR-0023`). A decisão segue em vigor na linguagem, e o mock segue no git: `git show e282c83:docs/design/pages/colmeia-v2.html`.

> **Executado em 2026-10-06**, na `ODDS Language Version` 1.0.0 (`GRAMMAR.md` v0.3.0, `AST_SCHEMA.md` v0.3.0, `RULES` v0.3.0). A execução tomou uma escolha de forma que este ADR não tomou: `owner` passou a ser **palavra reservada**, como todas as chaves de propriedade. Isso torna inválido um nome `owner` e faz da mudança uma MAJOR. A alternativa, palavra contextual, manteria a mudança em MINOR e foi recusada. As duas saídas, e a ausência deliberada de diagnóstico de migração, estão no `CHANGELOG.md` (entrada v1.0.0). O texto abaixo é o da decisão, como foi tomada.

## Contexto

A linguagem nasceu com as propriedades concentradas num único nível. O `GRAMMAR.md` §2 dá ao `context_block` um conjunto **fechado** de seis chaves — `type`, `description`, `responsibilities`, `maturity`, `team`, `technology` — e dá ao `subdomain_decl` apenas `title`, pela produção `title_decl` que os três níveis compartilham. Essa assimetria nunca foi decidida: ela é o que sobrou de as propriedades terem sido pensadas para descrever um bounded context, que é artefato de solução.

A rodada de render de 2026-09-11/12 preencheu as seis em todos os contextos do mock e desenhou uma ficha lateral por elemento. Com a ficha na tela, a assimetria virou pergunta concreta: clicar num hexágono trazia oito linhas de informação; clicar num território trazia o tipo, o título e mais nada declarado. O autor da rodada — que é o próprio perfil que o `PRD.md` §4.4 descreve ao exigir duas vistas do mesmo modelo — notou que faltava ali exatamente aquilo que se procura primeiro num mapa estratégico corporativo: *por que este subdomínio existe* e *quem responde por ele*.

Três forças em tensão, e nenhuma delas aponta sozinha para uma saída.

A primeira é a **promessa de que propriedade não julga**, escrita no `CLAUDE.md` e sustentada pela divisão do `RULES-EN.md` §0.2 entre anotação que é contrato e anotação que é documentação: nenhuma propriedade alimenta o gatilho de uma regra, e é isso que permite preencher `team` sem medo. A segunda é que o `subdomain` já carrega `core | supporting | generic`, que **é contrato** — alimenta `CORE_IN_SHARED_KERNEL`, `CORE_UPSTREAM_OF_GENERIC`, `GENERIC_WITHOUT_OHS`, `CONFORMIST_CORE` e `DOMAIN_WITHOUT_CORE`, todos catalogados no `AST_SCHEMA.md` §1.3. Qualquer chave nova no subdomínio nasce, portanto, encostada num campo que julga. A terceira é o custo: construto de linguagem entra no eixo **ODDS Language Version** do `CHANGELOG.md` e viaja no payload da URL compartilhável, que o `RULES-EN.md` §0.5 registra como a premissa que sustenta "um arquivo, um `domain`".

O que não se sabia, e o mock passou a mostrar, era se as chaves candidatas atraem prosa de negócio ou descrição técnica disfarçada — e se a ficha fica legível ou vira formulário.

## Decisão

O `subdomain_decl` passa a aceitar **duas** propriedades, num conjunto fechado próprio: `description` e `owner`, ambas `string_literal`, ambas opcionais, ambas depois do `title_decl` e antes dos `context_decl`.

O argumento que venceu não é "seria útil ter mais informação" — isso vale para qualquer chave, inclusive para as que estão sendo recusadas aqui. O argumento é um **teste de admissão** que separa estas duas de todas as outras candidatas:

> Uma propriedade de `subdomain` só é admissível se **não puder contradizer** nem a classificação `core | supporting | generic` nem os contextos que ela contém.

A razão é mecânica, não estética. No instante em que uma propriedade pode contradizer o que está declarado ao lado dela, alguém vai querer um diagnóstico para essa contradição — e um diagnóstico cujo gatilho é uma propriedade quebra a promessa do `RULES-EN.md` §0.2 de uma vez, para todas as propriedades, inclusive as seis que já existem. A promessa não é divisível: basta uma propriedade julgada para que preencher `team` volte a dar medo.

`description` e `owner` passam porque são **prosa**. Uma frase não contradiz um enum, e um nome de responsável não contradiz nada declarado. Elas também passam um segundo teste, mais fraco mas necessário: não são **deriváveis** dos filhos. Um subdomínio com três contextos de três squads tem um `owner` só, e a razão de ele existir não é a concatenação das responsabilidades dos contextos dele.

Duas escolhas de forma, ambas com alternativa registrada abaixo. `description` **reutiliza a chave que já existe** em `context`, em vez de inventar `vision` ou `purpose`: é o mesmo precedente do `title_decl`, que o `GRAMMAR.md` §2 registra ter sido extraído para produção própria justamente para valer nos três níveis sem duplicar lógica. E o conjunto é **fechado e próprio do subdomínio**, não uma liberação parcial das seis chaves do contexto — porque as outras quatro são de espaço de solução e não têm significado neste nível.

O mock em `docs/design/pages/colmeia-v2.html` traz as duas preenchidas nos treze subdomínios, atrás de um controle rotulado como hipótese, e foi ele que fechou a questão sobre a qual não havia opinião possível no papel: as chaves atraem prosa de negócio (*"Receber o dinheiro e provar que recebeu"*), e a ficha ganhou três faixas que se leem sozinhas — **declarado**, **derivado** e **filhos**.

## Alternativas consideradas

### Não acrescentar nada: o subdomínio continua só com `title`

A saída mais barata, e a que o estado atual já implementa. Rejeitada porque a informação existe no mundo e vai ser escrita de todo jeito: sem lugar próprio, ela migra para o `title` (`title: "Vendas — Diretoria Comercial"`) ou para o `description` de um dos contextos, que é o lugar errado e não sobrevive a uma reorganização. Uma linguagem que não tem campo para o que o usuário precisa registrar não evita o registro — ela o empurra para o campo errado, e aí o dado fica inacessível para o render e para qualquer regra futura.

### Liberar as seis chaves do `context` também no `subdomain`

A opção com menos gramática nova: um só conjunto fechado, válido nos dois níveis. Rejeitada por erro de categoria e por contradição.

`technology` não tem significado num subdomínio — ele não tem runtime. `type` colidiria com `subdomain_type`, que já ocupa essa palavra com `core | supporting | generic`, e ensinaria vocabulário sobrecarregado: exatamente o erro que o exemplo canônico do `GRAMMAR.md` §2 já evita ao distinguir `type: "gateway"` de `subdomain generic`. `responsibilities` seria uma segunda verdade sobre o que os contextos filhos já são, e duas verdades sobre a mesma coisa divergem.

`maturity` é a mais tentadora e a que melhor demonstra o teste de admissão. Declarada de forma independente, ela pode contradizer os filhos — `maturity: mature` num subdomínio cujos três contextos são `experimental` — e a contradição pede regra. Derivada dos contextos, ela não é declaração nenhuma: é coluna calculada. O mock resolveu isso sem gramática, pondo os números derivados sob um rótulo **Derivado** na ficha, separado de **Propriedades**. É onde um `maturity` de subdomínio pertence, e é razão suficiente para ele não entrar na linguagem.

### Acrescentar `volatility` junto, como terceira chave

A candidata mais rica do ponto de vista de DDD estratégico: com que velocidade o *problema* muda, que é genuinamente do nível do subdomínio e não tem equivalente entre as seis. Rejeitada **nesta porta**, não em absoluto.

Um subdomínio `generic` com volatilidade alta não é um dado neutro: é um sinal de que a classificação talvez esteja errada. No momento em que é sinal, `volatility` deixou de ser documentação e passou a ser candidata a **regra** — e a fila dela é outra: `AST_SCHEMA.md` §1.3 primeiro, com code, fase e severidade, passando pelos dois critérios do `RULES-EN.md` §0.4. Pelo critério do fix distinto ela até parece passar, porque o conserto ("reclassifique o subdomínio") não é o conserto de nenhuma regra existente. Entrar como propriedade seria colocar contrato no lugar da documentação, que é o dano que esta decisão existe para evitar.

### Chave livre, `key: value` sem conjunto fechado

Máxima flexibilidade, zero gramática por chave nova. Rejeitada porque o `GRAMMAR.md` §2 registra que `property_key` é conjunto fechado de literais, e não `identifier` livre, de propósito: chave desconhecida é erro sintático, o que dá diagnóstico imediato em vez de um campo silenciosamente ignorado. Chave livre também mataria a possibilidade de o render tratar cada propriedade por tipo — a `maturity` já é desenhada como pill com cor, e isso exige saber o que a chave significa.

### `vision` ou `purpose` no lugar de `description`

Nome mais preciso para "por que este subdomínio existe" do que uma palavra genérica. Rejeitada pela mesma razão que o `title_decl` existe: reutilizar a chave mantém uma palavra para um significado em todos os níveis, e o vocabulário da linguagem já tem nove tags e trinta e quatro codes para decorar. `description` responde "o que é isto" em qualquer um dos três níveis — no contexto, um escopo de solução; no subdomínio, uma razão de negócio. A diferença vem do nível, não da palavra.

### `owner` como enum ou referência, em vez de texto livre

Um `owner` validável — apontando para uma lista de times declarada em algum lugar — permitiria conferir grafia e detectar dono inexistente. Rejeitada porque exige um registro de times na linguagem, que é uma segunda decisão bem maior, e porque validar dono empurra `owner` para o lado do contrato. Texto livre é deliberado: ele é documentação, e documentação não se confere.

## Consequências

- O `subdomain` passa a responder duas perguntas que hoje não têm lugar, e a ficha lateral do playground passa a ter conteúdo declarado em todos os níveis — o que importa para o perfil de arquitetura corporativa que o `PRD.md` §4.4 atende com a vista de contenção.
- O teste de admissão fica **escrito**, e é reutilizável: toda futura candidata a propriedade de subdomínio passa a ter uma pergunta objetiva a responder antes de entrar. Sem ele, a próxima discussão começaria do zero.
- A distinção **declarado / derivado** ganha forma na interface, e com ela um lugar para tudo que for agregação dos filhos, sem precisar de gramática.
- **Piora, e é o preço principal:** isto é mudança de linguagem. Entra no eixo `ODDS Language Version` do `CHANGELOG.md`, muda o payload da URL compartilhável, e obriga uma passada normativa em `GRAMMAR.md` §2 (produção do bloco e regra de posição), `AST_SCHEMA.md` §2 (o `SubdomainNode` ganha dois campos opcionais) e `TEST_SUITE.md` §1 com o golden file correspondente. Nada disso está feito neste ADR: ele registra a decisão, não a execução.
- **Piora também:** um arquivo `.odds` escrito com as duas chaves deixa de ser legível por qualquer implementação anterior. Isso não é dramático agora, com uma implementação e nenhum usuário externo, e é exatamente o tipo de dano que fica caro depois.
- **Piora, terceira:** dois níveis com conjuntos de chaves diferentes são mais difíceis de ensinar do que um nível só com propriedades. A mitigação é a reutilização de `description`, que faz a diferença entre os níveis ser *quantas* chaves, não *quais palavras*.
- Nenhuma regra nova, nenhum code novo, nenhuma mensagem nova. A propriedade não julga — é o ponto inteiro.

## Reversão

**O sinal que indicaria erro** é um pedido de diagnóstico sobre o conteúdo de `description` ou `owner`. Qualquer um destes: "avise quando um subdomínio `core` não tem `owner`"; "avise quando dois subdomínios têm o mesmo `owner`"; "avise quando o `description` está vazio". Todos são razoáveis do ponto de vista de quem usa, e todos significam que estas chaves atravessaram a fronteira e se tornaram contrato — e nesse momento o certo não é atender ao pedido, é reabrir este ADR. Se a resposta for atender, o que se está decidindo de verdade é abandonar a promessa do `RULES-EN.md` §0.2, e isso merece ADR próprio em vez de virar mais uma regra no catálogo.

Um segundo sinal, mais silencioso: se o preenchimento real de `description` no subdomínio vier em linguagem técnica em vez de linguagem de negócio, a chave está no nível errado — ou o nome está atraindo a coisa errada. Isso se mede olhando arquivos reais, não discutindo.

**O custo da volta é assimétrico no tempo.** Hoje é baixo: remover duas produções da gramática, dois campos opcionais do AST, um golden file, e uma entrada de `CHANGELOG.md`. Como as duas chaves são opcionais, nenhum arquivo existente quebra ao serem removidas — só os que as usarem. Depois de haver arquivos de usuários com as chaves preenchidas e URLs compartilhadas circulando, a volta deixa de ser remoção e passa a ser migração, o que é outra ordem de grandeza. O `RULES-EN.md` §0.5 já nomeia a URL compartilhável como premissa estrutural, e é ela que torna a janela de reversão curta.

**O que já foi construído em cima**, no momento em que isto é escrito: o mock `colmeia-v2.html`, com as duas chaves nos treze subdomínios e a ficha em três faixas. É descartável por construção — é o que o `ADR-0007` decidiu, e é a razão de esta decisão ter sido tomada olhando em vez de no papel. A passada normativa ainda **não** foi feita, então quem reverter agora reverte um ADR e um mock, não a linguagem. É a hora mais barata de mudar de ideia, e vale registrar que ela não vai durar.
