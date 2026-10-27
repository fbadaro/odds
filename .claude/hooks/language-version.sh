#!/usr/bin/env bash
# Antes de commit, push ou PR: a ODDS Language Version acompanha a superfície da
# linguagem (C17 de scripts/check_spec.py). Falhou, a ferramenta não roda.
cmd=$(jq -r '.tool_input.command // empty')
grep -qE '(^|[;&|[:space:]])(git[[:space:]]+(commit|push)|gh[[:space:]]+pr[[:space:]]+create)([[:space:]]|$)' <<<"$cmd" || exit 0
out=$(python3 "${CLAUDE_PROJECT_DIR:-.}/scripts/check_spec.py" --only C17) && exit 0
echo "$out" >&2
exit 2
