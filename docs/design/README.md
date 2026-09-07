# Exploração de UI/UX do playground

**Branch:** `design/playground-ui-ux` · **Canvas:** https://claude.ai/code/artifact/648d3fae-b499-46b9-ad3b-8c65fd5976ab

Este diretório existe para uma coisa só: **decidir a UI/UX do playground antes de escolher framework de UI e biblioteca de render**, e não o contrário. As três decisões de stack que faltam (`HEALTH.md` §9.2, R6.4) são caras de reverter; o desenho da tela é barato de jogar fora enquanto for HTML estático. Por isso a ordem é esta.

O que está aqui **não é normativo**. O `PRD.md` continua sendo a fonte dos requisitos; onde um mock divergir dele, o PRD está certo e o mock está errado.

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

## Variante D — o trilho de quadrados

A escolha do autor foi a **B**, com o outline da **C** dentro dela. A D é essa mistura, e acrescenta um mecanismo: **quatro quadrados isolados** na borda esquerda, um por funcionalidade — código, estrutura, modelos prontos, ajuda. Clicar num quadrado troca o painel aberto; clicar no mesmo quadrado fecha tudo e devolve a tela inteira ao diagrama. Um painel por vez, sempre.

O que isso resolve: a C ganhava o outline pagando 250px permanentes de diagrama. Na D as duas áreas dividem o mesmo espaço e o custo só existe enquanto o painel está aberto — a H3 deixa de competir com a direção "diagrama dominante".

**Uma opinião embutida, aberta a ser derrubada:** os diagnósticos não viraram quadrado. Eles são a H1 — a tese do produto é julgar sem ser convidado, e atrás de um toggle o linter deixa de fazer isso. A ilha do rodapé continua ancorada, com os contadores sempre à vista. Se a decisão for que diagnóstico também é painel do trilho, o desenho aceita, mas aí a H1 cai por escolha e não por acidente.

Os quadrados de **modelos prontos** (`PRD.md` §9.3, fase 3) e **ajuda** (§5.1) são candidatos, não obrigações — saem do trilho sem custo nenhum.

Hipótese nova que a D introduz:

| # | Hipótese | O que a derruba |
|---|---|---|
| **H8** | Um painel por vez basta (vale para o trilho; o rodapé é permanente e não entra na conta). Ninguém precisa de editor e estrutura abertos ao mesmo tempo, porque os dois dizem a mesma coisa em formatos diferentes | Uso real que exija olhar a árvore enquanto digita — por exemplo, escrever o bloco `mapping` conferindo os nomes declarados acima |

## Estado

- [x] Direção fixada com o autor
- [x] Três variantes de tela cheia no canvas
- [x] Variante D: B + C, com trilho de quadrados isolados
- [ ] Escolher uma variante (ou a mistura) e consolidar numa só
- [ ] Rodada de estados: degradação, diagrama obsoleto, vazio, arquivo novo
- [ ] Só então: ADRs de framework, biblioteca de layout e bundler
