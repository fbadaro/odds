# Retrospectiva da rodada de herói — e um processo para a próxima

**Sessão:** 2026-09-09 · **Branch:** `design/playground-ui-ux` · **Commits:** `5eabe98`, `f6b6f32`

Este arquivo não é normativo e não entra no ciclo do `HEALTH.md` — `docs/design/` é exploração, e o `PRD.md` continua mandando onde houver divergência. Ele existe para uma coisa: transformar o que custou caro nesta sessão em regra barata na próxima.

Uma ressalva de honestidade antes de tudo: **a maior parte do tempo perdido aqui foi minha, não sua.** A seção sobre o que você controla vem depois da seção sobre o que eu errei, porque essa é a ordem verdadeira dos custos.

---

## 1. O que a sessão produziu

| Entrega | Onde | Rodadas até fechar |
|---|---|---|
| Bancada com cinco candidatas a herói (B a F) | `pages/bancada-heroi.html` | 9 publicações |
| Estudo de render do Context Map | `pages/mapa-vivo.html` | 1 |
| Landing v5 (a v4 com o herói da F) | `pages/landing-v5.html` | 2 |
| Reorganização de `docs/design/` + regra de ignore escrita | `README.md`, `.gitignore` | 1 |

Dezesseis turnos seus até a reorganização. **Cinco deles foram correções visuais pontuais** — serrilhado e caixa reta, grelha sem moldura, corte no topo, faixa amarela, bordas coloridas. Esse é o número que mais diz sobre o processo.

---

## 2. Onde eu perdi tempo, e por quê

### 2.1 Li o destino errado (o custo mais caro da sessão)

Você mandou duas referências e disse *"creio que a nossa visualização seja algo parecido com isso"*. Eu li **visualização** como o render do diagrama do produto e construí uma página de estudo separada. Você queria a animação do herói.

Você me corrigiu com *"ainda estou falando da animação que quero usar no hero section"* — e teve razão. Eu tinha todo o contexto para acertar: a conversa inteira até ali era sobre herói.

**A falha estrutural:** eu classifiquei o pedido por *assunto* (visualização de grafo) em vez de por *destino* (onde a peça vai morar). Assunto é ambíguo; destino não é.

O trabalho não foi jogado fora — o estudo alimentou E e F, e respondeu a pergunta de forma do nó. Mas foi uma rodada inteira no enquadramento errado.

### 2.2 Descobri defeitos olhando, não checando

Praticamente todo defeito desta sessão foi achado por captura de tela depois de publicar ou quase publicar: os dois `[ACL]` empilhados, a pill em cima do nó Entrega, a lama que não parecia lama, a borda lateral que sumiu em F, o corte no topo da grelha.

Olhar é insubstituível para julgar composição. Mas **metade desses defeitos era verificável sem olhar**, e eu não tinha checagem nenhuma. A §5 deste documento é a lista que eu deveria ter tido desde o começo.

### 2.3 Diagnostiquei duas vezes um problema que não existia

Medi o estado da página com `setTimeout` enquanto a aba estava em segundo plano. O navegador estrangula `requestAnimationFrame` ali, então a timeline estava em 0,08 s de 5,20 s e eu li nós com opacidade 0,97 / 0,94 / 0,90 — cascata perfeita de uma animação **em andamento**. Concluí "sumiu" duas vezes antes de perceber.

**Regra que faltava:** nunca medir estado animado por tempo de relógio. Levar a timeline ao fim de forma determinística — clicar "ir ao frame final", ou `progress(1)` — e só então medir.

### 2.4 Referenciei tokens de um arquivo em outro

Criei `--t-core`, `--t-supporting`, `--t-generic` e `--t-external` na página do estudo de render e usei em F, que é outro documento. CSS com variável indefinida **descarta a declaração em silêncio**: sumiram a borda lateral e a bolinha de tipo, sem erro no console. Pior: a string `var(--t-core)` era montada em tempo de execução, então nem buscar no arquivo achava.

### 2.5 Quase salvei trabalho num caminho que o git apagaria

`docs/design/canvas/**/*.html` está no `.gitignore` desde antes desta sessão. Se eu tivesse posto a bancada em `canvas/hero-anim/`, ela teria sumido do versionamento sem aviso. Peguei por sorte, checando o `.gitignore` por outro motivo.

---

## 3. O que você poderia ter feito diferente

Cinco coisas, em ordem de retorno.

### 3.1 Nomear o destino junto com o pedido

O erro da §2.1 morre com uma frase. Compare:

> *"creio que a nossa visualização seja algo parecido com isso"*

> *"quero o nível de animação disso **no herói**, como uma versão nova na bancada"*

A segunda não tem leitura ambígua. **Destino = qual peça, em qual arquivo, substituindo o quê.** É a informação mais barata de dar e a mais cara de errar.

### 3.2 Dizer o que tomar da referência, e o que não

O `DESIGN.md` §1 já faz isso muito bem com a referência do ArchStudio: uma tabela de *tomado* e uma linha de *não tomado*. Esse método existia e não foi aplicado às referências novas — eu tive que decidir sozinho o que pegar do EventCatalog, e você teve que aceitar ou corrigir depois.

Uma referência sem recorte é um cheque em branco. Duas linhas resolvem: *"do ArchStudio quero o movimento, não a paleta; do EventCatalog quero o comportamento de foco, não a barra de ferramentas"*.

### 3.3 Agrupar as correções visuais

Cinco dos dezesseis turnos foram correção pontual. Alguns eram inevitáveis — você viu a grelha sem moldura e só então percebeu que a faixa amarela brigava com ela. Mas o bloco grelha custou **três turnos** (tirar moldura → ainda corta no topo → tirar faixa amarela) e era **uma intenção só**: *"quero que a grelha pareça infinita"*.

Quando você fez isso — *"faça essas duas e depois passo as demais alterações"* — funcionou melhor do que os turnos de item único. Vale como padrão: descreva a **intenção**, não o ajuste. Eu derivo os ajustes e você corrige o que sobrar.

### 3.4 Dizer o critério de aceitação antes, não depois

O `README.md` desta pasta tem uma coluna que é ouro: **"O que a derruba"**. Cada hipótese vem com o que a refutaria. Isso existia para as variantes do playground e não foi aplicado às candidatas de herói — eu escrevi essa coluna sozinho, na bancada, depois de construir.

Uma frase de *"isto falha se…"* antes da construção vale mais que qualquer briefing. Foi o que fez a rodada anterior descartar três animações com clareza: *nenhuma consertava nada*.

### 3.5 Congelar antes de ramificar — sempre, não uma vez

Você fez isso uma vez, e foi a melhor decisão de processo da sessão: *"crie uma versão F para não perdermos a referência"*. Antes disso, E foi editada em cima de si mesma quatro vezes seguidas; se qualquer uma das mudanças tivesse piorado, não havia para onde voltar.

O `README.md` já carrega essa regra para os canvases — *"a base nunca é alterada por uma proposta; proposta nova nasce em canvas novo"*. Ela vale igual para as páginas.

---

## 4. O harness que eu proporia para o próximo projeto

Nada aqui é burocracia nova: é o que esta sessão fez bem, escrito para não depender de lembrança.

### 4.1 O contrato de rodada

Antes de qualquer construção, cinco linhas. Escritas por você, ou escritas por mim e confirmadas por você em uma palavra.

```
DESTINO      onde a peça mora e o que ela substitui
FORMATO      canvas seed | página autônoma | mudança em página existente
CONGELADO    o que não pode ser tocado nesta rodada
DERRUBA      a frase "isto falha se ___"
FRONTEIRA    qual regra normativa a rodada tem licença de quebrar, e onde a exceção fica registrada
```

O campo `FRONTEIRA` não é teórico: E e F quebram o `DESIGN.md` §4.2 de propósito, e isso só não virou dívida invisível porque você tinha pré-autorizado — *"sei que não há uma definição… mas tenho essa referência futura"*.

### 4.2 O ciclo, em cinco passos

1. **Levantar** — índice, `git log`, itens abertos. Nunca propor de memória.
2. **Propor N conceitos com o que os derruba** — texto, sem construir. Foi o passo que salvou esta sessão: das três primeiras propostas você recusou uma antes que ela custasse alguma coisa. Na rodada anterior, três animações foram construídas e recusadas em bloco.
3. **Construir com a lista de defeitos da §5 aplicada** — antes de olhar, não depois.
4. **Uma olhada, uma passada de correção** — e as correções entram como *achados*, com a causa, não como "ajustei".
5. **Publicar e relatar com os tradeoffs** — incluindo o que foi cortado e por quê.

### 4.3 Os gates

Só três, e nenhum deles é "aprovar o design":

- **Antes de construir:** o conceito foi escolhido entre alternativas.
- **Antes de publicar:** a lista de defeitos passou.
- **Antes de iterar:** a versão anterior está congelada, com nome próprio.

### 4.4 Duas regras de repositório que valem para qualquer projeto

- **Resolver onde a saída mora antes de escrever a primeira linha**, com `git check-ignore` no caminho pretendido. Um `.gitignore` que apaga trabalho em silêncio é a falha mais barata de prevenir e a mais cara de descobrir tarde.
- **O link do artifact é a identidade da peça, não o caminho do arquivo.** Republicar de outro caminho cria artifact novo. Mover arquivo sem anotar o link perde a peça.

---

## 5. Catálogo de defeitos recorrentes

A parte mais reaproveitável deste documento. Todos foram encontrados nesta sessão, em código real.

| # | Defeito | Como aparece | Checagem barata |
|---|---|---|---|
| D1 | **GSAP lê `translateY` inline como percentual** e soma o valor em px por cima | Um rolo de dois dígitos vai parar em `-40px` e mostra janela vazia | Zerar `xPercent`/`yPercent` no `set` inicial de qualquer elemento com transform inline |
| D2 | **Chrome não aplica o `opacity` do path ao `marker-end`** | Aresta apagada com ponta de seta sólida | Desenhar a ponta como path próprio e animar junto |
| D3 | **`overflow-x: auto` força `overflow-y` de `visible` para `auto`** | O que transborda em cima é recortado, e aparece um corte reto | Nunca contar com transbordo vertical dentro de um contêiner com scroll horizontal |
| D4 | **Raio de máscara maior que a metade da caixa** | O gradiente termina com opacidade alta **na aresta** — corte reto disfarçado de esmaecimento | `Rx`/`Ry` de 50% com centro em 50%/50% faz o zero cair na borda |
| D5 | **Token CSS definido em outro documento** | Declaração descartada em silêncio; sem erro no console | Nunca referenciar token de outro arquivo; a string montada em runtime não aparece em busca |
| D6 | **Rótulos empilhados onde arestas convergem** | Dois chips no mesmo ponto, ilegíveis | Deslocar pela **normal da curva**, não por offset fixo em Y |
| D7 | **Medir estado animado com relógio** | Aba em segundo plano estrangula o `rAF`; leitura mostra meio-caminho | Levar a timeline a `progress(1)` antes de medir |
| D8 | **Altura fixa de seção** | Ou sobra banda morta (260px no herói da v5), ou corta conteúdo sem aviso (o rodapé da landing v3) | Respiro explícito por `padding`, altura livre |
| D9 | **Callback em vez de tween** | O scrub não reverte estado trocado por callback | Todo estado deve ser propriedade animável; contador vira rolo de `translateY`, não troca de texto |
| D10 | **Densidade gerada por sorteio uniforme** | Emaranhado vira teia de aranha em vez de aglomerado | Distribuição com peso central; e **semente fixa**, senão a composição muda a cada recarga e não dá para julgar |

---

## 6. O que eu não estruturaria

Para o documento não virar processo pelo processo:

- **Não escreveria ADR para rodada de exploração.** O `ADR-0007` já cobre "mocks descartáveis antes de escolher stack". Uma ADR por animação seria ruído.
- **Não pediria briefing formal.** As melhores instruções da sessão foram curtas e diretas — *"quero a animação das setas serrilhadas novamente"*. O contrato de rodada da §4.1 são cinco linhas, não um formulário.
- **Não automatizaria o julgamento visual.** A olhada continua sendo a ferramenta certa para composição. O que a lista da §5 faz é impedir que a olhada seja gasta com defeito mecânico — para que ela sobre para o que só olho resolve.

---

## 7. O que ficou em aberto

- Escolher entre as cinco candidatas. Se for E ou F, a exceção ao `DESIGN.md` §4.2 sobe para o arquivo e fecha com o `CHANGELOG.md`.
- Nunca foi testado se o editor de canvas executa `<script>`. É o que decide se uma peça animada pode voltar para `canvas/` ou fica em `pages/` para sempre.
- O amarelo sumiu inteiro do herói da F. Nas outras candidatas ele aparece como chão; aqui, não.
- `.claude/skills/gsap-core/` e `svg-animations/` seguem fora do versionamento. A `gsap-core` sustenta as cinco animações — num clone limpo, ela não vem junto.

---

## 8. Fechado em 2026-09-12: a olhada deixou de depender de permissão

A §2.2 dizia que praticamente todo defeito daquela sessão foi achado por captura de tela, e a §5 nasceu para que a olhada não fosse gasta com defeito mecânico. O que faltava era pior do que isso: **em boa parte das sessões não havia como olhar.** O `claude-in-chrome` depende de permissão por site, e `claude.ai` e `127.0.0.1` costumam estar bloqueados — ou seja, quem escreve o artifact não consegue vê-lo.

Resolvido pelo binário do Chrome em modo headless contra o arquivo local, e virou a skill **`page-shot`**. Ela carrega as três guardas que custaram para descobrir (o esqueleto do artifact, o headless que não encerra sozinho, o perfil descartável), a regra do `--expect` — ação sem verificação falha calada e você conclui coisas sobre a tela errada — e uma tabela V1–V5 dos defeitos que **só** a captura pega.

A consequência de processo é a que interessa: **defeito achado de olho e mecanizável vira checagem nova na mesma passada**. Três nasceram assim já na primeira aplicação — nada fora do viewBox, marca d'água contra marca d'água, rótulo contra rótulo — e as três já tinham deixado passar defeito.
