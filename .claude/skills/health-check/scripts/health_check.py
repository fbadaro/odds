#!/usr/bin/env python3
"""Aferição de saúde do modelo ODDS.

Roda as checagens determinísticas do `HEALTH.md` §8 e verifica a aritmética do
placar. Não julga: só afere o que é mecanicamente verificável e reporta.

Uso:
    python3 .claude/skills/health-check/scripts/health_check.py          # relatório compacto
    python3 .claude/skills/health-check/scripts/health_check.py -v       # detalha o que passou
    python3 .claude/skills/health-check/scripts/health_check.py --json   # saída estruturada

Saída 0 = tudo conforme. Saída 1 = ao menos uma checagem falhou.
Sem dependências além da stdlib.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]  # .../.claude/skills/health-check/scripts/ → raiz do repo

# Documentos que devem citar todo code do catálogo.
CODE_ARTIFACTS = ("MESSAGES.md", "RULES-EN.md", "RULES-PT.md")

# Termos que saíram da linguagem e não podem voltar a um documento normativo.
# `GRILLING.md` é isento por ser registro histórico — a divergência de
# vocabulário dele é o débito D-006, não uma falha nova a cada rodada.
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
    dimension: int
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


def to_number(cell: str) -> float:
    """Aceita '−8', '-8', '23,00' e '**100**'."""
    cleaned = cell.replace("−", "-").replace("*", "").replace(",", ".").strip()
    cleaned = cleaned.replace("—", "").strip()
    return float(cleaned) if cleaned else 0.0


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
    c = Check("C1", 1, "catálogo de codes (AST_SCHEMA §1.3)")
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
    c = Check("C2", 1, "presença cruzada nos artefatos normativos")
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
    c = Check("C3", 4, "cobertura da suíte por code")
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
    c = Check("C4", 4, "integridade dos golden files")
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
    c = Check("C5", 2, "paridade estrutural RULES-EN / RULES-PT")
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
        problems.append("as duas traduções versionam juntas — editar uma sem a outra é penalização")
        return c.fail(f"{len(problems) - 1} divergência(s)", problems)
    return c.passed(
        f"{len(en)} seções e {len(en_codes)} termos maiúsculos em cada arquivo",
        [f"RULES-EN: {len(en)} seções", f"RULES-PT: {len(pt)} seções"],
    )


def check_removed_constructs() -> Check:
    c = Check("C6", 2, "construtos removidos não voltaram como construto vivo")
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
    c = Check("C7", 2, "vocabulário morto fora dos documentos normativos")
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
    c = Check("C10", 1, "placeholders dos templates × chaves de `data`")
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
# Placar
# --------------------------------------------------------------------------

SCORE_ROW = re.compile(
    r"^\|\s*(\d)\s*\|\s*([^|]+?)\s*\|\s*(Integridade|Construção)\s*\|"
    r"\s*([\d]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|"
)
DEBT_ROW = re.compile(r"^\|\s*\*\*(D-\d+)\*\*\s*\|\s*(\d)[^|]*\|[^|]*\|\s*([^|]+?)\s*\|")
HEADLINE = re.compile(r"^## 2\. Placar atual — \*\*(\d+) ?/ ?100\*\*")


def parse_health() -> tuple[list[dict], dict[str, dict], int | None]:
    text = read("HEALTH.md")
    rows: list[dict] = []
    for line in text.splitlines():
        m = SCORE_ROW.match(line)
        if m:
            rows.append(
                {
                    "n": int(m.group(1)),
                    "name": m.group(2),
                    "nature": m.group(3),
                    "weight": int(m.group(4)),
                    "base": to_number(m.group(5)),
                    "debts": to_number(m.group(6)),
                    "score": to_number(m.group(7)),
                    "contribution": to_number(m.group(8)),
                }
            )
    debts: dict[str, dict] = {}
    for line in text.splitlines():
        m = DEBT_ROW.match(line)
        if m:
            debts[m.group(1)] = {"dimension": int(m.group(2)), "cost": to_number(m.group(3))}
    headline = None
    for line in text.splitlines():
        m = HEADLINE.match(line)
        if m:
            headline = int(m.group(1))
    return rows, debts, headline


def check_scoreboard(rows: list[dict], headline: int | None) -> Check:
    c = Check("C8", 1, "aritmética do placar (HEALTH.md §2)")
    if len(rows) != 6:
        return c.fail(f"{len(rows)} dimensões parseadas, esperava 6 — formato da tabela §2 mudou?")
    problems: list[str] = []

    total_weight = sum(r["weight"] for r in rows)
    if total_weight != 100:
        problems.append(f"soma dos pesos = {total_weight}, deveria ser 100")

    for r in rows:
        if r["nature"] == "Integridade" and r["base"] != 100:
            problems.append(f"dim {r['n']}: dimensão de integridade com base {r['base']:g}, deveria ser 100")
        expected_score = r["base"] + r["debts"]
        if abs(expected_score - r["score"]) > 1e-9:
            problems.append(
                f"dim {r['n']}: nota {r['score']:g} ≠ base {r['base']:g} + débitos {r['debts']:g} = {expected_score:g}"
            )
        expected_contribution = r["weight"] * r["score"] / 100
        if abs(expected_contribution - r["contribution"]) > 0.005:
            problems.append(
                f"dim {r['n']}: contribuição {r['contribution']:.2f} ≠ {r['weight']}×{r['score']:g}/100 = {expected_contribution:.2f}"
            )
        if not 0 <= r["score"] <= 100:
            problems.append(f"dim {r['n']}: nota {r['score']:g} fora de 0–100")

    total = sum(r["contribution"] for r in rows)
    if headline is None:
        problems.append("título da §2 não traz o total — formato mudou?")
    elif round(total) != headline:
        problems.append(f"título da §2 diz {headline}, aritmética dá {total:.2f} → {round(total)}")

    if problems:
        return c.fail(f"{len(problems)} inconsistência(s)", problems)
    return c.passed(
        f"total {total:.2f} → {headline}/100, seis dimensões conferem",
        [
            f"dim {r['n']} {r['name']}: base {r['base']:g} {r['debts']:+g} = {r['score']:g}"
            f" × peso {r['weight']} → {r['contribution']:.2f}"
            for r in rows
        ],
    )


RUBRIC_ROW = re.compile(
    r"^\|\s*\*\*R(\d)\.\d+\*\*[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|"
)


def parse_rubrics() -> dict[int, list[tuple[int, int]]]:
    """Critérios da §9, agrupados por dimensão: [(máximo, nota), ...]."""
    rubrics: dict[int, list[tuple[int, int]]] = {}
    for line in read("HEALTH.md").splitlines():
        m = RUBRIC_ROW.match(line)
        if m:
            dimension, maximum, score = (int(g) for g in m.groups())
            rubrics.setdefault(dimension, []).append((maximum, score))
    return rubrics


def check_rubrics(rows: list[dict], rubrics: dict[int, list[tuple[int, int]]]) -> Check:
    """As dimensões julgadas por modelo têm de fechar contra a base da §2.

    É o que separa julgamento de arbítrio: o modelo não escolhe um número, ele
    aloca pontos em critérios nomeados, e a soma precisa bater com a base.
    """
    c = Check("C11", 1, "rubricas das dimensões de julgamento (HEALTH.md §9)")
    if not rubrics:
        return c.fail("nenhuma rubrica parseada — formato da §9 mudou?")
    problems: list[str] = []
    by_dimension = {r["n"]: r for r in rows}

    for dimension, criteria in sorted(rubrics.items()):
        total_max = sum(m for m, _ in criteria)
        if total_max != 100:
            problems.append(f"dim {dimension}: máximos somam {total_max}, deveriam somar 100")
        for index, (maximum, score) in enumerate(criteria, start=1):
            if not 0 <= score <= maximum:
                problems.append(f"dim {dimension}, critério {index}: nota {score} fora de 0–{maximum}")
        total = sum(s for _, s in criteria)
        row = by_dimension.get(dimension)
        if row is None:
            problems.append(f"dim {dimension}: rubrica sem dimensão correspondente na §2")
        elif abs(total - row["base"]) > 1e-9:
            problems.append(
                f"dim {dimension}: rubrica soma {total}, §2 declara base {row['base']:g}"
            )
        elif row["nature"] != "Construção":
            problems.append(f"dim {dimension}: rubrica numa dimensão de {row['nature'].lower()}")

    if problems:
        return c.fail(f"{len(problems)} inconsistência(s)", problems)
    covered = ", ".join(str(d) for d in sorted(rubrics))
    return c.passed(
        f"dimensões {covered} com base alocada por critério, somando 100 cada",
        [
            f"dim {d}: {len(criteria)} critérios, soma {sum(s for _, s in criteria)}"
            f" de {sum(m for m, _ in criteria)} possíveis"
            for d, criteria in sorted(rubrics.items())
        ],
    )


HISTORY_ROW = re.compile(r"^\|\s*(\d{4}-\d{2}-\d{2})\s*\|.*\|\s*$")


def parse_history() -> list[tuple[str, str]]:
    """Linhas da §7: (data, último campo da linha, que é o total)."""
    entries: list[tuple[str, str]] = []
    for line in read("HEALTH.md").splitlines():
        m = HISTORY_ROW.match(line)
        if m:
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            entries.append((m.group(1), cells[-1]))
    return entries


def check_history(history: list[tuple[str, str]], headline: int | None) -> Check:
    """O razão da §7 é o que sustenta o placar — se ele não fecha, o placar não tem origem."""
    c = Check("C12", 1, "razão do histórico (HEALTH.md §7)")
    if not history:
        return c.fail("nenhuma linha de histórico parseada — formato da §7 mudou?")
    problems: list[str] = []

    dates = [date for date, _ in history]
    for previous, current in zip(dates, dates[1:]):
        if current < previous:
            problems.append(f"fora de ordem cronológica: {previous} vem antes de {current}")

    last_date, last_total = history[-1]
    try:
        total = int(to_number(last_total))
    except ValueError:
        problems.append(f"último total ilegível: {last_total!r}")
    else:
        if headline is not None and total != headline:
            problems.append(
                f"último total do histórico é {total} ({last_date}), mas a §2 declara {headline} — "
                "linha inserida fora de ordem, ou placar movido sem registro"
            )

    if problems:
        return c.fail(f"{len(problems)} inconsistência(s)", problems)
    return c.passed(
        f"{len(history)} linhas em ordem, última fecha em {headline}",
        [f"{date}: {to_number(total):g}" for date, total in history],
    )


def check_debt_ledger(rows: list[dict], debts: dict[str, dict]) -> Check:
    c = Check("C9", 1, "débitos da §5 batem com a coluna de débitos da §2")
    if not debts:
        return c.fail("nenhum débito parseado — formato da tabela §5 mudou?")
    problems: list[str] = []
    by_dimension: dict[int, float] = {}
    for debt in debts.values():
        by_dimension[debt["dimension"]] = by_dimension.get(debt["dimension"], 0.0) + debt["cost"]
    for r in rows:
        declared = r["debts"]
        ledger = by_dimension.get(r["n"], 0.0)
        if abs(declared - ledger) > 1e-9:
            problems.append(
                f"dim {r['n']}: §2 declara {declared:g} de débito, §5 soma {ledger:g}"
            )
    if problems:
        return c.fail(f"{len(problems)} divergência(s)", problems)
    return c.passed(
        f"{len(debts)} débitos abertos, {sum(d['cost'] for d in debts.values()):g} no total",
        [f"{ident} → dim {d['dimension']}: {d['cost']:g}" for ident, d in sorted(debts.items())],
    )


# --------------------------------------------------------------------------
# Relatório
# --------------------------------------------------------------------------


def run() -> list[Check]:
    catalogue = parse_catalogue()
    rows, debts, headline = parse_health()
    rubrics = parse_rubrics()
    history = parse_history()
    return [
        check_catalogue(catalogue),
        check_cross_reference(catalogue),
        check_golden_coverage(catalogue),
        check_golden_integrity(),
        check_translation_parity(),
        check_removed_constructs(),
        check_dead_terms(),
        check_scoreboard(rows, headline),
        check_debt_ledger(rows, debts),
        check_message_templates(catalogue),
        check_rubrics(rows, rubrics),
        check_history(history, headline),
    ]


DOC_CHECK_ROW = re.compile(r"^\|\s*\*\*(C\d+)\*\*\s*\|\s*(\d)\s*\|")


def check_documentation(checks: list[Check]) -> Check:
    """A §8 descreve o ferramental; se ela derivar, o arquivo mente sobre a própria aferição."""
    c = Check("C13", 1, "a §8 documenta exatamente as checagens que existem")
    documented = [
        (m.group(1), int(m.group(2)))
        for m in (DOC_CHECK_ROW.match(line) for line in read("HEALTH.md").splitlines())
        if m
    ]
    real = [(x.id, x.dimension) for x in checks] + [(c.id, c.dimension)]
    problems: list[str] = []
    for ident, dimension in real:
        if (ident, dimension) not in documented:
            match = dict(documented).get(ident)
            problems.append(
                f"{ident} (dim {dimension}) "
                + (f"documentada como dim {match}" if match else "ausente da §8")
            )
    real_ids = {ident for ident, _ in real}
    for ident, _ in documented:
        if ident not in real_ids:
            problems.append(f"{ident} documentada na §8 mas não existe no script")
    if problems:
        return c.fail(f"{len(problems)} divergência(s)", problems)
    return c.passed(
        f"{len(documented)} checagens documentadas, id e dimensão conferem",
        [f"{ident} → dim {dimension}" for ident, dimension in documented],
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Aferição de saúde do modelo ODDS.")
    parser.add_argument("-v", "--verbose", action="store_true", help="detalhar também o que passou")
    parser.add_argument("--json", action="store_true", help="saída estruturada")
    args = parser.parse_args()

    checks = run()
    checks.append(check_documentation(checks))
    failures = [c for c in checks if not c.ok]
    _, _, headline = parse_health()

    if args.json:
        print(
            json.dumps(
                {
                    "ok": not failures,
                    "score": headline,
                    "failures": len(failures),
                    "checks": [
                        {
                            "id": c.id,
                            "dimension": c.dimension,
                            "title": c.title,
                            "ok": c.ok,
                            "summary": c.summary,
                            "details": c.details,
                        }
                        for c in checks
                    ],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1 if failures else 0

    print(f"ODDS health-check · placar {headline}/100")
    for c in checks:
        mark = "OK" if c.ok else "FALHA"
        print(f"  {mark:<5} {c.id:<3} · dim {c.dimension} · {c.title}: {c.summary}")
        if c.details and (args.verbose or not c.ok):
            for detail in c.details:
                print(f"        - {detail}")
    print()
    if failures:
        plural = "falha" if len(failures) == 1 else "falhas"
        print(f"{len(checks) - len(failures)} conformes · {len(failures)} {plural} — ver HEALTH.md §4 e §6")
    else:
        print(f"{len(checks)} conformes · nada a penalizar")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
