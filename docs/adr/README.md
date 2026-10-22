# Decisões de arquitetura (ADRs)

Toda decisão tomada deste ponto em diante mora aqui, uma por arquivo, numerada e imutável.

**Por que ADR e não mais uma seção num documento existente.** O `GRILLING.md` guarda o *porquê* de D1–D25 e o `PROPAGATION-MAP.md` guarda o *onde* — mas os dois são registros **fechados**, de uma sessão que terminou. Uma decisão tomada hoje não tinha onde morar, e é isso que a rubrica do `HEALTH.md` §9.1 desconta em **R3.6**. `D1–D25` é um conjunto fechado: decisão nova vem para cá, nunca para aquela tabela.

## Como ler

| Campo | O que significa |
|---|---|
| `status: proposed` | Escrito, ainda não vigente. Alguém precisa aceitar |
| `status: accepted` | Vigente. É assim que o projeto se comporta hoje |
| `status: superseded` | Substituído por um ADR posterior. `superseded-by` aponta para ele |
| `status: deprecated` | Não vale mais e nada tomou o lugar — a prática simplesmente saiu |
| `status: reverted` | Foi tentado e desfeito. `superseded-by` aponta para o ADR que desfez |

**Um ADR nunca é editado para mudar de ideia, e nunca é apagado.** Ele é substituído por outro, e o par fica ligado nos dois sentidos (`supersedes` / `superseded-by`) — a checagem C16 do `health_check.py` falha se um lado do par existir sem o outro. Corrigir uma vírgula é edição; mudar a decisão é ADR novo. A diferença importa porque a numeração é a linha do tempo: apagar um número apagaria o fato de que aquilo foi decidido um dia.

Correção de texto no ADR vigente, sim. Reescrita do que foi decidido, não.

## Como escrever um

```bash
python3 .claude/skills/adr/scripts/new_adr.py "Título no infinitivo ou afirmativo"
```

O script aloca o próximo número, escreve o esqueleto a partir de `.claude/skills/adr/templates/adr.md` e acrescenta a linha nesta tabela. O que ele **não** faz é pensar: as cinco seções vêm em branco de propósito, e um ADR com a seção *Alternativas consideradas* vazia é pior do que ADR nenhum — afirma que não havia escolha.

A skill `adr` governa o resto: quando um ADR é devido, quando não é, e como fechá-lo.

## Índice

| ADR | Título | Status | Data |
|---|---|---|---|
| [ADR-0001](0001-decisoes-passam-a-ser-registradas-em-adrs-numerados-e-mecanicamente-conferidos.md) | Decisões passam a ser registradas em ADRs numerados e mecanicamente conferidos | accepted | 2026-09-05 |
| [ADR-0002](0002-chevrotain-como-toolkit-de-parser.md) | Chevrotain como toolkit de parser | accepted | 2026-09-05 |
| [ADR-0003](0003-o-odds-e-fonte-unica-o-diagrama-nunca-escreve-de-volta-no-texto.md) | O `.odds` é fonte única: o diagrama nunca escreve de volta no texto | accepted | 2026-09-05 |
| [ADR-0004](0004-monorepo-em-packages-com-o-catalogo-de-mensagens-em-pacote-proprio.md) | Monorepo em packages/, com o catálogo de mensagens em pacote próprio | accepted | 2026-09-05 |
| [ADR-0005](0005-npm-workspaces-typescript-e-vitest-como-ambiente-de-desenvolvimento.md) | npm workspaces, TypeScript e Vitest como ambiente de desenvolvimento | accepted | 2026-09-05 |
| [ADR-0006](0006-recuperacao-da-5-1-codificada-na-gramatica-com-embeddedactionsparser-e-sem-camada-cst.md) | Recuperação da §5.1 codificada na gramática, com EmbeddedActionsParser e sem camada CST | accepted | 2026-09-05 |
| [ADR-0007](0007-a-ui-ux-do-playground-e-explorada-em-mocks-descartaveis-antes-de-escolher-framework-e-biblioteca-de-render.md) | A UI/UX do playground é explorada em mocks descartáveis antes de escolher framework e biblioteca de render | accepted | 2026-09-07 |
| [ADR-0008](0008-um-subdomain-declara-description-e-owner-e-nada-alem-disso.md) | Um subdomain declara description e owner, e nada além disso | accepted | 2026-09-12 |
| [ADR-0009](0009-o-layout-do-diagrama-e-codigo-proprio-num-pacote-odds-layout-com-saida-svg-e-bibliotecas-so-nas-bordas.md) | O layout do diagrama é código próprio num pacote @odds/layout, com saída SVG e bibliotecas só nas bordas | accepted | 2026-09-28 |
| [ADR-0010](0010-a-localidade-do-layout-vem-de-degraus-de-capacidade-arranjo-fixo-e-territorios-que-se-resolvem-sozinhos.md) | A localidade do layout vem de degraus de capacidade, arranjo fixo e territórios que se resolvem sozinhos | accepted | 2026-10-06 |
| [ADR-0011](0011-a-colmeia-e-a-vista-principal-e-fluxo-e-contencao-sao-dois-modos-da-mesma-geografia.md) | A colmeia é a vista principal, e fluxo e contenção são dois modos da mesma geografia | accepted | 2026-10-07 |
| [ADR-0012](0012-na-vista-de-fluxo-a-relacao-acesa-corre-em-tracejado-e-a-invalida-fica-em-tracejado-vermelho-parado.md) | Na vista de fluxo, a relação acesa corre em tracejado e a inválida fica em tracejado vermelho parado | accepted | 2026-10-09 |
| [ADR-0013](0013-o-design-md-e-a-fonte-unica-do-sistema-visual-em-ingles-com-tokens-em-front-matter-yaml-no-formato-design-md.md) | O DESIGN.md é a fonte única do sistema visual, em inglês, com tokens em front matter YAML no formato design.md | accepted | 2026-10-17 |
| [ADR-0014](0014-react-no-chrome-da-aplicacao-com-base-ui-para-o-comportamento-dos-componentes-padrao-e-css-modules-sobre-os-tokens-do-design-md.md) | React no chrome da aplicação, com Base UI para o comportamento dos componentes padrão e CSS Modules sobre os tokens do DESIGN.md | accepted | 2026-10-20 |
| [ADR-0015](0015-vite-como-bundler-da-aplicacao.md) | Vite como bundler da aplicação | accepted | 2026-10-20 |
| [ADR-0016](0016-a-aplicacao-mora-em-apps-playground-e-packages-guarda-so-bibliotecas.md) | A aplicação mora em apps/playground, e packages/ guarda só bibliotecas | accepted | 2026-10-22 |
| [ADR-0017](0017-a-bancada-experimenta-e-a-aplicacao-implementa-so-ideia-validada.md) | A bancada experimenta e a aplicação implementa só ideia validada | accepted | 2026-10-22 |
| [ADR-0018](0018-os-tokens-da-aplicacao-sao-gerados-do-front-matter-do-design-md-com-sombras-e-gradiente-num-grupo-elevation.md) | Os tokens da aplicação são gerados do front matter do DESIGN.md, com sombras e gradiente num grupo elevation | accepted | 2026-10-22 |
| [ADR-0019](0019-zustand-para-o-estado-de-interface-react-compiler-para-a-memoizacao-e-eslint-na-aplicacao.md) | Zustand para o estado de interface, React Compiler para a memoização e ESLint na aplicação | accepted | 2026-10-22 |
| [ADR-0020](0020-a-paridade-entre-bancada-e-aplicacao-e-um-contrato-data-feature-na-bancada-teste-de-paridade-na-aplicacao.md) | A paridade entre bancada e aplicação é um contrato: data-feature na bancada, teste de paridade na aplicação | accepted | 2026-10-22 |
