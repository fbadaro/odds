---
adr: 0022
title: As instruções de agente moram num AGENTS.md enxuto, com regras por caminho em .claude/rules/
status: accepted
date: 2026-10-24
deciders: Fabio Badaro, Claude
tags: processo, agentes, instruções, ferramental
supersedes: —
superseded-by: —
---

# ADR-0022 — As instruções de agente moram num AGENTS.md enxuto, com regras por caminho em .claude/rules/

## Contexto

O `CLAUDE.md` tinha 155 linhas e ~20 KB, carregados inteiros em toda sessão. Ele servia a quatro públicos de uma vez: quem mexe no parser (as âncoras de span, os dois comportamentos do Chevrotain), quem mexe na aplicação e na bancada (o contrato de paridade, os tokens gerados), quem edita a especificação (a ordem fixa de uma regra nova, os dois eixos de versão) e qualquer tarefa (comandos, camadas, convenções). Uma sessão que só mexia no CSS de um componente carregava as notas do lexer, e vice-versa. O arquivo também tinha envelhecido: dizia que a implementação "acabou de começar" com os 44 golden files passando e a aplicação no ar, contava as checagens do `health_check.py` de dois jeitos (15 e 16), e mandava ler um CONTEXT.md na raiz que nunca existiu.

Três fatos do ferramental mudaram o que era possível. O Claude Code instalado (2.1.310) lê o `AGENTS.md` nativamente desde a 2.1.277, quando não há `CLAUDE.md` no caminho, e é esse o nome que os outros agentes de código leem. Regras em `.claude/rules/` com `paths:` no frontmatter entram no contexto só quando um arquivo que casa com o glob é lido ou editado. E as skills aceitam `paths` (carregamento automático só na área) e `allowed-tools` (os próprios scripts sem pedido de permissão). A lista de descrições de skills tem orçamento de 1% do contexto e, com os plugins desta máquina, já transborda, então cada descrição sempre carregada disputa espaço com as outras.

O `docs/agents/` tinha vindo da instalação de um conjunto externo de skills. O `docs/agents/domain.md` apontava para o CONTEXT.md inexistente, e a versão atual daquele conjunto já o chama de GLOSSARY.md. O `docs/agents/issue-tracker.md` era quase todo sintaxe do `gh` mais seções de skills que este repositório não habilita (wayfinder, triage). As skills `gsap-core` e `svg-animations` só servem às páginas de `docs/design/pages/`, mas a descrição delas entrava em toda sessão. Os dois hooks eram uma linha de `jq` dentro do JSON, e o lembrete de changelog cobria três dos cinco documentos que têm versão própria.

## Decisão

O `AGENTS.md` da raiz é o único arquivo de instrução sempre carregado, e não há `CLAUDE.md`. Ele guarda o que vale para qualquer tarefa: o que é o projeto, os comandos e o critério de passe pronto, as camadas e o que cada uma não pode saber, a linguagem em resumo, onde mora cada resposta e as convenções (ADR sem pedir, issue e nome de branch, idioma). As notas de cada área ficam em quatro regras com `paths:`: `.claude/rules/spec.md` (os documentos normativos, os golden files e `packages/messages`), `.claude/rules/core.md` (`packages/core` e os golden files), `.claude/rules/app.md` (`apps/playground` e o `DESIGN.md`) e `.claude/rules/bench.md` (`docs/design`).

As skills de uma área só ganham `paths`: `page-shot`, `gsap-core` e `svg-animations` para `docs/design/**`, e `portar-da-bancada` para `apps/playground/**` e a bancada. As que rodam script ganham `allowed-tools`, e o frontmatter fica só com campos que o Claude Code lê. O `docs/agents/` sai, e o que ele tinha de vivo (issues no GitHub, em português, PR externo fora da triagem) vai para o `AGENTS.md`. Os dois hooks viram `.claude/hooks/post-edit.sh`, e o lembrete de changelog passa a cobrir também `RULES-EN.md`/`RULES-PT.md` e `MESSAGES.md`.

O argumento que venceu é que **cada linha sempre carregada compete pela atenção de toda tarefa**, e uma nota de área só é útil dentro da área. A regra por caminho põe a nota no contexto no momento em que ela vale: ao abrir o arquivo que ela governa. O nome `AGENTS.md` deixa o mesmo arquivo servir a qualquer agente, não só ao Claude Code.

## Alternativas consideradas

### Manter o `CLAUDE.md`, só enxugado

Resolveria o tamanho e não o resto. Seguiria lido só pelo Claude Code, e, como um `CLAUDE.md` no caminho desliga a leitura nativa do `AGENTS.md`, o nome antigo impede a migração em vez de conviver com ela.

### `AGENTS.md` com um `CLAUDE.md` que só faz `@AGENTS.md`

É o caminho que a documentação do Claude Code sugere para sessões sem leitura nativa (versão anterior à 2.1.277, primeira sessão depois de atualizar, plugin desligado), e o import nunca carrega o arquivo duas vezes. Rejeitada por ora: são dois arquivos na raiz para uma única fonte, e um `CLAUDE.md` de uma linha convida a escrever instrução no lugar errado. Fica como saída de reversão.

### `CLAUDE.md` como symlink para o `AGENTS.md`

Um checkout no Windows sem `core.symlinks` recebe um `CLAUDE.md` de uma linha com o caminho, em vez das instruções, e as ferramentas de edição se recusam a escrever através do link.

### Um `AGENTS.md` aninhado por diretório

`packages/core/AGENTS.md`, `apps/playground/AGENTS.md` e assim por diante. Tem a vantagem de ser lido por outros agentes e de morar ao lado do código. Rejeitada porque a área que mais precisa de nota, a especificação, são arquivos soltos na raiz (`RULES-EN.md`, `AST_SCHEMA.md`, `MESSAGES.md`) e o `golden-files/`, e nenhum arquivo aninhado os cobre. Seriam dois mecanismos em vez de um. Além disso, o Claude Code só carrega um `AGENTS.md` aninhado quando a ferramenta `Read` abre um arquivo do diretório, enquanto a regra por caminho entra também com `Write`, `Edit` e um `cat`.

### Quebrar o arquivo grande com `@imports`

Organiza e não economiza: o arquivo importado entra no início da sessão junto com quem o importa.

### Apagar `gsap-core` e `svg-animations`

Elas não servem à aplicação, que não usa GSAP. Mas foram versionadas de propósito no #7, para que um clone limpo da bancada as traga (`docs/design/RETROSPECTIVA.md`), e a rodada da landing tem itens abertos. Com `paths`, elas ficam para quem trabalha em `docs/design/` e deixam de pesar no resto.

## Consequências

- **O que entra em toda sessão cai de 155 linhas e ~20 KB para 65 linhas e ~5,5 KB.** As quatro regras somam ~8 KB, e cada uma só entra com a sua área.
- As notas de área são do Claude Code. Outro agente que leia o `AGENTS.md` encontra o ponteiro para `.claude/rules/` e precisa abri-las à mão.
- **O que piora:** uma nota só entra quando um arquivo da área é aberto. Uma tarefa que raciocina sobre o parser sem abrir nada em `packages/core/` roda sem ela. E um glob errado faz a regra nunca carregar, em silêncio: nada confere que os `paths` casam com arquivos que existem.
- **Um `CLAUDE.md` ou `CLAUDE.local.md` no caminho desliga o `AGENTS.md`** para quem o tiver, com a configuração padrão (`claude-md-or-agents-md`). O `.gitignore` continua ignorando o `CLAUDE.local.md` e agora diz isso ao lado. Quem precisar de um usa `claude-md-and-agents-md` no `/config`.
- Uma skill com `paths` nem aparece na lista de skills até um arquivo da área ser aberto, o que é a economia buscada e também o preço: um pedido de captura de tela feito antes de qualquer arquivo de `docs/design/` ser aberto não a encontra. Conferido em sessão nova, em 2026-10-24: só `adr` e `health-check` aparecem de início, a regra do core entra ao ler `packages/core/src/lexer.ts`, e a da aplicação fica de fora.
- Hooks `InstructionsLoaded` não disparam para um `AGENTS.md` lido nativamente. Hoje não há nenhum.
- Os ADRs anteriores seguem citando o `CLAUDE.md` como ele era, e a C16 aceita a citação pela lista `RETIRED` do `health_check.py`, só em ADR anterior a este. O `MESSAGES.md` (v0.1.3) e as evidências do `HEALTH.md` passam a apontar para o `AGENTS.md`.

## Reversão

**O sinal de erro** tem duas formas. A primeira é uma sessão que age sem as instruções do projeto: ignora os comandos, pede licença para escrever ADR, não sabe o padrão de branch. O `/memory` mostra se o `AGENTS.md` entrou. A segunda é uma nota de área que é violada repetidamente porque não carregou, em geral por um glob errado ou por uma tarefa que nunca abre arquivo da área.

**O custo da volta** é baixo. Para a primeira forma, basta um `CLAUDE.md` com a linha `@AGENTS.md`. Para a segunda, a nota volta para o `AGENTS.md`, ou o glob é corrigido. Desfazer tudo é recuperar o `CLAUDE.md` do commit `e282c83`.

**O que foi construído em cima:** a entrada `CLAUDE.md` em `RETIRED` na C16, as evidências do `HEALTH.md` §9 que citam o `AGENTS.md` e a `.claude/rules/spec.md`, e as skills `adr` e `health-check`, que apontam para elas.
