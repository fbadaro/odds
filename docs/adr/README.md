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
