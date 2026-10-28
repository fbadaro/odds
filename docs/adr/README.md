# Decisões de arquitetura (ADRs)

Uma decisão de arquitetura, stack ou linguagem mora aqui, um arquivo por decisão, numerado (`ADR-0025`). O resto vai na mensagem de commit.

**Aqui fica só o que vale hoje.** Um ADR substituído ou encerrado sai da árvore e segue no histórico do git, e a numeração guarda o buraco: `git log --diff-filter=D --name-only -- docs/adr/` lista os que saíram. Corrigir o texto de um ADR vigente é edição; mudar a decisão é ADR novo, com `supersedes`.

## Como escrever um

```bash
python3 .claude/skills/adr/scripts/new_adr.py "Título afirmativo da decisão"
python3 .claude/skills/adr/scripts/new_adr.py "Título" --supersedes 0003,0007
```

O script aloca o próximo número sem reusar nenhum que o git já viu, escreve o esqueleto, remove os substituídos e reescreve o índice abaixo. A skill `adr` diz quando um ADR é devido, e `npm run check:spec` (C16) confere o razão.

## Índice

| ADR | Título | Status | Data |
|---|---|---|---|
| [ADR-0002](0002-chevrotain-como-toolkit-de-parser.md) | Chevrotain como toolkit de parser | accepted | 2026-09-05 |
| [ADR-0003](0003-o-odds-e-fonte-unica-o-diagrama-nunca-escreve-de-volta-no-texto.md) | O `.odds` é fonte única: o diagrama nunca escreve de volta no texto | accepted | 2026-09-05 |
| [ADR-0004](0004-monorepo-em-packages-com-o-catalogo-de-mensagens-em-pacote-proprio.md) | Monorepo em packages/, com o catálogo de mensagens em pacote próprio | accepted | 2026-09-05 |
| [ADR-0005](0005-npm-workspaces-typescript-e-vitest-como-ambiente-de-desenvolvimento.md) | npm workspaces, TypeScript e Vitest como ambiente de desenvolvimento | accepted | 2026-09-05 |
| [ADR-0006](0006-recuperacao-da-5-1-codificada-na-gramatica-com-embeddedactionsparser-e-sem-camada-cst.md) | Recuperação da §5.1 codificada na gramática, com EmbeddedActionsParser e sem camada CST | accepted | 2026-09-05 |
| [ADR-0008](0008-um-subdomain-declara-description-e-owner-e-nada-alem-disso.md) | Um subdomain declara description e owner, e nada além disso | accepted | 2026-09-12 |
| [ADR-0009](0009-o-layout-do-diagrama-e-codigo-proprio-num-pacote-odds-layout-com-saida-svg-e-bibliotecas-so-nas-bordas.md) | O layout do diagrama é código próprio num pacote @odds/layout, com saída SVG e bibliotecas só nas bordas | accepted | 2026-09-28 |
| [ADR-0010](0010-a-localidade-do-layout-vem-de-degraus-de-capacidade-arranjo-fixo-e-territorios-que-se-resolvem-sozinhos.md) | A localidade do layout vem de degraus de capacidade, arranjo fixo e territórios que se resolvem sozinhos | accepted | 2026-10-06 |
| [ADR-0011](0011-a-colmeia-e-a-vista-principal-e-fluxo-e-contencao-sao-dois-modos-da-mesma-geografia.md) | A colmeia é a vista principal, e fluxo e contenção são dois modos da mesma geografia | accepted | 2026-10-07 |
| [ADR-0012](0012-na-vista-de-fluxo-a-relacao-acesa-corre-em-tracejado-e-a-invalida-fica-em-tracejado-vermelho-parado.md) | Na vista de fluxo, a relação acesa corre em tracejado e a inválida fica em tracejado vermelho parado | accepted | 2026-10-09 |
| [ADR-0013](0013-o-design-md-e-a-fonte-unica-do-sistema-visual-em-ingles-com-tokens-em-front-matter-yaml-no-formato-design-md.md) | O DESIGN.md é a fonte única do sistema visual, em inglês, com tokens em front matter YAML no formato design.md | accepted | 2026-10-17 |
| [ADR-0014](0014-react-no-chrome-da-aplicacao-com-base-ui-para-o-comportamento-dos-componentes-padrao-e-css-modules-sobre-os-tokens-do-design-md.md) | React no chrome da aplicação, com Base UI para o comportamento dos componentes padrão e CSS Modules sobre os tokens do DESIGN.md | accepted | 2026-10-20 |
| [ADR-0015](0015-vite-como-bundler-da-aplicacao.md) | Vite como bundler da aplicação | accepted | 2026-10-20 |
| [ADR-0016](0016-a-aplicacao-mora-em-apps-playground-e-packages-guarda-so-bibliotecas.md) | A aplicação mora em apps/playground, e packages/ guarda só bibliotecas | accepted | 2026-10-22 |
| [ADR-0018](0018-os-tokens-da-aplicacao-sao-gerados-do-front-matter-do-design-md-com-sombras-e-gradiente-num-grupo-elevation.md) | Os tokens da aplicação são gerados do front matter do DESIGN.md, com sombras e gradiente num grupo elevation | accepted | 2026-10-22 |
| [ADR-0019](0019-zustand-para-o-estado-de-interface-react-compiler-para-a-memoizacao-e-eslint-na-aplicacao.md) | Zustand para o estado de interface, React Compiler para a memoização e ESLint na aplicação | accepted | 2026-10-22 |
| [ADR-0022](0022-as-instrucoes-de-agente-moram-num-agents-md-enxuto-com-regras-por-caminho-em-claude-rules.md) | As instruções de agente moram num AGENTS.md enxuto, com regras por caminho em .claude/rules/ | accepted | 2026-10-24 |
| [ADR-0024](0024-a-interface-sai-em-portugues-no-mvp-e-o-ingles-entra-depois-como-seletor.md) | A interface sai em português no MVP, e o inglês entra depois como seletor | accepted | 2026-10-24 |
| [ADR-0025](0025-a-interface-e-feita-direto-na-aplicacao-e-um-passe-fecha-com-testes-verdes-e-adr-so-para-arquitetura-stack-ou-linguagem.md) | A interface é feita direto na aplicação, e um passe fecha com testes verdes e ADR só para arquitetura, stack ou linguagem | accepted | 2026-10-27 |
