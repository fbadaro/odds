#!/bin/zsh
# Captura uma pagina de docs/design/pages/ em PNG, sem depender da extensao do
# navegador. Ver SKILL.md para o porque de cada guarda.
set -u

PAGE=""; OUT=""; THEME="system"; SIZE="1500x1150"; CSS=""; JS=""; CLICK=""; WAIT="300"; EXPECT=""
KEEP=0

usage() {
  cat >&2 <<'USAGE'
uso: shot.sh --page <arquivo.html> --out <saida.png> [opcoes]

  --page <f>     pagina a capturar (o fragmento de artifact, sem doctype)
  --out <f>      PNG de saida
  --theme        light | dark | system          (default system)
  --size WxH     janela do navegador            (default 1500x1150)
  --only <sel>   esconde tudo menos esse seletor e seus ancestrais
  --hide <sel>   esconde esse seletor (pode repetir, separado por virgula)
  --css "..."    CSS extra injetado no fim
  --click <sel>  clica nesse seletor antes de capturar
  --js "..."     JS extra rodado antes de capturar
  --wait <ms>    espera antes de capturar, apos o clique  (default 300)
  --expect <s>   exige que o DOM final contenha essa string; falha se nao.
                 Use sempre que passar --click ou --js: e o que prova que a
                 acao pegou, sem depender de olhar a imagem.
  --keep         nao apaga o wrapper temporario (para depurar)
USAGE
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --page)  PAGE="$2"; shift 2 ;;
    --out)   OUT="$2"; shift 2 ;;
    --theme) THEME="$2"; shift 2 ;;
    --size)  SIZE="$2"; shift 2 ;;
    --only)  CSS="$CSS .wrap>*{display:none!important} $2{display:block!important}"; shift 2 ;;
    --hide)  CSS="$CSS $2{display:none!important}"; shift 2 ;;
    --css)   CSS="$CSS $2"; shift 2 ;;
    --click) CLICK="$2"; shift 2 ;;
    --js)    JS="$2"; shift 2 ;;
    --wait)  WAIT="$2"; shift 2 ;;
    --expect) EXPECT="$2"; shift 2 ;;
    --keep)  KEEP=1; shift ;;
    -h|--help) usage ;;
    *) echo "opcao desconhecida: $1" >&2; usage ;;
  esac
done

[ -n "$PAGE" ] && [ -n "$OUT" ] || usage
[ -f "$PAGE" ] || { echo "pagina nao encontrada: $PAGE" >&2; exit 1; }

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome nao encontrado em $CHROME" >&2; exit 1; }

W="${SIZE%x*}"; H="${SIZE#*x}"
TMP="$(mktemp -d)"
WRAP="$TMP/page.html"
THEME_ATTR=""
[ "$THEME" = "light" ] && THEME_ATTR=' data-theme="light"'
[ "$THEME" = "dark" ]  && THEME_ATTR=' data-theme="dark"'

# 1. Esqueleto equivalente ao que o host do artifact monta: charset, viewport e
#    um reset minimo. Sem isso a pagina renderiza com os defaults do navegador e
#    a captura nao corresponde ao artifact publicado.
{
  printf '%s' '<!doctype html><html'"$THEME_ATTR"'><head><meta charset="utf-8">'
  printf '%s' '<meta name="viewport" content="width=device-width,initial-scale=1">'
  printf '%s' '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui;'
  printf '%s' 'background:#fafafd}img{max-width:100%}[hidden]{display:none!important}</style>'
  printf '%s\n' '</head><body>'
  cat "$PAGE"
  [ -n "$CSS" ] && printf '<style>%s</style>\n' "$CSS"
  if [ -n "$CLICK" ] || [ -n "$JS" ]; then
    printf '<script>setTimeout(function(){try{'
    if [ -n "$CLICK" ]; then
      CLICK_ESC="${CLICK//\'/\\\'}"
      # `click()` e metodo de HTMLElement: em alvo SVG ele nao existe e a acao
      # falha calada. Despacha um MouseEvent, que serve para HTML e para SVG.
      printf "var _e=document.querySelector('%s');if(!_e)throw new Error('seletor nao encontrado: %s');_e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));" \
        "$CLICK_ESC" "$CLICK_ESC"
    fi
    [ -n "$JS" ] && printf '%s;' "$JS"
    printf '}catch(e){console.error("shot.sh:",e)}},%s)</script>\n' "$WAIT"
  fi
  printf '%s\n' '</body></html>'
} > "$WRAP"

rm -f "$OUT"
PROF="$TMP/profile"

# 2. O headless nao encerra sozinho quando a pagina pede fonte externa: ele fica
#    esperando a rede depois de ja ter escrito o PNG. Roda em background, espera
#    o arquivo aparecer, e mata. `timeout` nao existe no PATH do macOS.
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="$PROF" --window-size="$W,$H" \
  --virtual-time-budget=$(( WAIT + 3500 )) \
  --screenshot="$OUT" "file://$WRAP" >/dev/null 2>&1 &
PID=$!
for _ in {1..60}; do
  if [ -s "$OUT" ]; then sleep 0.4; break; fi
  sleep 0.5
done
kill $PID 2>/dev/null
wait $PID 2>/dev/null

if [ -s "$OUT" ]; then
  # 3. Se houve acao (--click/--js), prova que ela pegou lendo o DOM final. Sem
  #    isso um seletor errado falha calado e a captura mostra o estado inicial.
  if [ -n "$EXPECT" ]; then
    DOM="$TMP/dom.html"
    "$CHROME" --headless=new --disable-gpu --user-data-dir="$PROF-dom" \
      --virtual-time-budget=$(( WAIT + 3500 )) --dump-dom "file://$WRAP" > "$DOM" 2>/dev/null &
    DPID=$!
    for _ in {1..60}; do
      if [ -s "$DOM" ]; then sleep 0.4; break; fi
      sleep 0.5
    done
    kill $DPID 2>/dev/null
    wait $DPID 2>/dev/null
    if ! grep -qF -- "$EXPECT" "$DOM" 2>/dev/null; then
      echo "FALHOU  a captura saiu, mas o DOM final nao contem: $EXPECT" >&2
      echo "        o --click ou o --js nao pegou. wrapper: $WRAP" >&2
      [ $KEEP -eq 0 ] && echo "        (rode de novo com --keep para inspecionar)" >&2
      exit 1
    fi
  fi
  echo "ok  $OUT  ($(stat -f%z "$OUT") bytes, ${W}x${H}, tema $THEME)${EXPECT:+  [DOM confere: $EXPECT]}"
  [ $KEEP -eq 1 ] && echo "    wrapper: $WRAP" || rm -rf "$TMP"
  exit 0
else
  echo "FALHOU  nada escrito em $OUT" >&2
  echo "        wrapper mantido em $WRAP" >&2
  exit 1
fi
