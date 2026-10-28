---
name: adr
description: Registra uma decisão de arquitetura, stack ou linguagem num ADR curto em docs/adr/. Use ao escolher stack, biblioteca, estrutura de repositório, formato de dado ou uma mudança na linguagem ODDS; ao substituir uma decisão anterior; e quando pedirem "por que fizemos assim", um ADR, ou o histórico de decisões.
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/new_adr.py *) Bash(npm run check:spec)
---

# Registrar uma decisão em ADR

`docs/adr/` guarda só as decisões de arquitetura, stack ou linguagem que valem hoje (`ADR-0025`). Escreva o ADR sem perguntar e anuncie em uma linha o que registrou.

## 1. Isto merece um ADR?

Só se for **arquitetura, stack ou linguagem** e as três respostas forem sim:

1. **Havia mais de uma saída plausível?** Aplicar o que a `GRAMMAR.md` já manda não é decisão.
2. **Alguém vai reabrir isso?** Ou perguntar daqui a seis meses "por que assim?".
3. **Desfazer custa mais do que refazer?** Um nome se desfaz com um `sed`; uma toolchain, não.

Todo o resto (bug, renomeação, regra nova pelo ciclo fixo de `.claude/rules/spec.md`, processo, ajuste de interface) vai na mensagem de commit.

## 2. Crie o esqueleto

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/new_adr.py "Título afirmativo da decisão"
python3 ${CLAUDE_SKILL_DIR}/scripts/new_adr.py "Título" --supersedes 0003,0007
```

O script aloca um número que o git nunca viu, escreve o frontmatter e reescreve o índice. Com `--supersedes`, ele remove os ADRs substituídos: eles saem da árvore e seguem no git. O ADR nasce `proposed`; passe a `accepted` quando a decisão já vale, no arquivo e no índice.

Título afirmativo e específico: "Parser com Chevrotain, sem camada CST", não "Decisão sobre parser".

## 3. Preencha em uma página

- **Contexto**: o que estava em jogo, no passado, sem antecipar a escolha.
- **Decisão**: uma frase no presente, depois o argumento que venceu as outras saídas.
- **Alternativas consideradas**: uma subseção por alternativa real, com o motivo da rejeição. Vazia, ela afirma que não havia escolha, e aí não é ADR.
- **Consequências**: o que passa a ser verdade, inclusive o que piora.

Cite artefato e seção (`` `RULES-EN.md` §0.4 ``) quando a decisão se apoiar num. Idioma: português.

## 4. Mudou de ideia? ADR novo.

Mudar a decisão é ADR novo com `--supersedes`, e o antigo sai. Uma decisão que simplesmente deixou de valer sai da árvore no mesmo commit que a desfaz. Corrigir o texto de um ADR vigente é edição normal.

## 5. Feche

```bash
npm run check:spec
```

A C16 confere o razão: frontmatter, número batendo com o arquivo e sem repetição, `status` `proposed` ou `accepted`, as três seções, `supersedes` apontando só para ADRs que já saíram, o índice batendo com os arquivos, e toda citação `ARQUIVO.md §N` resolvendo.

Para *o que* mudou na linguagem, o lugar é `CHANGELOG.md`. Para o porquê de um ADR que saiu: `git log --diff-filter=D -- docs/adr/` e `git show`.
