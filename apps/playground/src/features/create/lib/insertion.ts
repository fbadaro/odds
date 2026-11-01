import type { ConnectorType, MaturityValue, PatternTag, Position, ProgramNode, SourceSpan, SubdomainType } from "@odds/core";

/**
 * The one way the application writes to the text (ADR-0026): a canonical snippet,
 * inserted at the end of the parent block on an explicit command. Nothing that
 * is already there is reformatted, moved or deleted, so the place comes from the
 * spans of a tree that exists, and this module never runs on a pure SYNTAX_ERROR.
 */

export interface DomainFields {
  name: string;
  title?: string | undefined;
}
export interface SubdomainFields {
  type: SubdomainType;
  name: string;
  title?: string | undefined;
  description?: string | undefined;
  owner?: string | undefined;
}
export interface ContextFields {
  name: string;
  title?: string | undefined;
  type?: string | undefined;
  description?: string | undefined;
  responsibilities?: string[] | undefined;
  maturity?: MaturityValue | undefined;
  team?: string | undefined;
  technology?: string | undefined;
}
export interface RelationshipFields {
  left: string;
  connector: ConnectorType;
  right: string;
  leftTags: PatternTag[];
  rightTags: PatternTag[];
}

/** What to create, and under which parent. `domain` is the index in `ast.domains`; a context's `parent` is a subdomain's name, or null for `external`. */
export type CreateRequest =
  | { kind: "domain"; fields: DomainFields }
  | { kind: "subdomain"; domain: number; fields: SubdomainFields }
  | { kind: "context"; domain: number; parent: string | null; fields: ContextFields }
  | { kind: "relationship"; domain: number; fields: RelationshipFields };

export interface Insertion {
  /** Where the text goes, as an offset of the source. */
  offset: number;
  text: string;
  /** The first and last lines of the new element in the resulting text, 1-indexed. */
  lines: [number, number];
}

export function applyInsertion(source: string, ins: Insertion): string {
  return source.slice(0, ins.offset) + ins.text + source.slice(ins.offset);
}

// --- the snippets ------------------------------------------------------------

/** A single-line `string_literal`: `GRAMMAR.md` §1 escapes only `"` and `\`, and a string never crosses a line. */
const quote = (s: string) => '"' + s.replace(/[\r\n]+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const filled = (s: string | undefined): s is string => s !== undefined && s.trim() !== "";
const prop = (key: string, v: string | undefined) => (filled(v) ? [`${key}: ${quote(v.trim())}`] : []);

function block(head: string, body: string[], unit: string, bare: boolean): string[] {
  if (bare && body.length === 0) return [head];
  return [head + " {", ...body.map((l) => unit + l), "}"];
}

function domainLines(f: DomainFields, unit: string): string[] {
  return block(`domain ${f.name.trim()}`, prop("title", f.title), unit, false);
}

function subdomainLines(f: SubdomainFields, unit: string): string[] {
  const body = [...prop("title", f.title), ...prop("description", f.description), ...prop("owner", f.owner)];
  return block(`subdomain ${f.type} ${f.name.trim()}`, body, unit, false);
}

function contextLines(f: ContextFields, unit: string): string[] {
  const resp = (f.responsibilities ?? []).filter(filled).map((r) => quote(r.trim()));
  const body = [
    ...prop("title", f.title),
    ...prop("type", f.type),
    ...prop("description", f.description),
    ...(resp.length > 0 ? [`responsibilities: [${resp.join(", ")}]`] : []),
    ...(f.maturity ? [`maturity: ${f.maturity}`] : []),
    ...prop("team", f.team),
    ...prop("technology", f.technology),
  ];
  return block(`context ${f.name.trim()}`, body, unit, true);
}

function relationshipLine(f: RelationshipFields): string {
  const tags = (t: PatternTag[]) => (t.length > 0 ? ` [${t.join(", ")}]` : "");
  return `${f.left}${tags(f.leftTags)} ${f.connector}${tags(f.rightTags)} ${f.right}`;
}

// --- the place ---------------------------------------------------------------

class Source {
  readonly lines: string[];
  private readonly starts: number[] = [0];
  readonly unit: string;

  constructor(readonly text: string) {
    this.lines = text.split("\n");
    for (let i = 0; i < text.length; i++) if (text[i] === "\n") this.starts.push(i + 1);
    // the file's own step: the leading whitespace of its first indented line
    const first = this.lines.map((l) => /^([ \t]+)\S/.exec(l)).find((m) => m !== null);
    this.unit = first ? first[1]! : "  ";
  }

  offset(p: Position): number {
    return this.starts[p.line - 1]! + p.column - 1;
  }

  /** The leading whitespace of a line, 1-indexed. */
  indent(line: number): string {
    return /^[ \t]*/.exec(this.lines[line - 1] ?? "")![0];
  }
}

/** The position of a block's closing brace: `end` is exclusive. */
const closeOf = (span: SourceSpan): Position => ({ line: span.end.line, column: span.end.column - 1 });

/**
 * `body` goes right before `anchor`, at `indent`. A block of the domain's level
 * (`spaced`) keeps the file's blank line between siblings. When something shares
 * the anchor's line, the insertion opens a line of its own and gives the anchor
 * back its indentation, `trail`: nothing that was there changes.
 */
function before(src: Source, anchor: Position, body: string[], indent: string, o: { spaced: boolean; closing: boolean; trail: string }): Insertion {
  const at = src.offset(anchor);
  const lineStart = at - (anchor.column - 1);
  const lines = body.map((l) => indent + l).join("\n");
  if (src.text.slice(lineStart, at).trim() !== "") {
    return { offset: at, text: "\n" + lines + "\n" + o.trail, lines: [anchor.line + 1, anchor.line + body.length] };
  }
  const prev = anchor.line > 1 ? src.lines[anchor.line - 2]!.trim() : "";
  const blankBefore = o.spaced && prev !== "" && !prev.endsWith("{");
  const blankAfter = o.spaced && !o.closing;
  const first = anchor.line + (blankBefore ? 1 : 0);
  return {
    offset: lineStart,
    text: (blankBefore ? "\n" : "") + lines + "\n" + (blankAfter ? "\n" : ""),
    lines: [first, first + body.length - 1],
  };
}

export function planInsertion(text: string, ast: ProgramNode, req: CreateRequest): Insertion {
  const src = new Source(text);
  const { unit } = src;

  if (req.kind === "domain") {
    // after whatever the file already has (comments, blank lines): a blank line apart, unless it is blank
    const body = domainLines(req.fields, unit);
    const ended = text === "" || text.endsWith("\n");
    const lead = text.trim() === "" ? (ended ? "" : "\n") : ended ? "\n" : "\n\n";
    const first = src.lines.length + lead.length;
    return { offset: text.length, text: lead + body.join("\n") + "\n", lines: [first, first + body.length - 1] };
  }

  const d = ast.domains[req.domain];
  if (!d) throw new Error(`no domain at ${req.domain}`);
  const inner = src.indent(d.span.start.line) + unit;
  const lastSub = d.subdomains.at(-1);
  const siblingIndent = lastSub ? src.indent(lastSub.span.start.line) : inner;
  const domainClose = closeOf(d.span);
  const domainLevel = (anchor: Position, body: string[]) =>
    before(src, anchor, body, siblingIndent, { spaced: true, closing: anchor === domainClose, trail: anchor === domainClose ? src.indent(d.span.start.line) : siblingIndent });

  switch (req.kind) {
    case "subdomain":
      return domainLevel(d.external?.span.start ?? d.mapping?.span.start ?? domainClose, subdomainLines(req.fields, unit));

    case "context": {
      const body = contextLines(req.fields, unit);
      const parent = req.parent === null ? d.external : d.subdomains.find((s) => s.name === req.parent);
      if (!parent) {
        if (req.parent !== null) throw new Error(`no subdomain ${req.parent}`);
        // no external yet: it is created, between the subdomains and the mapping
        const ins = domainLevel(d.mapping?.span.start ?? domainClose, ["external {", ...body.map((l) => unit + l), "}"]);
        return { ...ins, lines: [ins.lines[0] + 1, ins.lines[1] - 1] };
      }
      const lastCtx = parent.contexts.at(-1);
      const indent = lastCtx ? src.indent(lastCtx.span.start.line) : src.indent(parent.span.start.line) + unit;
      return before(src, closeOf(parent.span), body, indent, { spaced: false, closing: true, trail: src.indent(parent.span.start.line) });
    }

    case "relationship": {
      const line = relationshipLine(req.fields);
      const m = d.mapping;
      if (!m) {
        const ins = domainLevel(domainClose, ["mapping {", unit + line, "}"]);
        return { ...ins, lines: [ins.lines[0] + 1, ins.lines[0] + 1] };
      }
      const lastRel = m.relationships.at(-1);
      const indent = lastRel ? src.indent(lastRel.span.start.line) : src.indent(m.span.start.line) + unit;
      return before(src, closeOf(m.span), [line], indent, { spaced: false, closing: true, trail: src.indent(m.span.start.line) });
    }
  }
}

/** The element alone, as the form shows it before writing: at the root, with the file's step (two spaces by default). */
export function snippetOf(req: CreateRequest, unit = "  "): string[] {
  switch (req.kind) {
    case "domain":
      return domainLines(req.fields, unit);
    case "subdomain":
      return subdomainLines(req.fields, unit);
    case "context":
      return contextLines(req.fields, unit);
    case "relationship":
      return [relationshipLine(req.fields)];
  }
}
