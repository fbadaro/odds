#!/usr/bin/env python3
"""Checagens da especificação ODDS.

Confere o que é mecanicamente verificável nos documentos normativos, nos golden
files, em `docs/adr/` e no `CHANGELOG.md`, e reporta. Não julga.

Uso:
    npm run check:spec                  # relatório compacto
    python3 scripts/check_spec.py -v    # detalha o que passou
    python3 scripts/check_spec.py --json
    python3 scripts/check_spec.py --only C17

Saída 0 = tudo conforme. Saída 1 = ao menos uma checagem falhou.
Sem dependências além da stdlib.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Documentos que devem citar todo code do catálogo.
CODE_ARTIFACTS = ("MESSAGES.md", "RULES-EN.md", "RULES-PT.md")

# Termos que saíram da linguagem e não podem voltar a um documento normativo.
# O `CHANGELOG.md` pode citá-los: é ali que se conta que eles existiram.
DEAD_TERMS = (
    "ExternalContextNode",
    "CONFORMIST_CORE_WARNING",
    "GENERIC_WITHOUT_OHS_WARNING",
    "EXCESSIVE_SHARED_KERNEL_WARNING",
    "UNDOCUMENTED_CONTRACT_WARNING",
)
NORMATIVE_DOCS = (
    "AST_SCHEMA.md",
    "GRAMMAR.md",
    "RULES-EN.md",
    "RULES-PT.md",
    "MESSAGES.md",
    "TEST_SUITE.md",
    "PRD.md",
)


@dataclass
class Check:
    id: str
    title: str
    ok: bool = True
    summary: str = ""
    details: list[str] = field(default_factory=list)

    def fail(self, summary: str, details: list[str] | None = None) -> "Check":
        self.ok = False
        self.summary = summary
        self.details = details or []
        return self

    def passed(self, summary: str, details: list[str] | None = None) -> "Check":
        self.ok = True
        self.summary = summary
        self.details = details or []
        return self


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


# --------------------------------------------------------------------------
# Catálogo de codes
# --------------------------------------------------------------------------

CODE_ROW = re.compile(r"^\|\s*`([A-Z_]+)`\s*\|([^|]*)\|([^|]*)\|([^|]*)\|")


def parse_catalogue() -> dict[str, dict[str, str]]:
    """Codes de AST_SCHEMA.md §1.3, com fase, severidade e chaves de `data`."""
    catalogue: dict[str, dict[str, str]] = {}
    for line in read("AST_SCHEMA.md").splitlines():
        m = CODE_ROW.match(line)
        if m:
            code, phase, severity, keys = (g.strip() for g in m.groups())
            catalogue[code] = {
                "phase": phase.strip("` "),
                "severity": severity.strip("` "),
                "data": keys,
            }
    return catalogue


def check_catalogue(catalogue: dict[str, dict[str, str]]) -> Check:
    c = Check("C1", "catálogo de codes (AST_SCHEMA §1.3)")
    if not catalogue:
        return c.fail("nenhum code encontrado — o formato da tabela §1.3 mudou?")
    missing = [
        code
        for code, meta in catalogue.items()
        if not re.fullmatch(r"\d+", meta["phase"]) or not meta["severity"]
    ]
    if missing:
        return c.fail(
            f"{len(missing)} code(s) sem fase ou severidade",
            [f"{code}: fase={catalogue[code]['phase']!r}" for code in missing],
        )
    phases: dict[str, int] = {}
    for meta in catalogue.values():
        phases[meta["phase"]] = phases.get(meta["phase"], 0) + 1
    return c.passed(
        f"{len(catalogue)} codes, todos com fase e severidade",
        [f"fase {phase}: {count} code(s)" for phase, count in sorted(phases.items())],
    )


def check_cross_reference(catalogue: dict[str, dict[str, str]]) -> Check:
    c = Check("C2", "presença cruzada nos artefatos normativos")
    gaps: list[str] = []
    for doc in CODE_ARTIFACTS:
        present = set(re.findall(r"[A-Z_]{4,}", read(doc)))
        for code in sorted(set(catalogue) - present):
            gaps.append(f"{code} ausente em {doc}")
    if gaps:
        return c.fail(f"{len(gaps)} ausência(s)", gaps)
    return c.passed(
        f"todo code citado em {', '.join(CODE_ARTIFACTS)}",
        [f"{len(catalogue)} codes conferidos em {doc}" for doc in CODE_ARTIFACTS],
    )


def check_golden_coverage(catalogue: dict[str, dict[str, str]]) -> Check:
    c = Check("C3", "cobertura da suíte por code")
    golden = ROOT / "golden-files"
    dirs = sorted(p.name for p in golden.iterdir() if p.is_dir())
    uncovered = [
        code
        for code in sorted(catalogue)
        if not any(d.startswith(code.lower().replace("_", "-")) for d in dirs)
    ]
    if uncovered:
        return c.fail(f"{len(uncovered)} code(s) sem golden file", uncovered)
    return c.passed(
        f"{len(dirs)} casos cobrindo os {len(catalogue)} codes",
        [f"{len(dirs) - len(catalogue)} caso(s) auxiliares além de um por code"],
    )


def check_golden_integrity() -> Check:
    c = Check("C4", "integridade dos golden files")
    problems: list[str] = []
    for d in sorted((ROOT / "golden-files").iterdir()):
        if not d.is_dir():
            continue
        for required in ("input.odds", "expected.json"):
            if not (d / required).is_file():
                problems.append(f"{d.name}: falta {required}")
        expected = d / "expected.json"
        if expected.is_file():
            try:
                json.loads(expected.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                problems.append(f"{d.name}: expected.json inválido ({exc.msg} @ linha {exc.lineno})")
    if problems:
        return c.fail(f"{len(problems)} problema(s)", problems)
    cases = sum(1 for d in (ROOT / "golden-files").iterdir() if d.is_dir())
    return c.passed(
        "todo caso com input.odds + expected.json válido",
        [f"{cases} diretórios, {cases * 2} arquivos conferidos"],
    )


# --------------------------------------------------------------------------
# Língua ubíqua
# --------------------------------------------------------------------------


def check_translation_parity() -> Check:
    c = Check("C5", "paridade estrutural RULES-EN / RULES-PT")
    heading = re.compile(r"^#{2,3} ")
    en_text, pt_text = read("RULES-EN.md"), read("RULES-PT.md")
    en = [ln for ln in en_text.splitlines() if heading.match(ln)]
    pt = [ln for ln in pt_text.splitlines() if heading.match(ln)]
    problems: list[str] = []
    if len(en) != len(pt):
        problems.append(f"contagem de seções divergente: EN={len(en)}, PT={len(pt)}")
    en_codes = set(re.findall(r"[A-Z_]{4,}", en_text))
    pt_codes = set(re.findall(r"[A-Z_]{4,}", pt_text))
    for code in sorted(en_codes - pt_codes):
        problems.append(f"{code} citado no EN e ausente no PT")
    for code in sorted(pt_codes - en_codes):
        problems.append(f"{code} citado no PT e ausente no EN")
    if problems:
        problems.append("as duas traduções mudam juntas, no mesmo passe")
        return c.fail(f"{len(problems) - 1} divergência(s)", problems)
    return c.passed(
        f"{len(en)} seções e {len(en_codes)} termos maiúsculos em cada arquivo",
        [f"RULES-EN: {len(en)} seções", f"RULES-PT: {len(pt)} seções"],
    )


def check_removed_constructs() -> Check:
    c = Check("C6", "construtos removidos não voltaram como construto vivo")
    problems: list[str] = []

    for input_file in sorted((ROOT / "golden-files").glob("*/input.odds")):
        if input_file.parent.name == "removed-construct-sw":
            continue
        if "[SW]" in input_file.read_text(encoding="utf-8"):
            problems.append(f"tag [SW] viva em golden-files/{input_file.parent.name}/input.odds")

    for hit in re.findall(r"[A-Z_]+_WARNING", read("AST_SCHEMA.md")):
        problems.append(f"severidade no nome do code: {hit} em AST_SCHEMA.md")

    for expected in sorted((ROOT / "golden-files").glob("*/expected.json")):
        text = expected.read_text(encoding="utf-8")
        for hit in set(re.findall(r"[A-Z_]+_WARNING", text)):
            problems.append(f"severidade no nome do code: {hit} em {expected.parent.name}")
        if '"message"' in text:
            problems.append(f"`message` de volta no contrato: {expected.parent.name}/expected.json")

    if re.search(r"^\s*message\??:", read("AST_SCHEMA.md"), re.MULTILINE):
        problems.append("`message` de volta na interface Diagnostic (AST_SCHEMA.md)")

    if problems:
        return c.fail(f"{len(problems)} reintrodução(ões)", problems)
    return c.passed(
        "[SW], sufixo _WARNING e `message` seguem fora da linguagem",
        [
            "tag [SW] viva: só em removed-construct-sw, onde é o caso de teste",
            "sufixo _WARNING em code: ausente do catálogo e dos expected.json",
            "`message`: fora do contrato Diagnostic e dos expected.json",
        ],
    )


def check_dead_terms() -> Check:
    c = Check("C7", "vocabulário morto fora dos documentos normativos")
    problems: list[str] = []
    for doc in NORMATIVE_DOCS:
        text = read(doc)
        for term in DEAD_TERMS:
            hits = text.count(term)
            if hits:
                problems.append(f"{term} × {hits} em {doc}")
    if problems:
        return c.fail(f"{len(problems)} termo(s) mortos em documento normativo", problems)
    return c.passed(
        f"{len(DEAD_TERMS)} termos mortos ausentes dos {len(NORMATIVE_DOCS)} normativos",
        [f"varrido: {term}" for term in DEAD_TERMS],
    )


# --------------------------------------------------------------------------
# Templates de mensagem
# --------------------------------------------------------------------------

TEMPLATE_ROW = re.compile(r"^\|\s*`([A-Z_]+)`\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$")
PLACEHOLDER = re.compile(r"\{(\w+)\}")


def check_message_templates(catalogue: dict[str, dict[str, str]]) -> Check:
    """A regra de integridade que `MESSAGES.md` §1 declara verificável por script.

    Todo placeholder de um template precisa existir nas chaves de `data` do code,
    e vice-versa, nos dois idiomas. A chave seletora de variante conta como usada.
    """
    c = Check("C10", "placeholders dos templates × chaves de `data`")
    problems: list[str] = []
    used: dict[str, set[str]] = {}
    seen: set[str] = set()

    for line in read("MESSAGES.md").splitlines():
        m = TEMPLATE_ROW.match(line)
        if not m:
            continue
        code, variant, en, pt = m.groups()
        if code not in catalogue:
            problems.append(f"{code}: template para code fora do catálogo §1.3")
            continue
        seen.add(code)
        en_keys, pt_keys = set(PLACEHOLDER.findall(en)), set(PLACEHOLDER.findall(pt))
        if en_keys != pt_keys:
            problems.append(
                f"{code}: placeholders divergentes entre idiomas "
                f"(EN {sorted(en_keys) or '—'}, PT {sorted(pt_keys) or '—'})"
            )
        selector = set(re.findall(r"(\w+)\s*:", variant))
        used.setdefault(code, set()).update(en_keys | pt_keys | selector)

    for code in sorted(set(catalogue) - seen):
        problems.append(f"{code}: sem template em MESSAGES.md")

    for code, keys in sorted(used.items()):
        declared = set(re.findall(r"`(\w+)`", catalogue[code]["data"]))
        for extra in sorted(keys - declared):
            problems.append(f"{code}: template interpola `{extra}`, que não está em `data`")
        for unused in sorted(declared - keys):
            problems.append(f"{code}: `data` carrega `{unused}`, que nenhum template usa")

    if problems:
        return c.fail(f"{len(problems)} inconsistência(s)", problems)
    return c.passed(
        f"{len(seen)} codes com template, placeholders conferem nos dois idiomas",
        [f"{sum(len(v) for v in used.values())} chaves de `data` cruzadas com os templates"],
    )


# --------------------------------------------------------------------------
# Razão de decisões
# --------------------------------------------------------------------------

# Num texto, um arquivo `X.md` ou uma seção `§N`. Uma seção vale para o arquivo
# imediatamente anterior — ou para o par, quando dois vêm colados por `/`
# (`RULES-EN.md`/`RULES-PT.md` §4). Arquivos separados por ` · ` são citações distintas.
CITATION = re.compile(r"`([A-Za-z_-]+\.md)`|§(\d+(?:\.\d+)*)")

# Nomes que um ADR cita como convenção de ferramenta, não como arquivo do
# repositório: o `CLAUDE.md` é o que o Claude Code lê, e o ADR-0022 decide não tê-lo.
CONVENTIONS = ("CLAUDE.md",)

ADR_FILENAME = re.compile(r"^(\d{4})-[a-z0-9-]+\.md$")
ADR_STATUSES = ("proposed", "accepted")
ADR_SECTIONS = ("Contexto", "Decisão", "Alternativas consideradas")
ADR_FIELDS = ("adr", "title", "status", "date", "supersedes")
ADR_INDEX_ROW = re.compile(r"^\|\s*\[ADR-(\d{4})\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|")
EMPTY = ("—", "-", "")


def adr_field(text: str, key: str) -> str:
    m = re.search(rf"^{re.escape(key)}:\s*(.*)$", text, re.MULTILINE)
    return m.group(1).strip() if m else ""


def has_heading(doc: str, section: str) -> bool:
    """A seção existe como cabeçalho? Aceita `### 4.6.` e `### 0.5` para §4.6/§0.5."""
    pattern = re.compile(r"^#{1,6} " + re.escape(section) + r"\.?(\s|$)", re.MULTILINE)
    return bool(pattern.search(read(doc)))


def check_decision_ledger() -> Check:
    """`docs/adr/` guarda só as decisões em vigor.

    Um ADR substituído ou encerrado sai da árvore e fica no histórico do git, então
    a numeração tem buracos e nenhum ADR presente é `superseded`. O razão apodrece
    em silêncio de outras formas: um número repetido, um `supersedes` que aponta
    para um ADR ainda presente, um índice que para de bater com os arquivos, e uma
    citação a um arquivo ou seção que não existe mais.
    """
    c = Check("C16", "razão de decisões (docs/adr/)")
    adr_dir = ROOT / "docs" / "adr"
    if not adr_dir.is_dir():
        return c.fail("docs/adr/ não existe")

    problems: list[str] = []
    files: dict[int, Path] = {}
    for path in sorted(adr_dir.glob("*.md")):
        if not (m := ADR_FILENAME.match(path.name)):
            continue
        n = int(m.group(1))
        if n in files:
            problems.append(f"ADR-{n:04d}: número repetido em {files[n].name} e {path.name}")
        files[n] = path

    texts = {n: path.read_text(encoding="utf-8") for n, path in files.items()}
    for n, text in sorted(texts.items()):
        name = files[n].name
        for key in ADR_FIELDS:
            if not re.search(rf"^{re.escape(key)}:", text, re.MULTILINE):
                problems.append(f"{name}: frontmatter sem `{key}`")
        if adr_field(text, "adr") != f"{n:04d}":
            problems.append(f"{name}: campo `adr: {adr_field(text, 'adr')}` diverge do nome do arquivo")
        status = adr_field(text, "status")
        if status not in ADR_STATUSES:
            problems.append(f"{name}: status `{status}` fora de {'/'.join(ADR_STATUSES)} — ADR encerrado sai da árvore")
        for section in ADR_SECTIONS:
            if not re.search(rf"^## {re.escape(section)}\s*$", text, re.MULTILINE):
                problems.append(f"{name}: sem a seção `## {section}`")
        body = text.split("---", 2)[-1]
        if re.search(r"^## Alternativas consideradas\s*$\n+(?=## |\Z)", body, re.MULTILINE):
            problems.append(f"{name}: `Alternativas consideradas` vazia — afirma que não havia escolha")

        supersedes = adr_field(text, "supersedes")
        if supersedes not in EMPTY:
            for value in (v.strip() for v in supersedes.split(",")):
                if not re.fullmatch(r"\d{4}", value):
                    problems.append(f"{name}: `supersedes: {supersedes}` fora do formato NNNN, NNNN")
                elif int(value) >= n:
                    problems.append(f"{name}: substitui o ADR-{value}, que não é anterior a ele")
                elif int(value) in files:
                    problems.append(f"{name}: substitui o ADR-{value}, que segue na árvore")

        group: list[str] = []
        previous_end: int | None = None
        for m in CITATION.finditer(text):
            doc, section = m.group(1), m.group(2)
            if doc:
                glued = previous_end is not None and text[previous_end:m.start()] == "/"
                group = group + [doc] if glued else [doc]
                previous_end = m.end()
                if doc not in CONVENTIONS and not (ROOT / doc).is_file():
                    problems.append(f"{name}: cita `{doc}`, que não existe no repositório")
                continue
            for target in group:
                if (ROOT / target).is_file() and not has_heading(target, section):
                    problems.append(f"{name}: `{target}` §{section} não corresponde a nenhum cabeçalho")

    index_path = adr_dir / "README.md"
    if not index_path.is_file():
        problems.append("docs/adr/README.md não existe — o índice é a porta de entrada do razão")
    else:
        indexed = {int(m.group(1)): (m.group(2), m.group(3), m.group(4))
                   for line in index_path.read_text(encoding="utf-8").splitlines()
                   if (m := ADR_INDEX_ROW.match(line))}
        for n in sorted(set(files) - set(indexed)):
            problems.append(f"ADR-{n:04d}: existe como arquivo e falta no índice do README")
        for n in sorted(set(indexed) - set(files)):
            problems.append(f"ADR-{n:04d}: no índice do README mas não existe como arquivo")
        for n in sorted(set(files) & set(indexed)):
            link, title, status = indexed[n]
            if link != files[n].name:
                problems.append(f"ADR-{n:04d}: índice aponta para `{link}`, arquivo é `{files[n].name}`")
            for label, shown, real in (("título", title, adr_field(texts[n], "title")),
                                       ("status", status, adr_field(texts[n], "status"))):
                if shown != real:
                    problems.append(f"ADR-{n:04d}: {label} no índice (`{shown}`) diverge do arquivo (`{real}`)")

    if problems:
        return c.fail(f"{len(problems)} problema(s)", problems)
    return c.passed(
        f"{len(files)} ADRs em vigor, índice conferido",
        [f"ADR-{n:04d} · {adr_field(t, 'status')} · {adr_field(t, 'title')}" for n, t in sorted(texts.items())],
    )


# --------------------------------------------------------------------------
# C17 — a ODDS Language Version acompanha a superfície da linguagem
# --------------------------------------------------------------------------

# O que um `.odds` significa, na parte que se lê sem interpretar prosa, e o
# incremento mínimo que mudar cada parte exige. A prosa das regras fica de fora:
# uma mudança de gatilho que não toca catálogo nem golden file passa por aqui.
PATCH, MINOR, MAJOR = 0, 1, 2
LEVELS = ("PATCH", "MINOR", "MAJOR")
EBNF_BLOCK = re.compile(r"^```ebnf\n(.*?)^```", re.M | re.S)
MESSAGE_ROW = re.compile(r"^\|\s*`[A-Z_]+`\s*\|.*$", re.M)
CURRENT_VERSION = re.compile(r"Versão atual: \*\*v(\d+)\.(\d+)\.(\d+)\*\*")


def git(*args: str) -> str | None:
    try:
        r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    except OSError:
        return None
    return r.stdout if r.returncode == 0 else None


def language_surface(doc: str, text: str) -> list[str]:
    if doc == "GRAMMAR.md":
        blocks = EBNF_BLOCK.findall(text)
    elif doc == "AST_SCHEMA.md":
        blocks = [line for line in text.splitlines() if CODE_ROW.match(line)]
    else:
        blocks = MESSAGE_ROW.findall(text)
    return [" ".join(b.split()) for b in blocks]


SURFACE = (
    ("GRAMMAR.md", "a EBNF", MINOR),
    ("AST_SCHEMA.md", "o catálogo §1.3", MINOR),
    ("MESSAGES.md", "as tabelas de mensagem", PATCH),
)


def check_language_version() -> Check:
    c = Check("C17", "versão da linguagem (CHANGELOG.md)")
    base = next(
        (b.strip() for ref in ("main", "origin/main") if (b := git("merge-base", "HEAD", ref))),
        None,
    )
    if not base:
        return c.passed("sem main para comparar; nada conferido")

    changed: list[tuple[str, int]] = []
    for doc, what, floor in SURFACE:
        before = git("show", f"{base}:{doc}")
        if before is not None and language_surface(doc, before) != language_surface(doc, read(doc)):
            changed.append((f"{what} ({doc})", floor))
    goldens = (git("diff", "--name-only", "--diff-filter=MD", base, "--", "golden-files/") or "").split()
    if goldens:
        changed.append((f"{len(goldens)} golden file(s) existente(s)", MINOR))

    old = CURRENT_VERSION.search(git("show", f"{base}:CHANGELOG.md") or "")
    new = CURRENT_VERSION.search(read("CHANGELOG.md"))
    if not new:
        return c.fail("CHANGELOG.md sem a linha 'Versão atual: **vX.Y.Z**'")
    current = tuple(int(n) for n in new.groups())
    version = "v" + ".".join(map(str, current))
    previous = tuple(int(n) for n in old.groups()) if old else current

    if current < previous:
        return c.fail(f"a versão recuou de v{'.'.join(map(str, previous))} para {version}")
    if current != previous and not re.search(rf"^- \*\*{re.escape(version)}\*\*", read("CHANGELOG.md"), re.M):
        return c.fail(f"{version} é a versão atual, mas não tem entrada '- **{version}** — …'")
    if not changed:
        return c.passed(f"superfície da linguagem igual à de main; {version}")

    floor = max(level for _, level in changed)
    details = [f"mudou {what}: pede ao menos {LEVELS[level]}" for what, level in changed]
    if current == previous:
        return c.fail(
            f"a superfície da linguagem mudou e a versão segue {version}; "
            f"acrescente uma entrada em ODDS Language Version (ao menos {LEVELS[floor]})",
            details,
        )
    bump = next(i for i in (MAJOR, MINOR, PATCH) if current[MAJOR - i] != previous[MAJOR - i])
    if bump < floor:
        return c.fail(f"{version} é {LEVELS[bump]}, mas a mudança pede ao menos {LEVELS[floor]}", details)
    return c.passed(f"a superfície mudou e {version} registra a mudança ({LEVELS[bump]})", details)


# --------------------------------------------------------------------------
# Relatório
# --------------------------------------------------------------------------


def run() -> list[Check]:
    catalogue = parse_catalogue()
    return [
        check_catalogue(catalogue),
        check_cross_reference(catalogue),
        check_golden_coverage(catalogue),
        check_golden_integrity(),
        check_translation_parity(),
        check_removed_constructs(),
        check_dead_terms(),
        check_message_templates(catalogue),
        check_decision_ledger(),
        check_language_version(),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Checagens da especificação ODDS.")
    parser.add_argument("-v", "--verbose", action="store_true", help="detalhar também o que passou")
    parser.add_argument("--json", action="store_true", help="saída estruturada")
    parser.add_argument("--only", metavar="ID", help="rodar só uma checagem, como C17")
    args = parser.parse_args()

    checks = [c for c in run() if not args.only or c.id == args.only]
    failures = [c for c in checks if not c.ok]

    if args.json:
        print(json.dumps({"ok": not failures, "checks": [vars(c) for c in checks]}, ensure_ascii=False, indent=2))
        return 1 if failures else 0

    for c in checks:
        mark = "OK" if c.ok else "FALHA"
        print(f"  {mark:<5} {c.id:<3} · {c.title}: {c.summary}")
        if c.details and (args.verbose or not c.ok):
            for detail in c.details:
                print(f"        - {detail}")
    print()
    print(f"{len(checks) - len(failures)} de {len(checks)} conformes")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
