/**
 * A fonte `.odds` de um modelo, com âncoras: `Src` e `sourceOf` da colmeia-v4.
 * Porte literal.
 */
import { pairKey } from "../geometry.js";
import type { LayoutContext, LayoutRelation, PreparedDomain, PreparedModel } from "../types.js";

export interface AnchorSpan {
  start: { line: number; column: number };
  end: { line: number; column: number };
}
export interface Source {
  text: string;
  lines: string[];
  anchors: Record<string, AnchorSpan>;
  lineKeys: (string | null)[];
  domOrder: string[];
}
interface LineBuilder {
  t(text: string, key?: string): LineBuilder;
  o(key: string): LineBuilder;
  c(key: string): LineBuilder;
  pad(n: number): LineBuilder;
  len(): number;
  done(): void;
}

export function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("0000000" + (h >>> 0).toString(16)).slice(-8);
}

/* ---------------- fonte .odds, com ancoras ---------------- */
/* Cada token que um diagnostico pode apontar e registrado com o seu span, sob
   uma chave que nao depende da ordem do arquivo (o nome do contexto, o par da
   relacao). E o que deixa o marcador cair no lugar certo depois de embaralhar:
   o span muda, a chave nao. */
export class Src {
  lines: string[] = [];
  anchors: Record<string, AnchorSpan> = {};
  lineKeys: (string | null)[] = [];
  domOrder: string[] = [];
  set(key: string, l0: number, c0: number, l1: number, c1: number): void {
    this.anchors[key] = { start: { line: l0, column: c0 }, end: { line: l1, column: c1 } };
  }
  plain(s: string): void {
    this.lines.push(s);
    this.lineKeys.push(null);
  }
  begin(tag?: string): LineBuilder {
    const src = this,
      ln = this.lines.length + 1,
      open: Record<string, number> = {};
    let s = "";
    const b: LineBuilder = {
      t: function (text, key) {
        if (key) src.set(key, ln, s.length + 1, ln, s.length + 1 + text.length);
        s += text;
        return b;
      },
      o: function (key) {
        open[key] = s.length + 1;
        return b;
      },
      c: function (key) {
        src.set(key, ln, open[key], ln, s.length + 1);
        return b;
      },
      pad: function (n) {
        while (s.length < n) s += " ";
        return b;
      },
      len: function () {
        return s.length;
      },
      done: function () {
        src.lines.push(s);
        src.lineKeys.push(tag || null);
      },
    };
    return b;
  }
}
export function ownerDomain(m: PreparedModel, ctx: string): PreparedDomain | null {
  for (let i = 0; i < m.domains.length; i++) {
    const d = m.domains[i];
    for (let j = 0; j < d.subdomains.length; j++) if (d.subdomains[j].ids.indexOf(ctx) >= 0) return d;
    if (d.externalIds.indexOf(ctx) >= 0) return d;
  }
  return null;
}
export const PROP_ORDER = ["type", "description", "responsibilities", "maturity", "team", "technology"] as const;
export function relText(rel: LayoutRelation): string {
  return (rel.lt.length ? "[" + rel.lt.join(", ") + "] " : "") + rel.c + (rel.rt.length ? " [" + rel.rt.join(", ") + "]" : "");
}
export function relLine(src: Src, rel: LayoutRelation, indent: string): void {
  const rk = pairKey(rel.l, rel.r),
    b = src.begin("rel:" + rk);
  b.t(indent)
    .o("rel:" + rk)
    .t(rel.l, "rname:" + rk + ":" + rel.l)
    .pad(indent.length + 16)
    .t(" ");
  const mid0 = b.len();
  function grp(tags: string[], ctx: string): void {
    b.o("grp:" + rk + ":" + ctx).t("[");
    tags.forEach(function (tg, i) {
      if (i) b.t(", ");
      b.t(tg, "tag:" + rk + ":" + ctx + ":" + tg);
    });
    b.t("]").c("grp:" + rk + ":" + ctx);
  }
  if (rel.lt.length) {
    grp(rel.lt, rel.l);
    b.t(" ");
  }
  b.t(rel.c, "conn:" + rk);
  if (rel.rt.length) {
    b.t(" ");
    grp(rel.rt, rel.r);
  }
  b.pad(mid0 + 22)
    .t(" ")
    .t(rel.r, "rname:" + rk + ":" + rel.r)
    .c("rel:" + rk)
    .done();
}
export function ctxLines(src: Src, c: LayoutContext): void {
  const keys = PROP_ORDER.filter(function (k) {
    return c[k] !== undefined;
  });
  const b = src.begin("ctx:" + c.id);
  b.t("    ")
    .o("ctxhead:" + c.id)
    .t("context", "ctxkw:" + c.id)
    .t(" ")
    .t(c.id, "ctx:" + c.id)
    .c("ctxhead:" + c.id);
  if (!c.title && !keys.length) {
    b.done();
    return;
  }
  b.t(" {").done();
  if (c.title) src.plain('      title: "' + c.title + '"');
  keys.forEach(function (k) {
    const v = c[k] as string | string[];
    src.plain("      " + k + ": " + (Array.isArray(v) ? "[" + v.join(", ") + "]" : v));
  });
  src.plain("    }");
}
export function sourceOf(m: PreparedModel, sub: string): Source {
  const src = new Src(),
    cross: LayoutRelation[] = [];
  m.mapping.forEach(function (rel) {
    if (ownerDomain(m, rel.l) !== ownerDomain(m, rel.r)) cross.push(rel);
  });
  m.domains.forEach(function (d, di) {
    if (di) src.plain("");
    /* `domnth:N` e a ancora ordinal: INVALID_DOMAIN_CARDINALITY aponta o
       SEGUNDO dominio declarado, seja ele qual for — o que ele julga e a
       posicao, nao o nome. A checagem escolhe, entre as ancoras de mesmo span,
       a que sobrevive a todos os embaralhamentos. */
    src
      .begin("dom:" + d.id)
      .o("domhead:" + d.id)
      .o("domnth:" + (di + 1))
      .t("domain", "domkw:" + d.id)
      .t(" ")
      .t(d.id, "domname:" + d.id)
      .c("domhead:" + d.id)
      .c("domnth:" + (di + 1))
      .t(" {")
      .done();
    src.domOrder.push(d.id);
    if (d.title) src.plain('  title: "' + d.title + '"');
    d.subdomains.forEach(function (sd) {
      const dk = d.id + "/" + sd.id;
      src.plain("");
      src
        .begin("sub:" + dk)
        .t("  ")
        .o("subhead:" + dk)
        .t("subdomain", "subkw:" + dk)
        .t(" ")
        .t(sd.type, "subtype:" + dk)
        .t(" ")
        .t(sd.id, "subname:" + dk)
        .c("subhead:" + dk)
        .t(" {")
        .done();
      if (sd.title) src.plain('    title: "' + sd.title + '"');
      /* description e owner num subdomain: ADR-0008, na linguagem desde a
         ODDS 1.0.0 (GRAMMAR.md v0.3.0). O controle "+ propriedades" continua
         existindo para comparar a ficha com e sem elas. */
      if (sub === "rich") {
        if (sd.description) src.plain("    description: " + sd.description);
        if (sd.owner) src.plain("    owner: " + sd.owner);
      }
      sd.contexts.forEach(function (c) {
        ctxLines(src, c);
      });
      src.plain("  }");
    });
    if (d.external.length) {
      src.plain("");
      src
        .begin()
        .t("  ")
        .t("external", "extkw:" + d.id)
        .t(" {")
        .done();
      d.external.forEach(function (c) {
        ctxLines(src, c);
      });
      src.plain("  }");
    }
    const mine = m.mapping.filter(function (rel) {
      return ownerDomain(m, rel.l) === d && ownerDomain(m, rel.r) === d;
    });
    if (mine.length) {
      src.plain("");
      src
        .begin()
        .t("  ")
        .t("mapping", "map:" + d.id)
        .t(" {")
        .done();
      mine.forEach(function (rel) {
        relLine(src, rel, "    ");
      });
      src.plain("  }");
    }
    src.plain("}");
  });
  if (cross.length) {
    src.plain("");
    src.plain("// ligacao entre dominios nao tem sintaxe hoje:");
    cross.forEach(function (rel) {
      src.plain("//   " + rel.l + "  " + relText(rel) + "  " + rel.r);
    });
  }
  const n = src.lines.length,
    last = src.lines[n - 1] || "";
  src.set("file", 1, 1, n, last.length + 1);
  return { text: src.lines.join("\n"), lines: src.lines, anchors: src.anchors, lineKeys: src.lineKeys, domOrder: src.domOrder };
}
