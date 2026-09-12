---
name: page-shot
description: Captura em PNG uma página de docs/design/pages/ para poder olhar a composição, sem depender da extensão do navegador. Use antes de dar uma rodada de design por encerrada, ao suspeitar de corte, sobreposição ou contraste, e sempre que precisar comparar tema claro e escuro ou um estado que só existe depois de clicar num controle.
---

# Olhar a página, não só medir

Metade dos defeitos de uma rodada de design é **mecânica** e se pega com script — span errado, rótulo sobreposto, elemento fora do viewBox. A outra metade é **composição** — peso, proporção, hierarquia, contraste — e só se pega **olhando**. Esta skill existe para que a segunda metade não fique inacessível.

O `claude-in-chrome` depende de permissão por site e costuma estar bloqueado para `claude.ai` e para `127.0.0.1`, o que torna o artifact publicado invisível para quem o escreveu. O caminho aqui não passa pela extensão: é o binário do Chrome em modo headless, contra um arquivo local.

## Como usar

```bash
.claude/skills/page-shot/scripts/shot.sh \
  --page docs/design/pages/colmeia-v2.html \
  --out  /tmp/.../mapa.png
```

E então `Read` no PNG. As opções que mais rendem:

| Opção | Para que |
|---|---|
| `--theme light \| dark \| system` | O `DESIGN.md` tem duas paletas. **Capture as duas**: erro de contraste no escuro é o mais comum e o mais invisível no claro |
| `--size 1400x900` | A janela. A página é responsiva, então o tamanho muda a composição — não julgue largura de leitura numa janela que você não escolheu |
| `--only <sel>` / `--hide <sel>` | Isola o elemento a julgar. Cabeçalho e notas comem a captura e empurram o que interessa para fora dela |
| `--click <sel>` | Estado que só existe depois de interagir: troca de aba, segmented control, modo alternativo |
| `--js "..."` | Qualquer outro preparo — abrir um painel, selecionar um item, forçar um estado |
| `--expect <substr>` | **Obrigatório junto com `--click`/`--js`.** Ver abaixo |
| `--keep` | Mantém o wrapper temporário, para inspecionar o HTML montado |

## A regra que não é opcional: `--expect` com toda ação

`--click` e `--js` falham **em silêncio**. Um seletor errado não gera erro visível: a captura sai, bonita, mostrando o **estado inicial** — e você conclui coisas sobre uma tela que não é a que quis ver. Aconteceu na primeira versão deste script.

`--expect` resolve sem custo: o script roda um segundo passe com `--dump-dom` e exige que a string apareça no DOM final.

```bash
shot.sh --page ... --out ... \
  --click '#segModel button[data-v="many"]' \
  --expect 'data-v="many" aria-pressed="true"'
```

Escolha uma string que **só possa existir depois da ação** — o `aria-pressed` do controle clicado é quase sempre a melhor. Evite palavra solta do vocabulário da página: ela pode estar num comentário de CSS e o teste passa sem provar nada.

## Três guardas, e o defeito que cada uma previne

Estão no script, comentadas lá também. Não as remova sem entender o que reaparece.

1. **O esqueleto do artifact.** As páginas de `docs/design/pages/` são *fragmentos*: não têm `<!doctype>`, `<html>`, `<head>` nem `<body>` — o host do artifact monta isso na publicação, junto com um reset mínimo. Abrir o fragmento direto renderiza com os defaults do navegador, e a captura **não corresponde ao artifact publicado**. O script monta o mesmo esqueleto.

2. **O Chrome headless não encerra sozinho.** Quando a página pede fonte externa (Google Fonts), ele escreve o PNG e continua esperando a rede — o comando estoura o tempo e vai para segundo plano, mesmo tendo dado certo. O script roda em background, espera o arquivo aparecer, e mata o processo. E **`timeout` não existe no PATH do macOS**, então não conte com ele.

3. **Perfil descartável.** `--user-data-dir` aponta para um temporário: a captura nunca toca o perfil real do Chrome, nem as sessões abertas.

## Onde isto se encaixa na rodada

O ciclo da `docs/design/RETROSPECTIVA.md` §4.2 manda construir com a lista de defeitos aplicada **antes** de olhar, e depois gastar a olhada no que só olho resolve. Esta skill é o instrumento do passo 4:

1. Rode as checagens mecânicas (o padrão desta casa é extrair o `<script>` da página e rodá-lo em Node com um stub de DOM, medindo colisões e limites).
2. **Então** capture, nos dois temas, e olhe.
3. Cada defeito achado de olho e que seja mecanizável **vira checagem nova** — senão volta na rodada seguinte.

Três checagens nasceram assim em 2026-09-12, e as três já tinham deixado passar defeito: *nada fora do viewBox*, *marca d'água contra marca d'água*, *rótulo contra rótulo*.

## Defeitos que só a captura pegou

Acrescente aqui o que aparecer. A lista é o valor acumulado da skill.

| # | Defeito | Como apareceu | Regra que fica |
|---|---|---|---|
| V1 | Rótulo emitido **antes** das peças fica por baixo delas e aparece em fragmentos (`LMEN`, `ID…TY`), que se leem como ruído | Marca d'água de subdomínio na colmeia v2 | Rótulo que precisa ler sobre qualquer fundo vai **por último** e com halo (`paint-order:stroke` + `stroke` da cor do painel) |
| V2 | Limites do desenho calculados só sobre a geometria **cortam** rótulo e chip, que ficam fora dela | Fila de chips cortada no topo do mapa | O viewBox conta **tudo que é desenhado**, inclusive texto e chip — e isso exige calcular rótulo e aresta **antes** dos limites |
| V3 | Rótulo dentro da área do desenho colide com o próprio conteúdo | Nome do domínio caía sobre o terreno, com uma aresta cruzando | Rótulo de identidade fica **fora** da região desenhada, não sobre ela |
| V4 | Contornos de níveis diferentes com o mesmo peso fazem a hierarquia ler como plana | Fronteira de domínio indistinguível do contorno da massa | Cada nível precisa de peso próprio — e engrossar demais vira gaiola: ajuste **opacidade junto com espessura** |
| V5 | Ajustar peso de obstáculo em empacotamento só **transfere** a colisão | Chips de tag: corrigir sobre-peça quebrava sobre-rótulo | Empacotamento apertado pede **passada de reparo iterativo** (cada item revendo a posição contra o estado final dos outros), não afinação de pesos |

## O que esta skill não faz

- **Não abre o artifact publicado.** Ela captura o arquivo local. Isso é suficiente para julgar composição e é mais fiel ao que você acabou de editar; o que ela não verifica é a publicação em si.
- **Não substitui a extensão** para navegar em site de terceiro, ler console ao vivo ou interagir de verdade. Para isso, `claude-in-chrome` — que funciona onde há permissão.
- **Não decide.** A captura mostra; o julgamento de composição continua sendo do autor.
