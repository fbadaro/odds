# Exploração de UI/UX do playground

**Branch:** `design/playground-ui-ux` · **Canvas:** https://claude.ai/code/artifact/648d3fae-b499-46b9-ad3b-8c65fd5976ab

> **A base do protótipo é a variante D**, fixada em 2026-09-07. O canvas mostra só ela. Toda hipótese nova é testada *contra* esta base, e se nada convencer o retorno é para cá — é isso que uma base serve para garantir: nenhuma rodada de exploração pode terminar sem desenho.

Este diretório existe para uma coisa só: **decidir a UI/UX do playground antes de escolher framework de UI e biblioteca de render**, e não o contrário. As três decisões de stack que faltam (`HEALTH.md` §9.2, R6.4) são caras de reverter; o desenho da tela é barato de jogar fora enquanto for HTML estático. Por isso a ordem é esta.

O que está aqui **não é normativo**. O `PRD.md` continua sendo a fonte dos requisitos; onde um mock divergir dele, o PRD está certo e o mock está errado.

## Onde mora o quê

Duas árvores, e a diferença não é organizacional — é o que decide se o arquivo sobrevive ao commit.

| Árvore | O que é | Versionado? |
|---|---|---|
| `canvas/<rodada>/` | **Seeds do editor de canvas**: um `.dc.html` por artboard mais o `canvas.json` do layout | Sim. O `odds-*.html` da mesma pasta é o bundle montado a partir deles — regenerável, e **ignorado pelo git** |
| `pages/` | **Páginas autônomas** escritas à mão, com `<script>`, publicadas como artifact | Sim, integralmente. Ficam fora de `canvas/` justamente porque a regra de ignore não as alcança ali |

Duas consequências práticas, ambas já pagas caro nesta exploração:

- **Página que precisa de JS não cabe em `canvas/`.** Nenhum `.dc.html` deste repositório usa `<script>` (só o `support.js` do próprio editor), e nunca foi testado se o canvas executa script. Tudo que depende de uma engine de animação nasce em `pages/`.
- **Salvar dentro de `canvas/` é salvar em areia.** Um `.html` que não termine em `.dc.html` ali é apagado do versionamento sem aviso.

## Fora do escopo, deliberadamente

- **O desenho da renderização do diagrama.** Nós, arestas, tags nas linhas, as duas vistas do §4.4 — tudo depende da biblioteca de layout, que ainda não foi escolhida. Nos mocks a área do diagrama é wireframe neutro. Desenhá-la agora seria decidir a biblioteca por tabela.
- **Os estados de degradação** (aresta tracejada, nó fantasma, diagrama congelado marcado como obsoleto). São exigência do `PRD.md` §5.2 e do `RULES-EN.md`, mas são desenho de render: entram na rodada seguinte, junto com a biblioteca.
- **Escolher framework, bundler ou lib de layout.** Cada uma é ADR própria, depois desta exploração.

## Direção fixada (2026-09-07)

| Fork | Decisão |
|---|---|
| Arranjo | Diagrama dominante ocupando a tela; editor de texto em painel recolhível |
| Diagnósticos | Painel de rodapé, faixa/aba, com contadores por severidade e clique que leva à linha. **Lugar fixo, nunca atrás de um toggle** — decidido em 2026-09-07 ao fechar a variante D |
| Registro | Densidade de ferramenta, **tema claro por padrão** — referência `mermaid.live`. *"É uma ferramenta de arquitetura, não de código."* |
| Escopo do 1º canvas | Três variantes de tela cheia; só chrome: áreas, funcionalidades, tipografia, respiro |

Sistema visual usado nas três variantes: IBM Plex Sans (UI) + IBM Plex Mono (editor, codes, spans); azul de planta `#2B4C8C` reservado para ação e seleção; severidade nunca usa o acento — `#C0342B` erro, `#A66A00` aviso, `#5B6B7C` info, cada uma com ícone próprio, para não depender de cor sozinha (`PRD.md` §5.2 diz que o painel é o dono da apresentação da severidade).

## Hipóteses

Cada uma é uma afirmação que pode estar errada, com o que a derrubaria. Os mocks são o instrumento, não a evidência.

**H1 foi fechada em 2026-09-07**, e virou linha da direção fixada acima: *o painel de diagnósticos tem lugar fixo no rodapé*. A variante D foi desenhada com a alternativa disponível — bastaria um quinto quadrado no trilho — e a decisão foi manter o rodapé ancorado. Fica registrada aqui a razão, que é a mesma que o `PRD.md` §2.4 usa para separar a ODDS do Context Mapper: o produto julga sem ser convidado, e o que está atrás de um toggle não julga.

| # | Hipótese | O que a derruba |
|---|---|---|
| **H2** | O editor pode ficar **fechado** boa parte da sessão. O texto é a fonte única (`ADR-0003`), mas quem lê um mapa pronto não digita | Ver que toda edição real é iterativa — abre, digita, olha, digita — e o custo de abrir/fechar domina |
| **H3** | Um **outline de estrutura** (variante C) resolve "domínios complexos" (`PRD.md` §5.3) melhor do que rolar o texto | O outline repetir o que o texto já mostra sem ganho de navegação, custando 250px do diagrama |
| **H4** | **Contadores por severidade como filtro** bastam; não é preciso agrupar a lista por severidade | Listas longas ficarem ilegíveis sem cabeçalho de grupo — o caso da variante C |
| **H5** | Densidade de ferramenta + **tema claro** comunica "arquitetura", não "código" | O resultado parecer IDE apesar do tema claro; o sinal de "arquitetura" vem mais da tipografia e do respiro do que da cor |
| **H6** | A troca **fluxo ↔ contenção** é frequente e merece controle permanente no topo | Telemetria impossível (produto 100% local, `PRD.md` §8.1) — isto se decide por julgamento, não por dado |
| **H7** | O span em mono ao lado da mensagem (`L24:5`) basta para navegar; o painel não precisa mostrar trecho do código | Mensagens cujo contexto não se entende sem ver a linha — candidatos: `DUPLICATE_RELATIONSHIP`, `INCONSISTENT_BBM` |

**O que mock nenhum resolve** e só protótipo real responde: custo de re-render a cada tecla (`PRD.md` §8.2), qualidade do layout automático do grafo, e export vetorial **com os marcadores** (§5.2). Essas três decidem a biblioteca — não a tela.

## Referências, anotadas

Anotadas de propósito: o `REFERENCES.md` da raiz é uma lista de URLs sem anotação, e a rubrica do `HEALTH.md` §9.1 desconta exatamente isso.

| Referência | O que interessa | O que não copiar |
|---|---|---|
| [mermaid.live](https://mermaid.live) | A referência declarada pelo autor: claro, leve, sem cerimônia; o diagrama domina e o editor não se impõe | O split fixo 50/50 e a barra de configuração — a ODDS tem menos opções e mais veredito |
| [D2 playground](https://play.d2lang.com) | Diagrama dominante com editor lateral estreito; troca de layout engine sem sair da tela | Não tem linter: nada a aprender sobre painel de diagnósticos |
| [Structurizr](https://structurizr.com) | DSL de arquitetura com **múltiplas vistas do mesmo modelo** — o problema do `PRD.md` §4.4; seletor de vista como cidadão de primeira classe | Peso de produto: workspaces, servidor, conta. A ODDS é 100% local |
| [Context Mapper](https://contextmapper.org) | O concorrente direto (`PRD.md` §2.4): mesmo domínio, mesma notação | Entrega como plugin de IDE. É justamente o que a ODDS não quer ser |
| [Excalidraw](https://excalidraw.com) / [tldraw](https://tldraw.com) | O vocabulário de ilhas flutuantes sobre canvas que a variante B testa | O registro de rascunho à mão livre: briga com "linter que julga o seu design" |
| Painel *Problems* do VS Code | Contadores por severidade, filtro, clique que leva à linha — o vocabulário que o usuário já tem | O tema escuro e a densidade de IDE |

## A base: variante D, o trilho de quadrados

A escolha do autor foi a **B**, com o outline da **C** dentro dela. A D é essa mistura, e acrescenta um mecanismo: **quatro quadrados isolados** na borda esquerda, um por funcionalidade — código, estrutura, modelos prontos, ajuda. Clicar num quadrado troca o painel aberto; clicar no mesmo quadrado fecha tudo e devolve a tela inteira ao diagrama. Um painel por vez, sempre.

O que isso resolve: a C ganhava o outline pagando 250px permanentes de diagrama. Na D as duas áreas dividem o mesmo espaço e o custo só existe enquanto o painel está aberto — a H3 deixa de competir com a direção "diagrama dominante".

**Uma opinião embutida, aberta a ser derrubada:** os diagnósticos não viraram quadrado. Eles são a H1 — a tese do produto é julgar sem ser convidado, e atrás de um toggle o linter deixa de fazer isso. A ilha do rodapé continua ancorada, com os contadores sempre à vista. Se a decisão for que diagnóstico também é painel do trilho, o desenho aceita, mas aí a H1 cai por escolha e não por acidente.

Os quadrados de **modelos prontos** (`PRD.md` §9.3, fase 3) e **ajuda** (§5.1) são candidatos, não obrigações — saem do trilho sem custo nenhum.

### As outras três continuam existindo

A, B e C saíram do **canvas**, não do repositório: estão em `canvas/playground-base/VarianteA.dc.html`, `VarianteB.dc.html` e `VarianteC.dc.html`, e voltam ao canvas acrescentando o arquivo ao seed. Apagá-las seria perder o registro de *por que* a base é o que é — cada uma carrega um tradeoff que foi recusado por escrito, e recusa sem registro volta como proposta daqui a seis meses.

Hipótese nova que a D introduz:

| # | Hipótese | O que a derruba |
|---|---|---|
| **H8** | Um painel por vez basta (vale para o trilho; o rodapé é permanente e não entra na conta). Ninguém precisa de editor e estrutura abertos ao mesmo tempo, porque os dois dizem a mesma coisa em formatos diferentes | Uso real que exija olhar a árvore enquanto digita — por exemplo, escrever o bloco `mapping` conferindo os nomes declarados acima |

## Canvases

Um por rodada, e cada um tem uma função. **A base nunca é alterada por uma proposta** — proposta nova nasce em canvas novo.

| Canvas | Fonte | Papel |
|---|---|---|
| [Base do protótipo](https://claude.ai/code/artifact/648d3fae-b499-46b9-ad3b-8c65fd5976ab) | `canvas/playground-base/` | A variante D, sem estilo aplicado. É para onde se volta |
| [Landing v1](https://claude.ai/code/artifact/ae6c3f5b-4b65-4cbf-8d34-a1a0622d8571) | `canvas/landing-v1/` | Primeira rodada, acento azul. Mantida para comparação |
| [Landing v2](https://claude.ai/code/artifact/a5fee108-0126-4a09-bad6-e595b3666644) | `canvas/landing-v2/` | Paleta roxa, manchas, prancheta em perspectiva, texto revisado |
| [Landing v3](https://claude.ai/code/artifact/033ed552-f039-4091-a3f8-101309f39933) | `canvas/landing-v3/` | Montserrat, amarelo solar, menos empréstimos |
| [Landing v4](https://claude.ai/code/artifact/40e79d06-638e-4c5a-b3d4-3bc3c14b1e44) | `canvas/landing-v4/` | Amarelo vira superfície, faixa escura, herói animado — **a mais recente** |

**O playground estilizado saiu em 2026-09-11, por decisão do autor.** Ele vestia a base com a *primeira* paleta do `DESIGN.md` — azul de planta, neutros quentes — e ficou incoerente quando a paleta virou roxa na v2. Refazê-lo teria sido vestir de novo uma tela cujo miolo, a área do diagrama, ainda é wireframe: gasto de estilo antes de haver o que estilizar. O canvas e o artifact foram apagados; **a base volta a ser o único ponto de partida do playground**, e é de lá que a rodada de render começa.

**Duas rodadas saíram da tabela, e o motivo fica:** as três animações de herói e as três direções de marca foram **descartadas pelo autor em 2026-09-07**, por não convencerem — os `.dc.html` foram apagados no commit `6b9a946`, e é no histórico do git que eles vivem agora. A animação foi substituída por um conceito novo (*o lado da linha*, no canvas da v4); a marca segue em aberto, e até haver decisão a landing usa só o wordmark, sem pictograma provisório.

**Como olhar o que você desenhou:** a extensão do navegador costuma estar bloqueada para `claude.ai`, então o artifact publicado fica invisível para quem o escreveu. A skill **`page-shot`** captura a página local em PNG com Chrome headless, nos dois temas, e com estado preparado por clique — use antes de dar qualquer rodada por encerrada.

**Um detalhe operacional que custou caro:** o `h` de um artboard é moldura, não escala — o que passa dele é **cortado**, sem aviso. A v3 declarava `3840` e escondia o rodapé inteiro, que só aparecia no preview. Alturas agora nascem folgadas: sobra de moldura só pinta fundo, falta apaga conteúdo.

O sistema visual está no **`DESIGN.md`** da raiz, junto da procedência dele: o que foi tomado da referência (método) e o que não foi (identidade).

## Páginas autônomas

Nascidas fora do canvas porque dependem de uma engine de animação (GSAP 3 core, do cdnjs, sem plugin de clube). Cada uma é um artifact publicado; **o link é a identidade da peça**, não o caminho do arquivo — republicar de um caminho diferente cria um artifact novo em vez de atualizar o existente, então republique passando a URL.

| Página | Fonte | O que é |
|---|---|---|
| [Bancada do Herói](https://claude.ai/code/artifact/4c8e80fb-022e-483b-b84d-ce7ddf870bf4) | `pages/bancada-heroi.html` | Cinco candidatas a animação de herói (B a F) lado a lado, cada uma com replay, scrub e tabela de beats |
| [Mapa Vivo](https://claude.ai/code/artifact/f6b601e0-843f-492e-9985-05a460be3ab0) | `pages/mapa-vivo.html` | Estudo de render do Context Map: foco por vizinhança, e um botão que troca a forma do nó entre pill, arredondado e reto. **Encosta no `ADR-0007`** e diz isso na própria página |
| [Landing v5](https://claude.ai/code/artifact/bf281738-84b3-4795-b4d0-c084a718ce01) | `pages/landing-v5.html` | A v4 inteira com o herói trocado pela opção F |
| [Colmeia v1](https://claude.ai/code/artifact/c05ad18e-1f40-4e01-8613-8b0f4803db71) | `pages/colmeia-v1.html` | **Congelada.** Ilha única = domínio, sub-região = subdomínio, ponto = contexto. Ver o mapa da ACME no Aplas corrigiu o átomo aqui: o hexágono é a silhueta da região, não o item |
| [Colmeia v2](https://claude.ai/code/artifact/3ae26b8b-b961-414e-aceb-b71612374ca2) | `pages/colmeia-v2.html` | **Congelada.** Uma massa de terra por **tipo de subdomínio**, separadas por mar; só o mesmo tipo se junta. Contexto volta a ser **hexágono clicável**, com ficha na seleção. O espaçamento mínimo entre peças é medido, não escolhido |
| [Colmeia v3](https://claude.ai/artifact/W6nHqSDRs2yBjbwf45avQD) | `pages/colmeia-v3.html` | **Congelada; a v4 a substitui no ao vivo.** Posição derivada do grafo numa ordem canônica, então embaralhar o arquivo move 0 peças. A tag fica na porta, as setas andam pela grade hexagonal (A* com custo de curva), e fluxo e contenção usam a mesma geografia. O veredito vem do `@odds/core` real, gerado e conferido por `pages/colmeia-v3.check.mjs`, que também mede a página com a régua da v2 |
| [Colmeia v4](https://claude.ai/artifact/HfdiXv6KZ2YgP6QQM2CsJj) | `pages/colmeia-v4.html` | **A mais recente.** A v3 com **localidade** (`ADR-0010`): território dimensionado por degrau (4, 8, 12, 20…), arranjo dos territórios e prateleira fixos, cada território posiciona as próprias peças sozinho. `pages/colmeia-v4.check.mjs` acrescenta a família 6, que confere a localidade edição por edição: 0 violações em 71 edições de contexto, 70 renomes e 35 relações. A régua da v3 continua passando (1 e 1 cruzamentos) |
| [Colmeia 50](https://claude.ai/artifact/9zTjAm7Q3kY82TUadGtd7B) | `pages/colmeia-50.html` | **Instrumento do fork 4.** Um marketplace de 50 contextos, 12 subdomínios e 64 relações, desenhado pela v4 sem ajuste e medido por `pages/colmeia-50.build.mjs` (`--write` regrava a página). A contenção escala; o fluxo não: 120 cruzamentos, aresta de 43 células, 18 colisões, contra 1 cruzamento nos modelos de 17–24. A v3 dá 125 no mesmo modelo, então é custo da geografia, não do `ADR-0010`. O layout leva ~2,4 s, 70% no roteamento A* |
| [Colmeia navegação](https://claude.ai/artifact/E83vZJDQ46YEwZc1hz48yi) | `pages/colmeia-navegacao.html` | **Instrumento da rodada de navegação, condição do `ADR-0011`.** O marketplace do `colmeia-50` (o modelo mora em `pages/colmeia-50.model.mjs`, lido pelos dois) com zoom e pan, clique que acende e **enquadra** o contexto e os vizinhos, **foco num subdomínio** pelo clique no território (como na v3 e na v4, acrescentado a pedido do autor antes do teste), e tags que só aparecem com zoom para lê-las. O layout roda uma vez, no build (`pages/colmeia-navegacao.build.mjs`, `--write` regrava). A página só mexe no `viewBox` e em classes, e o build confere isso no texto do script. Também confere 200 enquadramentos de contexto (50 peças × 4 proporções de palco), 52 de subdomínio (13 territórios × 4) e 0 peças movidas na troca de vista. Traz o protocolo do teste humano: seis perguntas de integração com as respostas tiradas do modelo |
| [Colmeia ao vivo](https://claude.ai/artifact/JMBWefCBBGr3K8QR3tbWS6) | `pages/colmeia-ao-vivo.html` | **Protótipo do `ADR-0009`.** Editor + `@odds/core` real + o layout da v4 (até 2026-10-06, da v3) **sem cópia**, embutidos por `pages/colmeia-ao-vivo.build.mjs` (rode com `--write` depois de mexer na v4 ou no core; sem argumento, confere). Um robô digita quatro cenários e as três medidas do ADR ligam e desligam. Com a v3, mediu que **acrescentar um contexto move 15–17 de 17 peças**, e daí veio a exigência de localidade no ADR. Com a v4, o mesmo robô mede **0 de 17** |

## Estado

- [x] Direção fixada com o autor
- [x] Três variantes de tela cheia no canvas
- [x] Variante D: B + C, com trilho de quadrados isolados
- [x] Base do protótipo fixada: variante D, sozinha no canvas (2026-09-07)
- [x] Sistema visual extraído da referência e escrito no `DESIGN.md` da raiz (2026-09-07)
- [x] Proposta da landing em canvas próprio (a da base vestida foi descartada em 2026-09-11)
- [x] Landing v2: paleta roxa, atmosfera e arte de herói (2026-09-07)
- [x] Landing v2 refeita com a referência **vista**, não só lida: prancheta em perspectiva, esteira de codes, respiro maior
- [x] Landing v3: descaracterização — Montserrat no display, `--c-solar` como terceira cor, pills emprestadas substituídas
- [x] Landing v4 (2026-09-07): amarelo passa a ser **superfície e nunca tinta**, faixa escura, fluxo em faixa contínua, seção "duas vistas", marquee em uma trilha, wordmark sozinho
- [x] Animação do herói: **o lado da linha** — a tag atravessa o conector no editor e o mapa se cura. Conceito novo, no lugar das três recusadas
- [x] Rodada de herói (2026-09-09): cinco candidatas na bancada — B (o mapa que não pisca), C (seis portões), D (a lama tem nome), E (o mapa responde) e F (E no formato do herói)
- [x] Estudo de render do Context Map, com a ressalva do `ADR-0007` escrita na página
- [x] Landing v5: a v4 com o herói da opção F
- [ ] Escolher entre as cinco candidatas — e, se for E ou F, subir para o `DESIGN.md` §4.2 a exceção da tag sobre a aresta, fechando com o `CHANGELOG.md`
- [ ] Decidir a face de display: Montserrat (aplicada) ou Space Grotesk — quadro de comparação no canvas da v3
- [ ] Escolher a marca — a v4 tirou o cubo provisório e ficou só com o wordmark até haver decisão
- [x] Apagar o playground estilizado, do repositório e do artifact (2026-09-11) — a base é o ponto de partida
- [x] **Rodada de render aberta (2026-09-11)** — a colmeia do Aplas aplicada ao Context Map, partindo da base. A licença ao `ADR-0007` é esta rodada inteira, sob uma regra: o que sair daqui é **exigência**, não alvo visual, e a rodada fecha com ADR
- [x] Colmeia v2 (2026-09-11): massas por tipo de subdomínio com mar entre elas, contexto como peça hexagonal, seleção com ficha
- [x] Colmeia v3 (2026-09-27): posição invariante à ordem, tag na porta, rotas que contornam peças, veredito real e duas vistas numa geografia. O critério de derrubada passa nos dois modelos (13 → 1 e 7 → 1 cruzamentos; 0 arestas sobre peça alheia; desvio máximo 1,44×)
- [x] `ADR-0009` proposto (2026-09-28): layout próprio em `@odds/layout`, SVG, bibliotecas só nas bordas — e o protótipo **colmeia ao vivo** que o testa. As medidas de edição funcionam; o que falhou foi a **localidade** do layout (+1 contexto refaz o mapa)
- [x] Layout com localidade (2026-10-06, colmeia v4, `ADR-0010`): ±contexto e ±relação só movem os territórios envolvidos, e renomear move no máximo um gêmeo estrutural. É a primeira das duas condições do `ADR-0009`
- [x] Teste de digitação humana no `colmeia-ao-vivo` (2026-10-06): funcionou bem, e o `ADR-0009` passou a `accepted`
- [x] Fork do achado 4 fechado (2026-10-07, `ADR-0011`): **a colmeia é a vista principal**, e fluxo e contenção são dois modos da mesma geografia (com e sem ligações). O fluxo de 50 contextos visto inteiro é ilegível (`colmeia-50`), e quem o torna utilizável são as ferramentas de navegação
- [x] Instrumento da rodada de navegação (2026-10-09): `colmeia-navegacao`, com zoom e pan, clique que acende e enquadra, e detalhe por zoom. Achado já no build: os vizinhos de peças centrais, como `Checkout` e `PaymentGateway`, se espalham pelo mapa inteiro, então nelas o enquadramento quase não aproxima
- [x] Linha animada (2026-10-09, `ADR-0012`): a relação válida é sólida em repouso e vira **tracejado em movimento** do upstream para o downstream quando acesa; a **inválida** (diagnóstico `error`) é tracejado vermelho e parado, sempre, a marca do `RULES-EN.md` §5. Escolhida contra um pulso de luz, comparado lado a lado. O `colmeia-navegacao` ganhou o seletor *Arquivo: limpo · com erros*, com três erros plantados só nas tags, e o build confere que só essas três relações saem vermelhas e que nenhuma peça se move
- [ ] Teste humano da navegação, pelo protocolo da página: decide se o sinal de reversão do `ADR-0011` acende. Como o foco em subdomínio entrou antes do teste, ele mede se as quatro ferramentas bastam, e não mais se esse foco faz falta
- [ ] Desempenho do layout aos 50 contextos: 2,4 s, 70% no roteamento A* (`gridRoute`)
- [x] Fork do achado 2 fechado (2026-10-07): **posição derivada do texto**. O problema que o abriu, o mapa se refazendo a cada edição, foi resolvido pela localidade da v4 (`ADR-0010`) e confirmado no teste de digitação humana que aceitou o `ADR-0009`
- [ ] Decidir se `domain` deixa de ser cardinalidade 1 — e o que isso arrasta (`INVALID_DOMAIN_CARDINALITY`, `DOMAIN_WITHOUT_CORE`, posição do `external`, URL compartilhável)
- [ ] Rodada de estados: degradação, diagrama obsoleto, vazio, arquivo novo
- [ ] Só então: ADRs de framework, biblioteca de layout e bundler
