#!/usr/bin/env python3
"""Aloca o próximo ADR e escreve o esqueleto.

Uso:
    python3 .claude/skills/adr/scripts/new_adr.py "Título da decisão"
    python3 .claude/skills/adr/scripts/new_adr.py "Título" --supersedes 0003,0007

O script cuida do que é mecânico — número, slug, data, frontmatter, linha no
índice, e a saída dos ADRs substituídos — e deixa em branco o que exige pensar.
Não valide aqui: quem afere a integridade do razão é a C16 do `check_spec.py`.

Sem dependências além da stdlib.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ADR_DIR = ROOT / "docs" / "adr"
TEMPLATE = Path(__file__).resolve().parents[1] / "templates" / "adr.md"
INDEX = ADR_DIR / "README.md"
FILENAME = re.compile(r"^(\d{4})-[a-z0-9-]+\.md$")


def slugify(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", ascii_only)).strip("-")


def existing() -> dict[int, Path]:
    return {
        int(m.group(1)): path
        for path in ADR_DIR.glob("*.md")
        if (m := FILENAME.match(path.name))
    }


def ever_used() -> set[int]:
    """Os números que já existiram, inclusive os de ADRs que saíram para o git."""
    log = subprocess.run(
        ["git", "log", "--all", "--format=", "--name-only", "--", "docs/adr/"],
        cwd=ROOT, capture_output=True, text=True, check=False,
    ).stdout
    return {int(m.group(1)) for line in log.splitlines() if (m := FILENAME.match(Path(line).name))}


def field(text: str, key: str) -> str:
    m = re.search(rf"^{key}:\s*(.*)$", text, re.MULTILINE)
    return m.group(1).strip() if m else ""


def set_field(text: str, key: str, value: str) -> str:
    return re.sub(rf"^{key}:.*$", f"{key}: {value}", text, count=1, flags=re.MULTILINE)


def main() -> int:
    parser = argparse.ArgumentParser(description="Aloca o próximo ADR.")
    parser.add_argument("title", help="título da decisão")
    parser.add_argument("--supersedes", help="números dos ADRs que este substitui (ex.: 0003,0007)")
    parser.add_argument("--status", default="proposed", help="status inicial (padrão: proposed)")
    args = parser.parse_args()

    adrs = existing()
    # Número de ADR que saiu não volta: o git ainda o guarda com outro conteúdo.
    number = max(set(adrs) | ever_used(), default=0) + 1
    slug = slugify(args.title)
    if not slug:
        print("título não produz slug utilizável", file=sys.stderr)
        return 1
    path = ADR_DIR / f"{number:04d}-{slug}.md"
    today = dt.date.today().isoformat()

    body = TEMPLATE.read_text(encoding="utf-8")
    body = body.replace("NNNN", f"{number:04d}").replace("TITLE", args.title).replace("DATE", today)
    body = set_field(body, "status", args.status)

    if args.supersedes:
        old_numbers = [int(v) for v in args.supersedes.split(",")]
        for old_number in old_numbers:
            if old_number not in adrs:
                print(f"ADR-{old_number:04d} não existe", file=sys.stderr)
                return 1
        body = set_field(body, "supersedes", ", ".join(f"{n:04d}" for n in old_numbers))
        for old_number in old_numbers:
            # O substituído sai da árvore e fica no histórico do git.
            adrs.pop(old_number).unlink()
            print(f"ADR-{old_number:04d} removido, substituído por ADR-{number:04d}")

    path.write_text(body, encoding="utf-8")

    # O índice é conferido pela C16 como ponto fixo: linha por arquivo, e nada além.
    index = INDEX.read_text(encoding="utf-8").rstrip("\n").splitlines()
    rows = []
    for n, p in sorted({**adrs, number: path}.items()):
        text = p.read_text(encoding="utf-8")
        rows.append(
            f"| [ADR-{n:04d}]({p.name}) | {field(text, 'title')} "
            f"| {field(text, 'status')} | {field(text, 'date')} |"
        )
    head = index[: index.index("|---|---|---|---|") + 1]
    INDEX.write_text("\n".join(head + rows) + "\n", encoding="utf-8")

    print(f"criado: {path.relative_to(ROOT)}")
    print("as seções vêm em branco — Alternativas consideradas é a que torna a decisão reversível")
    return 0


if __name__ == "__main__":
    sys.exit(main())
