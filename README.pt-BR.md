# ODDS

**Open Domain Driven Specification.** Escreva o design estratégico do Domain-Driven Design como texto. Um linter julga o design, e o playground o desenha como um mapa enquanto você digita.

[**Abrir o playground →**](https://fbadaro.github.io/odds/) · [A linguagem](#a-linguagem-em-um-minuto) · [Especificação](#especificação-primeiro) · [Arquitetura](docs/ARCHITECTURE.md) · [English](README.md)

[![CI](https://github.com/fbadaro/odds/actions/workflows/ci.yml/badge.svg)](https://github.com/fbadaro/odds/actions/workflows/ci.yml)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/odds-dark.svg">
  <img alt="O projeto ODDS desenhado como um mapa ODDS: Validation no subdomínio core, Parsing, Layout e Playground em subdomínios supporting, Messages num generic, com Chevrotain e Base UI como contextos externos" src="docs/odds-light.svg">
</picture>

<sub>Este mapa é o próprio ODDS, escrito em ODDS ([`docs/odds.odds`](docs/odds.odds)) e desenhado pelo seu próprio layout. O `npm run generate:map` o regenera, e um teste falha se a imagem ficar para trás do arquivo.</sub>

## Por que ODDS

**Texto, não desenho.** Um Context Map numa ferramenta de desenho fica velho no dia seguinte ao workshop. Um arquivo `.odds` mora ao lado do código, aparece no diff e é revisado no pull request.

**Um linter opinativo.** O ODDS não se limita a conferir se o arquivo está bem formado: ele julga o design. Os 35 códigos de diagnóstico vêm em três severidades:

- `error`: o modelo é incoerente.
- `warning`: o design é arriscado.
- `info`: higiene da documentação.

```odds
// Checkout mora num subdomínio core, PaymentGateway num generic
mapping {
  Checkout [CF] <-- PaymentGateway
}
```

```text
warning CONFORMIST_CORE      Risco estratégico: o contexto de Core Domain `Checkout` está se
                             conformando ao modelo de outro sistema. Considere um `[ACL]` para
                             proteger sua vantagem competitiva.
warning GENERIC_WITHOUT_OHS  `PaymentGateway` está Upstream e pertence ao subdomínio genérico
                             `Payments`, mas não expõe nenhum `[OHS]`. Soluções genéricas deveriam
                             fornecer serviços bem definidos; sem um, o acoplamento fica escondido.
```

**Discordar fica registrado.** Uma decisão consciente contra uma regra é arquitetura que vale guardar. Por isso a supressão mora no arquivo, nomeia um código e exige justificativa. Ela nunca alcança um `error`.

```odds
// odds-disable-next-line CONFORMIST_CORE: ERP corporativo, decisão de negócio, custo aceito
Checkout [CF] <-- CorporateERP
```

**O mapa nunca some.** Todo arquivo pela metade é um erro de sintaxe, então nenhuma severidade bloqueia o mapa: uma relação inválida aparece como linha tracejada vermelha. Só um arquivo sem árvore nenhuma congela o último mapa bom, e esse mapa fica marcado como obsoleto.

**Sem servidor.** O parse, a validação e o desenho rodam no navegador, e o arquivo não sai dele.

| | [Context Mapper](https://contextmapper.org/) | ODDS |
|---|---|---|
| Roda em | Xtext/Java, um plugin de IDE ou o Gitpod | O navegador, sem instalar nada |
| Opinião | Notação neutra | Um catálogo de boas práticas de DDD que julga o design |
| Retorno | Geração de modelo | Diagnósticos enquanto se digita, cada um ligado à sua linha e ao elemento no mapa |

## A linguagem em um minuto

```odds
domain ECommerce {
  subdomain core Sales {
    description: "Transformar intenção de compra em pedido pago"
    context Checkout
  }
  subdomain generic Payments {
    context PaymentGateway { maturity: mature  team: "Payments Squad" }
  }
  external {
    context Stripe
  }
  mapping {
    Checkout       [ACL] <-- [OHS, PL] PaymentGateway
    PaymentGateway [ACL] <--           Stripe
  }
}
```

Um arquivo tem um `domain`. Dentro dele vêm os `subdomain`s, do tipo `core`, `supporting` ou `generic`, cada um com seus Bounded Contexts. Depois deles vem um bloco `external` para terceiros e, por último, o `mapping`. Propriedades como `team` e `maturity` são documentação, e nenhuma regra as lê. As tags são os contratos que o linter valida.

| Conector | Relação entre times |
|---|---|
| `A --> B` | A é upstream, B downstream |
| `A <-- B` | A é downstream, B upstream |
| `A <-> B` | Mutuamente dependentes |
| `A -x- B` | Caminhos separados: a decisão deliberada de não integrar |

| Tag | Padrão | Onde vai |
|---|---|---|
| `OHS` · `PL` · `S` | Open-Host Service · Published Language · Supplier | Lado upstream de `-->` / `<--` |
| `ACL` · `CF` · `C` | Anti-Corruption Layer · Conformist · Customer | Lado downstream de `-->` / `<--` |
| `SK` · `P` | Shared Kernel · Partnership | Os dois lados de `<->` |
| `BBM` | Big Ball of Mud, que descreve o sistema e não o contrato | Qualquer conector, qualquer lado |

A gramática está em [`GRAMMAR.md`](GRAMMAR.md). Cada regra, com a razão de existir, está em [`RULES-PT.md`](RULES-PT.md).

## O playground

- **Duas vistas do mesmo mapa.**
  - A **vista de fluxo** responde *"como isto se integra?"*, com linhas e tags.
  - A **vista de contenção** responde *"como isto está organizado?"*, com territórios e sem linhas.

  Trocar de vista não move nenhuma peça.
- **Navegação.** Selecionar um contexto acende as relações dele, selecionar um território foca o subdomínio, e selecionar uma linha isola uma relação. O inspetor mostra o que o arquivo declara sobre a seleção e os diagnósticos que a envolvem.
- **Painel de diagnósticos.** Ele conta e filtra por severidade. Clicar num diagnóstico leva à linha e ao elemento no mapa.
- **Export.** O mapa sai como SVG com os marcadores de erro, porque um export sem eles documentaria um modelo que nunca foi válido.
- **Idioma.** A interface está em português do Brasil por enquanto (ADR-0024). O catálogo de diagnósticos já existe em português e inglês.

**Ainda não tem:**
- [compartilhar o design por URL](https://github.com/fbadaro/odds/issues/10);
- [auto-save](https://github.com/fbadaro/odds/issues/11);
- [funcionar offline](https://github.com/fbadaro/odds/issues/13);
- [a peça fantasma da referência que não resolve](https://github.com/fbadaro/odds/issues/12).

## Especificação primeiro

A especificação veio antes do código e é normativa: quando os dois discordam, ou o código está errado, ou a discordância é um achado.

| Pergunta | Fonte |
|---|---|
| O que um `.odds` significa | [`RULES-PT.md`](RULES-PT.md), tradução de [`RULES-EN.md`](RULES-EN.md) |
| A sintaxe | [`GRAMMAR.md`](GRAMMAR.md) |
| A AST, e cada código de diagnóstico com fase e dados | [`AST_SCHEMA.md`](AST_SCHEMA.md) |
| O texto das mensagens, em português e inglês | [`MESSAGES.md`](MESSAGES.md) |
| A saída esperada | [`TEST_SUITE.md`](TEST_SUITE.md) e os 44 [`golden-files/`](golden-files/) |
| Os requisitos do produto | [`PRD.md`](PRD.md) |
| O sistema visual | [`DESIGN.md`](DESIGN.md) |
| As palavras do projeto | [`GLOSSARY.md`](GLOSSARY.md) |
| O que mudou na linguagem | [`CHANGELOG.md`](CHANGELOG.md), a ODDS Language Version |
| Por que as coisas são como são | [`docs/adr/`](docs/adr/) |

O `npm run check:spec` mantém os documentos coerentes entre si. Entre as checks dele, a C17 exige subir a versão sempre que um passe muda o que um `.odds` significa.

## Desenvolvimento

```bash
npm install          # Node 22.12+; npm workspaces
npm run dev          # o playground, no Vite
npm test             # todos os pacotes e o app, golden files incluídos
npm run typecheck
npm run lint         # o app
npm run check:spec   # as checagens mecânicas da especificação (Python 3, stdlib)
```

| Caminho | É dono de |
|---|---|
| [`packages/core`](packages/core) | Lexer, parser, AST e validador. Não conhece texto de mensagem nem locale. |
| [`packages/messages`](packages/messages) | Recebe `Diagnostic` e locale e devolve a frase, gerada do `MESSAGES.md` |
| [`packages/layout`](packages/layout) | Geometria da colmeia e SVG, sem DOM |
| [`apps/playground`](apps/playground) | O produto: React 19, Zustand, Base UI, Vite |
| [`golden-files/`](golden-files/) | A suíte executável da especificação |

O [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) tem o pipeline, as fronteiras entre pacotes e como o mapa degrada. O [`AGENTS.md`](AGENTS.md) tem as convenções de trabalho:
- issues são escritas em português;
- uma branch se chama `feature/XXXX-nome`, pela issue;
- commits seguem Conventional Commits, em inglês.

## Licença

Nenhuma licença foi escolhida ainda. Até um arquivo `LICENSE` entrar, vale o copyright padrão.
