---
adr: 0004
title: Monorepo em packages/, com o catálogo de mensagens em pacote próprio
status: accepted
date: 2026-09-05
deciders: Fabio Badaro, Claude
tags: estrutura, arquitetura, fronteiras
supersedes: —
---

# ADR-0004 — Monorepo em packages/, com o catálogo de mensagens em pacote próprio

> **Endereço da aplicação refinado em 2026-10-22 pelo `ADR-0016`.** O `@odds/playground` desta tabela mora em `apps/playground`, não em `packages/`, que passa a guardar só bibliotecas (`@odds/core`, `@odds/messages` e o `@odds/layout` do `ADR-0009`). A fronteira que este ADR decidiu, `@odds/core` sem dependência de `@odds/messages`, e a divisão entre núcleo e produto ficam como estão: o `ADR-0016` muda o endereço, não a decisão.

## Contexto

O primeiro código do projeto precisa de um lugar. Duas coisas do modelo já existente pressionam a escolha, e a segunda é a que decide.

**A linguagem e o produto não são a mesma coisa.** O `PRD.md` descreve um playground; os artefatos normativos descrevem uma DSL com gramática, contrato de dados e catálogo de regras. Um terceiro poderia querer validar `.odds` sem nunca abrir o playground — em CI, num editor, num bot de PR. Misturar os dois num pacote só torna isso impossível sem reempacotar.

**E há uma fronteira que hoje é só uma promessa em prosa.** O `MESSAGES.md` §1 fixa que um `Diagnostic` carrega `severity` + `code` + `span` + `data`, e **nunca** `message`: a frase é renderizada em separado, a partir do catálogo. A regra é explícita — *"never put a locale, an emoji, or a severity word inside the validator core"*. Hoje nada impede um `import` de violar isso; só disciplina.

Uma tentativa de scaffold não commitada, de 2026-08-27, já tinha `@odds/core` e `@odds/messages` como pacotes separados. Os diretórios sumiram e sobraram apenas symlinks quebrados em `node_modules`, mas a intuição por trás daquilo é boa e é adotada aqui.

## Decisão

**Monorepo com `packages/`**, e o catálogo de mensagens em pacote próprio:

| Pacote | Responsabilidade | Sabe sobre |
|---|---|---|
| `@odds/core` | Lexer, parser, AST, validador, as seis fases | Nada de texto de mensagem, nada de locale |
| `@odds/messages` | Renderiza `Diagnostic` + locale → frase, a partir do `MESSAGES.md` | Depende de `core` só para os tipos |
| `@odds/playground` | O produto: editor, diagrama, URL, auto-save | Depende dos dois |

`golden-files/` **fica na raiz**. Ele é a suíte executável da especificação, não do pacote — é o `TEST_SUITE.md` que o governa, e movê-lo para dentro de um pacote afirmaria que ele pertence a uma implementação.

O argumento que venceu é o do pacote de mensagens: **a separação transforma uma regra documental numa fronteira de módulo.** Com `@odds/core` sem nenhuma dependência de `@odds/messages`, a proibição de o validador renderizar uma frase deixa de depender de alguém lembrar dela — não há o que importar. É o mesmo princípio que fez este repo escrever quinze checagens mecânicas em vez de confiar em revisão: o que não é verificável, deriva.

A divisão núcleo/produto vem de graça junto, e é o que permite publicar o validador sozinho.

## Alternativas consideradas

### `src/` único, com subpastas `core/`, `messages/`, `ui/`

Rejeitada. Mais simples de começar, e é honesto dizer que a diferença é pequena com dois ou três pacotes. Mas subpasta não é fronteira: nada impede `core/validator.ts` de importar `messages/catalogue.ts`, e a promessa volta a ser disciplina — exatamente o que o repo evita em todo lugar. O custo de reverter para cá depois é baixo, o de sair daqui depois é maior.

### Monorepo, mas com mensagens dentro do core

Rejeitada, e era a divisão óbvia (linguagem vs. produto, dois pacotes). Perde precisamente o ganho que motivou a decisão: o catálogo de mensagens dentro do core deixa a violação a um `import` de distância. Também prenderia o `MESSAGES.md` — que versiona em **PATCH**, por ser só texto (`CHANGELOG.md`, eixo 1) — ao ciclo de versão do core, que versiona por mudança de contrato.

### Repositórios separados

Rejeitada. A `RULES-EN.md` §3.3 e o `AST_SCHEMA.md` §1.3 são um contrato único que atravessa parser, validador e visualizador; separar em repos faria cada mudança de contrato virar uma coordenação de PRs entre repositórios. O `.claude/rules/spec.md` fixa uma ordem de passe que toca vários artefatos de uma vez — ela pressupõe um repo.

## Consequências

**O que melhora.** A proibição mais importante do contrato de diagnósticos passa a ser estrutural. O validador vira publicável sozinho, sem arrastar o playground. E `@odds/messages` pode receber PATCH sem tocar na versão do core.

**O que piora.** Um pacote a mais para versionar, publicar e manter em sincronia — e três `package.json` em vez de um. Há também um risco real de a fronteira ser furada por conveniência (`@odds/core` importando mensagens "só para um log"); vale uma checagem futura que verifique o grafo de dependências, mas ela não existe ainda e **esta ADR não a promete**.

**O que não muda.** `golden-files/` continua na raiz e continua governado pelo `TEST_SUITE.md`.

## Reversão

**O sinal** seria a fronteira `core`/`messages` virar cerimônia: se na prática todo consumidor sempre importa os dois juntos e a separação só produz imports a mais, ela não está pagando o próprio custo.

**O custo da volta é baixo** e cai quase todo em mover arquivos e reescrever caminhos de import — nenhuma lógica muda, porque a divisão é por responsabilidade, não por acoplamento. Colapsar `messages` dentro de `core` é uma tarde; colapsar tudo em `src/` único, pouco mais.

**O que já foi construído em cima:** nada ainda. E o risco assimétrico favorece começar separado — juntar depois é mecânico, separar depois exige desfazer imports que se acumularam justamente porque a fronteira não existia.
