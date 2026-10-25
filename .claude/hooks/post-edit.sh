#!/usr/bin/env bash
# PostToolUse (Write|Edit): lembretes que precisam disparar em toda edição, não
# só quando o agente lembra. Lê o JSON do hook na entrada padrão e, quando o
# arquivo editado pede um fechamento de passe, devolve um systemMessage.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
root=${CLAUDE_PROJECT_DIR:-$(pwd)}

changelog() {
  jq -n --arg doc "$1" --arg section "$2" '{systemMessage: ($doc + " is version-tracked in CHANGELOG.md. Add an entry under \"## " + $section + "\", bump the current-version line there, and update the current-version pointer in the Changelog section of " + $doc + " itself.")}'
}

case "$file" in
  "$root/GRAMMAR.md" | "$root/AST_SCHEMA.md" | "$root/TEST_SUITE.md" | "$root/MESSAGES.md")
    doc=$(basename "$file")
    changelog "$doc" "$doc"
    ;;
  "$root/RULES-EN.md" | "$root/RULES-PT.md")
    changelog "$(basename "$file")" "RULES-EN.md / RULES-PT.md" |
      jq '.systemMessage += " Mirror the edit in the other language in the same pass."'
    ;;
  "$root/docs/design/pages/playground.html")
    jq -n '{systemMessage: "playground.html é a bancada (ADR-0020/0021): ela valida a funcionalidade, não o markup. Se esta edição valida uma feature, marque o elemento-raiz com data-feature=\"<id>\" e porte para apps/playground pela skill portar-da-bancada, construindo com os componentes do Base UI — o apps/playground/test/parity.test.ts vai exigir o componente."}'
    ;;
esac
