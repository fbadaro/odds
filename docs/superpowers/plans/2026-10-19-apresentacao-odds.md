# Apresentação do ODDS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma apresentação em HTML único (slides em tela cheia, GSAP + SVG), em duas versões (30 e 60 min), mais o recorte de Pagamentos do BIAN carregável no `playground.html` para a demo.

**Architecture:** `docs/design/pages/apresentacao.html` é uma página-fragmento como as vizinhas (sem doctype; abre direto do disco e passa no `page-shot`). Os slides são `<section class="slide">` com `data-*` de roteiro; um motor pequeno no fim da página filtra a versão, navega pelo teclado e roda a timeline GSAP de entrada de cada slide. O GSAP é embutido por um bloco gerado (`<!--GSAP-->`) pelo mesmo `stamp()` de `colmeia-embed.mjs`; um script de checagem em Node garante os invariantes do roteiro sem DOM. O playground ganha um terceiro modelo, `pagamentos.odds`, embutido pelo `playground.build.mjs`, que falha se o arquivo não validar limpo.

**Tech Stack:** HTML/CSS/JS clássico inline, GSAP 3.12.5 (mesma versão das outras páginas), SVG inline, Node ≥ 20 para build e checagem, `@odds/core` compilado, `page-shot` para olhar.

**Spec:** `docs/superpowers/specs/2026-10-19-apresentacao-odds-design.md`

## Global Constraints

- Português do Brasil em todo texto visível e nas notas.
- Sistema visual do `DESIGN.md` da raiz (ADR-0013), lido antes de escrever CSS: Montserrat **só** em display, Inter no texto, JetBrains Mono no código `.odds`, roxo como acento, cores como tokens RGB em `:root`. Tema claro.
- O gradiente roxo → azul (expressão de herói) aparece **só** nos slides `capa` e `decisao`.
- Sem rede na sala: nenhum `<script src=…>`; só o `<link>` do Google Fonts, com pilha de fallback do sistema.
- Tudo o que é visão (declarado × descoberto, fluxo com a plataforma) leva o selo visível **"Visão"** (`.selo-visao`).
- Nunca afirmar como existente: link de compartilhamento, mapeamento a partir de repositórios, integração com a plataforma.
- Nomes genéricos: nada que imite marca ou nome da empresa ou da plataforma interna ("plataforma interna").
- Blocos gerados (`<!--GSAP-->`, `<!--CORE-->`, `<!--M50-->`, `<!--PAG-->`…) nunca são editados à mão.
- `prefers-reduced-motion: reduce` mostra o estado final de cada slide, sem animar.
- Pergunta-âncora, texto exato: **"Em que domínio e contexto este serviço está, e o que ele resolve?"**

## Review Focus

1. **Voltar da aba do playground** — a apresentação continua no mesmo slide e as setas funcionam na primeira tecla, mesmo com o foco no link de demo. Teste na Task 2 (passo 6).
2. **Projetor de resolução desconhecida** (1280×720, 1920×1080, 1024×768) — nenhum slide transborda nem corta texto. Teste na Task 6 (passo 2).
3. **Teclas rápidas no meio de uma animação** — o slide final é o da última tecla e nenhuma timeline anterior continua rodando. Teste na Task 2 (passo 6).
4. **Parâmetro desconhecido** — `?v=45` cai na versão de 30; `playground.html?modelo=xyz` abre o marketplace. Testes nas Tasks 1 (passo 7) e 2 (passo 6).
5. **Sala sem internet** — a página funciona com o GSAP embutido e as fontes do sistema. Teste na Task 2 (`apresentacao.check.mjs` rejeita `<script src`).

---

### Task 1: Recorte de Pagamentos no playground

**Files:**
- Create: `docs/design/pages/pagamentos.odds`
- Modify: `docs/design/pages/playground.build.mjs`
- Modify: `docs/design/pages/playground.html` — marcador `<!--PAG--><!--/PAG-->` logo depois do bloco `<!--/M50-->` (~linha 4433); menu `#fileMenu` (~linha 670); `MODELS` (~linha 4454); a chamada final `loadModel("m50")` (~linha 5406)

**Interfaces:**
- Produces: `globalThis.__PAG = { file: "pagamentos.odds", text: string }`; `MODELS.pag`; a URL `playground.html?modelo=pagamentos`, que a Task 4 usa no link de demo.

- [ ] **Step 1: Criar `docs/design/pages/pagamentos.odds` com este texto exato** (já conferido contra o core: zero diagnósticos)

```
domain Payments {
  title: "Pagamentos — recorte do BIAN 12"

  subdomain core Initiation {
    title: "Iniciação de pagamento"
    description: "Receber a intenção de pagar e transformá-la numa ordem"
    context PaymentInitiation {
      description: "BIAN Payment Initiation: captura e valida o pedido de pagamento do cliente"
    }
    context PaymentOrder {
      description: "BIAN Payment Order: a ordem de pagamento, do aceite à entrega para execução"
    }
  }

  subdomain core Fraud {
    title: "Fraude"
    description: "Decidir, antes de o dinheiro sair, se o pagamento é legítimo"
    context FraudEvaluation {
      description: "BIAN Fraud Evaluation: o veredito de risco de cada transação"
    }
    context FraudDiagnosis {
      description: "BIAN Fraud Diagnosis: a investigação dos casos suspeitos"
    }
  }

  subdomain supporting Settlement {
    title: "Liquidação"
    description: "Fazer o dinheiro chegar ao destino pelos trilhos certos"
    context PaymentExecution {
      description: "BIAN Payment Execution: executa a ordem e escolhe o trilho"
    }
    context PaymentRailOperations {
      description: "BIAN Payment Rail Operations: a operação dos trilhos de pagamento"
    }
    context ACHOperations {
      description: "BIAN ACH Operations: a compensação em lote"
    }
  }

  subdomain supporting PositionAndAccounts {
    title: "Posição e contas"
    description: "Saber quanto cada conta tem, a cada lançamento"
    context PositionKeeping {
      description: "BIAN Position Keeping: o registro das posições e lançamentos"
    }
    context CurrentAccount {
      description: "BIAN Current Account: a conta corrente do cliente"
    }
  }

  subdomain generic Authentication {
    title: "Autenticação"
    description: "Provar quem está pedindo"
    context PartyAuthentication {
      description: "BIAN Party Authentication: autentica a parte que inicia o pagamento"
    }
  }

  external {
    context SPI {
      title: "SPI (Pix)"
      description: "Sistema de Pagamentos Instantâneos do Banco Central"
    }
    context CardNetwork {
      title: "Bandeira de cartão"
      description: "A rede da bandeira, com as regras dela"
    }
  }

  mapping {
    PartyAuthentication [OHS, PL] -->      PaymentInitiation
    PaymentInitiation   [S]       --> [C]  PaymentOrder
    FraudEvaluation     [OHS]     --> [ACL] PaymentOrder
    FraudEvaluation     [S]       --> [C]  FraudDiagnosis
    PaymentOrder        [S]       --> [C]  PaymentExecution
    PaymentRailOperations [OHS]   --> [ACL] PaymentExecution
    PaymentExecution    [S]       --> [C]  ACHOperations
    PaymentExecution    [OHS]     -->      PositionKeeping
    PositionKeeping     [SK]      <-> [SK] CurrentAccount
    SPI                 [OHS, PL] --> [ACL] PaymentRailOperations
    CardNetwork         [OHS, PL] --> [CF] PaymentRailOperations
    ACHOperations       -x-                CardNetwork
  }
}
```

- [ ] **Step 2: Rodar o build antes do marcador e ver que ele não sabe do PAG ainda**

Run: `node docs/design/pages/playground.build.mjs`
Expected: `playground.html: ok · build 38bcbaf11836` (estado de partida).

- [ ] **Step 3: Estender `playground.build.mjs`**

Depois de `await embedBlocks()`, ler `pagamentos.odds`, rodar `parseAndValidate` do `packages/core/dist/index.js` e lançar `Error("pagamentos.odds deveria validar limpo: <códigos>")` se houver qualquer diagnóstico. Acrescentar `blocks.PAG = '<script>globalThis.__PAG = ' + JSON.stringify({ file: "pagamentos.odds", text }) + ';</script>'` e passar a `stamp()`. Não tocar em `colmeia-embed.mjs`: o `colmeia-ao-vivo` usa os mesmos blocos e tem de continuar `38bcbaf11836`. Atualizar o comentário do topo para incluir o recorte.

- [ ] **Step 4: Inserir o marcador vazio `<!--PAG--><!--/PAG-->` e rodar com `--write`**

Run: `node docs/design/pages/playground.build.mjs --write && node docs/design/pages/playground.build.mjs && node docs/design/pages/colmeia-ao-vivo.build.mjs`
Expected: `gravado`, depois `playground.html: ok · build <hash novo>`, depois `colmeia-ao-vivo.html: ok · build 38bcbaf11836`.

- [ ] **Step 5: Ligar o modelo na página**

- `MODELS.pag = { file: globalThis.__PAG.file, text: globalThis.__PAG.text }`.
- Item do menu, entre `vendas.odds` e o separador: `<button class="ibtn" role="menuitemradio" data-model="pag" aria-checked="false">pagamentos.odds <small>12 contextos</small></button>`.
- Trocar o `loadModel("m50")` final por `loadModel(new URLSearchParams(location.search).get("modelo") === "pagamentos" ? "pag" : "m50")`.

- [ ] **Step 6: Teste negativo do build** — trocar no arquivo `--> [ACL] PaymentOrder` por `--> [CF] PaymentOrder`, rodar `node docs/design/pages/playground.build.mjs`, esperar o erro `pagamentos.odds deveria validar limpo: CONFORMIST_CORE`; desfazer com `git checkout docs/design/pages/pagamentos.odds` e rodar de novo (esperar `ok`).

- [ ] **Step 7: Conferir o parâmetro abrindo o arquivo cru, como na sala**

Abrir no Chrome headless `file://$PWD/docs/design/pages/playground.html?modelo=pagamentos` com `--dump-dom` (mesmo padrão de background + kill do `shot.sh`).
Expected: o DOM contém `data-model="pag" aria-checked="true"` e `pagamentos.odds` em `#fileName`, e o rodapé diz `nenhum diagnóstico`. Repetir com `?modelo=xyz`: esperar `data-model="m50" aria-checked="true"`. Capturar a primeira em PNG e olhar: o recorte cabe na tela, com os cinco subdomínios e o bloco externo.

- [ ] **Step 8: Commit**

```bash
git add docs/design/pages/pagamentos.odds docs/design/pages/playground.build.mjs docs/design/pages/playground.html
git commit -m "design: playground loads the BIAN payments slice (?modelo=pagamentos)"
```

---

### Task 2: Motor da apresentação, GSAP embutido e checagem do roteiro

**Files:**
- Modify: `package.json` / `package-lock.json` (`gsap@3.12.5` exato em `devDependencies`)
- Create: `docs/adr/00NN-…md` via skill `adr` (alocador `new_adr.py`)
- Create: `docs/design/pages/apresentacao.html`
- Create: `docs/design/pages/apresentacao.check.mjs`

**Interfaces:**
- Consumes: `stamp(pagePath, { blocks, modules }, write)` de `colmeia-embed.mjs`.
- Produces:
  - marcação de slide: `<section class="slide" data-id="<id>" data-min="<n>" [data-min60="<n>"] [data-only="60"] [data-apendice]>` contendo `<aside class="notes">…</aside>`;
  - `globalThis.__deck = { go(id: string, opts?: { instant?: boolean }): void, next(): void, prev(): void, setVersion(v: 30 | 60): void, get version(): 30 | 60, get ids(): string[] }`;
  - o `<main class="deck">` reflete o slide atual em `data-current="<id>"`;
  - `ENTER: Record<string, (slide: HTMLElement) => gsap.core.Timeline>`, o registro onde as Tasks 3–5 penduram as animações (slide sem entrada = só fade).

- [ ] **Step 1: Instalar o GSAP e registrar a decisão**

Run: `npm install --save-dev --save-exact gsap@3.12.5`. Depois invocar a skill `adr`: a apresentação embute o GSAP no HTML (a sala pode não ter rede) e o GSAP vira devDependency fixa, na mesma versão do CDN das outras páginas. Alternativas: CDN (como as vizinhas), um arquivo vendorizado no repositório, baixar no build. Reversão: voltar ao `<script src>` do CDN e remover a dependência.

- [ ] **Step 2: Escrever `apresentacao.check.mjs` primeiro** — confere e, com `--write`, regrava o bloco GSAP:

- bloco `GSAP` = `<script>` + `node_modules/gsap/dist/gsap.min.js` + `</script>`, via `stamp()` (sem `--write`, sai com 1 se envelheceu); falhar se o conteúdo tiver `</script`;
- nenhum `<script src=`;
- `data-id` únicos; toda `.slide` tem `<aside class="notes">` não vazia;
- sequência exata (slides com `data-apendice` ficam fora das duas):
  - `V30 = ["capa","pergunta","dor-espacos","dor-custo","odds-texto-mapa","odds-contratos","demo-ida","demo-volta","encaixe-camadas","encaixe-visao","estado","decisao"]`
  - `V60 = ["capa","pergunta","dor-espacos","dor-custo","odds-texto-mapa","odds-contratos","bian-catalogo","bian-correspondencia","demo-ida","demo-volta","encaixe-camadas","encaixe-visao","encaixe-fluxo","estado","decisao"]`
- soma de minutos: na V30, `data-min` soma **30**; na V60, `data-min60 ?? data-min` soma **60**;
- `encaixe-visao` e `encaixe-fluxo` contêm `class="selo-visao"`;
- existe `href="playground.html?modelo=pagamentos"` com `target="_blank"`;
- o texto da pergunta-âncora aparece em `pergunta`.

Minutos por slide:

| id | `data-min` | `data-min60` |
|---|---|---|
| capa, demo-volta | 0 | — |
| pergunta, dor-espacos, dor-custo, odds-texto-mapa, odds-contratos, encaixe-camadas, estado | 2 | — |
| encaixe-visao, decisao | 3 | decisao: 13 (3 + 10 de discussão) |
| demo-ida | 10 | 20 |
| bian-catalogo (`data-only="60"`) | 3 | — |
| bian-correspondencia (`data-only="60"`) | 2 | — |
| encaixe-fluxo (`data-only="60"`) | 5 | — |
| apendice-alternativas (`data-apendice`) | 0 | — |

- [ ] **Step 3: Rodar a checagem sem a página** — `node docs/design/pages/apresentacao.check.mjs`. Expected: falha (página ausente).

- [ ] **Step 4: Criar `apresentacao.html`** — fragmento no padrão do `playground.html` (`<title>Apresentação ODDS</title>`, `<!--BUILD:-->`, viewport, Google Fonts com Montserrat 600/700, Inter 400/500/600 e JetBrains Mono 400/500), `<style>` com os tokens do `DESIGN.md`, os 16 slides como **esboço** (título, uma linha e notas, com os `data-*` da tabela; o esboço já satisfaz toda a checagem: pergunta-âncora em `pergunta`, link em `demo-ida`, `.selo-visao` nos dois slides de visão), o marcador `<!--GSAP--><!--/GSAP-->` e o script do motor:

- **versão:** `?v=60` → 60; qualquer outro valor ou ausência → 30. Filtra `data-only`, exclui `data-apendice`. `setVersion` mantém o slide atual se ele existe na nova versão; senão vai para `capa`. `go` para um id fora da versão é ignorado;
- **teclado:** listener em `document`: → / espaço / PageDown avançam; ← / PageUp voltam; Home/End; `F` alterna tela cheia (`requestFullscreen`, falha silenciosa); `N` alterna as notas; `A` vai e volta do apêndice; contador `n / total` discreto;
- **troca de slide:** `go()` mata a timeline em curso (`tl.progress(1).kill()`) antes de iniciar a próxima; `opts.instant` ou `prefers-reduced-motion` → `progress(1)` imediato;
- **escala:** cada slide é um palco de 1600×900, escalado por `transform` para caber na janela, com letterbox no fundo, para que o desenho não dependa da resolução do projetor;
- `location.hash = id` a cada troca, e o hash é lido na carga, para que um F5 não perca a posição.

- [ ] **Step 5: `node docs/design/pages/apresentacao.check.mjs --write && node docs/design/pages/apresentacao.check.mjs`**. Expected: `apresentacao.html: ok · build <hash>`.

- [ ] **Step 6: Testes de comportamento com `page-shot`** (cada um com `--expect`):
  - `--js "__deck.setVersion(60);__deck.go('bian-catalogo',{instant:true})"` → `data-current="bian-catalogo"`;
  - `--js "__deck.setVersion(30);__deck.go('bian-catalogo')"` → `data-current="capa"`: `go` para um id fora da versão não muda de slide;
  - teclas rápidas: `--js "__deck.go('capa');for(const k of ['ArrowRight','ArrowRight','ArrowLeft'])document.dispatchEvent(new KeyboardEvent('keydown',{key:k}))"` → `data-current="pergunta"`;
  - foco num link: `--js "document.querySelector('a[href^=\"playground.html\"]').focus();document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))"` (começando de `demo-ida` via `__deck.go`) → `data-current="demo-volta"`;
  - `?v=45` não se testa pelo `shot.sh`, que não passa query. Usar o padrão `--dump-dom` cru da Task 1 com `apresentacao.html?v=45` e esperar 12 posições no contador (`/ 12`).

- [ ] **Step 7: Commit** (página, checagem, `package*.json`, ADR e o índice `docs/adr/README.md`).

---

### Task 3: Abertura, dor e o que é o ODDS

**Files:** Modify `docs/design/pages/apresentacao.html` — slides `capa`, `pergunta`, `dor-espacos`, `dor-custo`, `odds-texto-mapa`, `odds-contratos`, e as entradas correspondentes em `ENTER`.

**Interfaces:**
- Consumes: `ENTER`, `.slide`, as notas.
- Produces: `<template id="tpl-solucao">`, o SVG do espaço da solução, reaproveitado pela Task 5. Dentro dele:
  - grupos `g[data-svc]` para os serviços genéricos: `auth-svc`, `payments-api`, `fraud-svc`, `orders-svc`, a "API A" (`data-svc="api-a"`, destacada), `rail-gateway`, `ach-batch`, `ledger-db`, mais as filas;
  - setas entre eles;
  - nuvem e contas como fundo.

  Cada serviço corresponde a um contexto do recorte, para que a camada do problema da Task 5 o envolva. A API A corresponde a `PaymentExecution`.

- [ ] **Step 1:** `capa` — "ODDS", a linha "O espaço do problema, escrito, validado e versionado" e o autor. Fundo com o gradiente de herói.
- [ ] **Step 2:** `pergunta` — o SVG do template entra peça por peça. A API A pulsa e a pergunta-âncora surge ao lado, no texto exato. Notas: a história da "API A" do autor.
- [ ] **Step 3:** `dor-espacos` — duas colunas: espaço da solução (o que os desenhos mostram) × espaço do problema (domínio, subdomínio core/supporting/generic, contexto, natureza da relação). `dor-custo` — o que se perde numa corporação: onboarding, decisões de integração, acoplamento que ninguém escolheu. Os três itens entram um por vez.
- [ ] **Step 4:** `odds-texto-mapa` — à esquerda, um trecho de `pagamentos.odds` em JetBrains Mono (o subdomínio `Fraud` e duas linhas do `mapping`); à direita, o mesmo trecho como mapa em SVG. A animação liga linha a peça. `odds-contratos` — os quatro conectores (`-->` `<--` `<->` `-x-`), as tags como contratos com lado, as três severidades com ícone (nenhuma bloqueia o desenho) e "100% local no navegador".
- [ ] **Step 5:** `node docs/design/pages/apresentacao.check.mjs`, depois um `page-shot` de cada slide com `--js "__deck.go('<id>',{instant:true})" --expect 'data-current="<id>"'` em 1600×900, e olhar cada PNG.
- [ ] **Step 6: Commit.**

---

### Task 4: BIAN (versão 60) e a passagem para a demo

**Files:** Modify `docs/design/pages/apresentacao.html` — slides `bian-catalogo`, `bian-correspondencia`, `demo-ida`, `demo-volta`.

- [ ] **Step 1:** `bian-catalogo` — "O BIAN diz que *Payment Execution* existe. Não diz se, neste banco, é core ou genérico, quem é upstream de quem, nem onde há uma ACL." Cite a fonte: BIAN Service Landscape 12.0, Value Chain View.
- [ ] **Step 2:** `bian-correspondencia` — a tabela da spec §4 (recorte → `domain`; business domain → `subdomain` + classificação; service domain → candidato a `context`) e a árvore do recorte, com os cinco subdomínios e o bloco externo, com rótulo "classificação ilustrativa".
- [ ] **Step 3:** `demo-ida` — "Agora no playground →", com o link `<a href="playground.html?modelo=pagamentos" target="_blank">`. As notas trazem o roteiro conferido contra o core, uma edição por vez, sempre desfeita antes da próxima:

| Edição na linha do `mapping` | Diagnóstico esperado |
|---|---|
| `FraudEvaluation [OHS] --> [ACL] PaymentOrder` → `[CF]` no lugar de `[ACL]` | warning `CONFORMIST_CORE` |
| `PartyAuthentication [OHS, PL] -->      PaymentInitiation` → `[S] --> [C]` | warning `GENERIC_WITHOUT_OHS` |
| `SPI [OHS, PL] --> [ACL] PaymentRailOperations` → `SPI [ACL] --> PaymentRailOperations` | error `DOWNSTREAM_ONLY_TAG_MISPLACED` |

Na versão 30, só as duas primeiras edições e a troca entre as vistas Fluxo e Contenção. A versão 60 acrescenta a terceira e uma construção do zero: um subdomínio novo com um contexto (`UNMAPPED_CONTEXT` aparece), depois ligado no `mapping` (o diagnóstico some). As notas dizem para **não** clicar em Compartilhar, que é um placeholder.

- [ ] **Step 4:** `demo-volta` — uma linha que retoma a pergunta-âncora, agora respondida para a API A: "`PaymentExecution` · Liquidação · supporting".
- [ ] **Step 5:**
  - Rodar a checagem.
  - Fazer o `page-shot` dos quatro slides. Para os de 60, use `__deck.setVersion(60)` antes.
  - Conferir cada linha de "edição → diagnóstico" das notas contra o core, com o mesmo padrão `parseAndValidate` + `replace` usado no plano. Se o validador mudar, as notas mudam junto.
- [ ] **Step 6: Commit.**

---

### Task 5: Encaixe, estado, decisão e apêndice

**Files:** Modify `docs/design/pages/apresentacao.html` — slides `encaixe-camadas`, `encaixe-visao`, `encaixe-fluxo`, `estado`, `decisao`, `apendice-alternativas`.

**Interfaces:**
- Consumes: `#tpl-solucao` e seus `g[data-svc]`, da Task 3.

- [ ] **Step 1:** `encaixe-camadas` — o momento-chave. O diagrama da solução reaparece e, sobre ele, entra a camada do problema: regiões dos subdomínios envolvem os serviços correspondentes, com a cor do tipo, e os contextos são rotulados. A API A ganha o endereço "Liquidação · supporting · `PaymentExecution`". Legenda: "a plataforma vê o que roda · o ODDS diz o que significa".
- [ ] **Step 2:** `encaixe-visao` (`.selo-visao`) — declarado × descoberto. Dois achados de exemplo:
  - uma integração que roda em produção e não está no mapa;
  - uma relação declarada que não existe em produção.

  Texto: "isso não existe hoje em nenhum dos dois lados". `encaixe-fluxo` (versão 60, `.selo-visao`) — o fluxo possível entre o ODDS, como texto versionado junto do código, e a plataforma, que descobre o que roda e cruza com o declarado. É um diagrama, sem promessa de prazo.
- [ ] **Step 3:** `estado` — duas colunas.
  - **Existe hoje:** a especificação completa (gramática, regras, mensagens PT/EN, linguagem 1.0.1); `@odds/core` com 44 de 44 casos da suíte; o playground no navegador, sem servidor.
  - **Não existe:** link de compartilhamento; mapeamento a partir de repositórios; integração com a plataforma.

  Rodapé: "iniciativa pessoal; incubação num programa maior é bem-vinda".
- [ ] **Step 4:** `decisao` — gradiente de herói. Título: "O ODDS entra na plataforma interna?" e os três pontos da spec §5:
  - o que entrar significa (a camada do espaço do problema, começando por um piloto num domínio);
  - o que existe × o que seria construído junto;
  - o que o autor traz e o que não promete.
- [ ] **Step 5:** `apendice-alternativas` — resposta curta, de reserva, para "por que não Context Mapper, Structurizr ou Miro?": texto validado por regras com código, dentro do navegador e sem servidor, e a camada do problema como complemento da plataforma, não como substituta. Só acessível pela tecla `A`.
- [ ] **Step 6:** Rodar a checagem, fazer o `page-shot` de cada slide e olhar. Commit.

---

### Task 6: Passada visual e de projeção

**Files:** Modify `docs/design/pages/apresentacao.html`; `docs/design/README.md` (uma linha apontando a página e o roteiro).

- [ ] **Step 1:** Capturar todos os slides da versão 60 (ela contém os da 30) em 1600×900 e olhar cada um contra o `DESIGN.md`. Conferir:
  - hierarquia;
  - Montserrat só em títulos;
  - contraste;
  - gradiente só em `capa` e `decisao`;
  - selo "Visão" visível.
- [ ] **Step 2:** Capturar `pergunta`, `odds-contratos`, `bian-correspondencia` e `encaixe-camadas` (os slides mais densos) em `--size 1280x720`, `1920x1080` e `1024x768`. Expected: sem corte nem transbordo; no 4:3, faixas de letterbox acima e abaixo.
- [ ] **Step 3:** Movimento reduzido: o `shot.sh` não emula a media query, então conferir no código que `prefers-reduced-motion` cai no mesmo `progress(1)` de `{instant:true}`. As capturas do passo 1 já são esse estado final.
- [ ] **Step 4:** Corrigir o que as capturas mostrarem. Rodar `node docs/design/pages/apresentacao.check.mjs`, `node docs/design/pages/playground.build.mjs` e `npm run health`. Expected: `ok`, `ok` e "16 conformes".
- [ ] **Step 5: Commit.**
