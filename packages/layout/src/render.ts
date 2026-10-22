/**
 * O desenho da colmeia-v4: geometria + diagnósticos → SVG. Porte literal do bloco
 * *render* do script (`sevIcon`, `worst`, `pathOf`, `along`, `badgeSpot`, `arrowAt`,
 * `breakMark`, `portSvg`, `build`), com o `state` global da página trocado pelas
 * `ViewOptions` e sem o parâmetro `src`, que o `build` legado recebia e não lia.
 *
 * Como o legado, `buildSvg` escreve na geo (`viewBox`, `badges`, `labels`) e em cada
 * diagnóstico (`i`, o índice em `diags`).
 */
import { C, HIN, HR, corner, hexPath, kk } from "./hex.js";
import { add, boxHit, dist, esc, f, unit } from "./geometry.js";
import { placeLabels } from "./labels.js";
import { navOf } from "./nav.js";
import { fillOf, outline } from "./territories.js";
import type {
  Axial,
  Box,
  CanonModel,
  Chip,
  EndGeom,
  Geometry,
  LabelResult,
  LayoutContext,
  Point,
  PreparedDomain,
  RoutedRelation,
  TargetedDiagnostic,
  ViewOptions,
} from "./types.js";

/** O alvo lido como a v4 o lia: campo ausente é `undefined`, não erro. */
interface AnyTarget {
  kind: string;
  rk?: string;
  ctx?: string;
  sub?: string;
  dom?: string;
}
type Diag = TargetedDiagnostic & { i?: number };

/* ---------------- icones de severidade: nunca so cor (DESIGN.md secao 3) ---------------- */
export function sevIcon(p: Point, sev: string, r: number): string {
  const x = p[0],
    y = p[1];
  let g = '<g class="sev-' + sev + '">';
  if (sev === "warning") {
    g += '<path class="ic-bg" d="M' + f([x, y - r * 1.05]) + "L" + f([x + r * 1.1, y + r * 0.85]) + "L" + f([x - r * 1.1, y + r * 0.85]) + 'Z"/>';
    g += '<path class="ic-fg" d="M' + f([x, y - r * 0.35]) + "L" + f([x, y + r * 0.18]) + '"/><circle class="ic-dot" cx="' + x.toFixed(1) + '" cy="' + (y + r * 0.5).toFixed(1) + '" r="0.9"/>';
  } else {
    g += '<circle class="ic-bg" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '"/>';
    if (sev === "error") {
      const a = r * 0.42;
      g += '<path class="ic-fg" d="M' + f([x - a, y - a]) + "L" + f([x + a, y + a]) + "M" + f([x + a, y - a]) + "L" + f([x - a, y + a]) + '"/>';
    } else
      g += '<circle class="ic-dot" cx="' + x.toFixed(1) + '" cy="' + (y - r * 0.42).toFixed(1) + '" r="0.9"/><path class="ic-fg" d="M' + f([x, y - r * 0.05]) + "L" + f([x, y + r * 0.5]) + '"/>';
  }
  return g + "</g>";
}
export const SEV_RANK: Record<string, number> = { error: 0, warning: 1, info: 2 };
export function worst<T extends { severity: string }>(list: T[]): T {
  return list.slice().sort(function (a, b) {
    return SEV_RANK[a.severity] - SEV_RANK[b.severity];
  })[0];
}

/* ---------------- render ---------------- */
export function pathOf(pts: Point[]): string {
  let d = "M" + f(pts[0]);
  const t = 12;
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i],
      L1 = dist(c, pts[i - 1]),
      L2 = dist(c, pts[i + 1]),
      tt = Math.min(t, L1 / 2, L2 / 2);
    const u1 = unit(c, pts[i - 1]),
      u2 = unit(c, pts[i + 1]);
    d += "L" + f(add(c, u1, tt)) + "Q" + f(c) + " " + f(add(c, u2, tt));
  }
  return d + "L" + f(pts[pts.length - 1]);
}
export function along(pts: Point[], dd: number): Point {
  let left = dd;
  for (let i = 0; i < pts.length - 1; i++) {
    const L = dist(pts[i], pts[i + 1]);
    if (left <= L) return add(pts[i], unit(pts[i], pts[i + 1]), left);
    left -= L;
  }
  return pts[pts.length - 1];
}
export function totalLen(pts: Point[]): number {
  let t = 0;
  for (let i = 0; i < pts.length - 1; i++) t += dist(pts[i], pts[i + 1]);
  return t;
}
export function midOf(E: RoutedRelation): Point {
  const core = E.path;
  return along(core, totalLen(core) / 2);
}
/* Selo de veredito sobre a aresta: o ponto mais perto do meio que nao cobre
   chip, peca, rotulo nem outro selo. Nasceu de uma captura — no meio exato ele
   tampava o chip [CF] de Checkout, que era justamente parte do veredito. */
export function badgeSpot(E: RoutedRelation, geo: Geometry, lab: LabelResult): Point {
  const core = E.path,
    L = totalLen(core),
    R = 10,
    obst: Box[] = [];
  Object.keys(geo.tiles).forEach(function (id) {
    const p = geo.tiles[id];
    obst.push([p[0] - HR, p[1] - HIN, 2 * HR, 2 * HIN]);
  });
  geo.rels.forEach(function (F) {
    [F.L, F.Rr].forEach(function (en) {
      if (en.chip) obst.push(en.chip.box);
    });
  });
  Object.keys(lab.labels).forEach(function (id) {
    obst.push(lab.labels[id].box);
  });
  geo.badges!.forEach(function (b) {
    obst.push([b.p[0] - R, b.p[1] - R, 2 * R, 2 * R]);
  });
  for (let k = 0; k <= 20; k++) {
    const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * L / 22,
      p = along(core, L / 2 + off),
      box: Box = [p[0] - R, p[1] - R, 2 * R, 2 * R];
    if (
      !obst.some(function (o) {
        return boxHit(box, o);
      })
    )
      return p;
  }
  /* aresta curta demais: o selo sai para o lado da linha, ainda encostado nela */
  const m = along(core, L / 2),
    u = unit(along(core, L / 2 - 4), along(core, L / 2 + 4)),
    nrm: Point = [-u[1], u[0]];
  const offs = [14, -14, 22, -22, 30, -30, 38, -38];
  for (let i = 0; i < offs.length; i++) {
    const p2 = add(m, nrm, offs[i]),
      b2: Box = [p2[0] - R, p2[1] - R, 2 * R, 2 * R];
    if (
      !obst.some(function (o) {
        return boxHit(b2, o);
      })
    )
      return p2;
  }
  /* v4: nada livre (territorio fixo deixou Checkout e Pricing a duas celulas).
     Fica o lugar que menos tampa — e tampar chip pesa mais que tampar peca,
     porque o chip e o proprio veredito que o selo anuncia. */
  const chips: Box[] = [];
  geo.rels.forEach(function (F) {
    [F.L, F.Rr].forEach(function (en) {
      if (en.chip) chips.push(en.chip.box);
    });
  });
  let best = m,
    bs = Infinity;
  [0].concat(offs).forEach(function (o) {
    const p3 = add(m, nrm, o),
      b3: Box = [p3[0] - R, p3[1] - R, 2 * R, 2 * R];
    const sc =
      obst.filter(function (x) {
        return boxHit(b3, x);
      }).length +
      10 *
        chips.filter(function (x) {
          return boxHit(b3, x);
        }).length +
      Math.abs(o) / 100;
    if (sc < bs) {
      bs = sc;
      best = p3;
    }
  });
  return best;
}
export function arrowAt(en: EndGeom): string {
  const b = en.tip,
    u: Point = [-en.n[0], -en.n[1]],
    n: Point = [-u[1], u[0]],
    L = 9,
    W = 4.4;
  return '<path class="head" d="M' + f(b) + "L" + f([b[0] - u[0] * L + n[0] * W, b[1] - u[1] * L + n[1] * W]) + "L" + f([b[0] - u[0] * L - n[0] * W, b[1] - u[1] * L - n[1] * W]) + 'Z"/>';
}
export function breakMark(E: RoutedRelation): string {
  const core = E.path,
    L = totalLen(core),
    mid = along(core, L / 2);
  const u = unit(along(core, L / 2 - 6), along(core, L / 2 + 6)),
    n: Point = [-u[1], u[0]],
    W = 6.5;
  let g = "";
  [-5, 5].forEach(function (off) {
    const c = add(mid, u, off);
    g += '<path class="tick" d="M' + f(add(c, n, W)) + "L" + f(add(c, n, -W)) + '"/>';
  });
  return g;
}
export function portSvg(chip: Chip, sevList: { severity: string }[]): string {
  const pattern = chip.tags.filter(function (t) {
      return t !== "BBM";
    }),
    bbm = chip.tags.indexOf("BBM") >= 0;
  const sev = sevList.length ? worst(sevList).severity : null;
  const w = chip.w + (sev ? 13 : 0),
    x = chip.c[0] - w / 2,
    y = chip.c[1] - chip.h / 2;
  const cls = "port" + (pattern.length ? "" : " only-bbm") + (sev ? " sev-" + sev : "");
  let g = '<g class="' + cls + '"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + chip.h + '" rx="6"/>';
  let tx = x + 6;
  if (sev) {
    g += sevIcon([x + 9, chip.c[1]], sev, 4.6);
    tx += 13;
  }
  g += '<text x="' + tx.toFixed(1) + '" y="' + chip.c[1].toFixed(1) + '">' + esc(pattern.join(" "));
  if (bbm) g += '<tspan class="bbm">' + (pattern.length ? " " : "") + "BBM</tspan>";
  return g + "</text></g>";
}

/* ---------------- a ficha da selecao (so o que o build le) ---------------- */
interface SubInfo {
  dom: PreparedDomain;
  sd: { id: string; type: string; contexts: LayoutContext[]; ids: string[] };
}
export function subOf(m: CanonModel, key: string): SubInfo | null {
  const parts = key.split("/");
  for (let i = 0; i < m.domains.length; i++) {
    const d = m.domains[i];
    if (d.id !== parts[0]) continue;
    if (parts[1] === "external") return { dom: d, sd: { id: "external", type: "external", contexts: d.external, ids: d.externalIds } };
    const f2 = d.subdomains.filter(function (sd) {
      return sd.id === parts[1];
    })[0];
    if (f2) return { dom: d, sd: f2 };
  }
  return null;
}

/** O que a bancada acrescentava ao SVG depois de pronto (`decorate`), agora posto na
    montagem: o sentido de cada relação, o tipo de cada peça e os rótulos de longe. */
interface Deco {
  flow: Record<string, string>;
  /** Por `data-sub` já escapado; o que não está aqui é o bloco `external`. */
  typeOfSub: Record<string, string>;
  /** Por nome de contexto já escapado. */
  typeOfCtx: Record<string, string>;
  bad: Set<string>;
  far: string;
}
const typeIn = (m: Record<string, string>, k: string) => (Object.hasOwn(m, k) ? m[k] : "external");

/** O `build` da v4, com `state.*` lido de `opts`. `deco`, só para `renderSvg`. */
export function buildSvg(geo: Geometry, diags: TargetedDiagnostic[], opts: ViewOptions, deco?: Deco): string {
  const m = geo.cm,
    flow = opts.view === "flow",
    showTags = opts.tags === "on";
  const lab = placeLabels(geo, { edges: flow, tags: showTags, ctxLabels: opts.labels === "ctx", subLabels: opts.labels !== "dom", subSize: opts.labels === "sub" ? 18 : 13 });
  const tiles = geo.tiles,
    s: string[] = [];

  /* diagnosticos indexados pelo alvo */
  const byPort: Record<string, Diag[]> = {},
    byEdge: Record<string, Diag[]> = {},
    byTile: Record<string, Diag[]> = {},
    bySub: Record<string, Diag[]> = {},
    byDom: Record<string, Diag[]> = {},
    fileLevel: Diag[] = [];
  (diags as Diag[]).forEach(function (d, i) {
    d.i = i;
    const t = d.target as AnyTarget;
    if (t.kind === "port") (byPort[t.rk + ":" + t.ctx] = byPort[t.rk + ":" + t.ctx] || []).push(d);
    else if (t.kind === "edge") (byEdge[t.rk!] = byEdge[t.rk!] || []).push(d);
    else if (t.kind === "tile") (byTile[t.ctx!] = byTile[t.ctx!] || []).push(d);
    else if (t.kind === "sub") (bySub[t.sub!] = bySub[t.sub!] || []).push(d);
    else if (t.kind === "dom") (byDom[t.dom!] = byDom[t.dom!] || []).push(d);
    else fileLevel.push(d);
  });
  /* Uma ponta sem tag nao tem chip onde o veredito possa morar: ele sobe para
     a aresta. Na contencao nao ha aresta, entao sobe para a peca. */
  geo.rels.forEach(function (E) {
    [E.L, E.Rr].forEach(function (en) {
      const k = E.rk + ":" + en.id;
      if (byPort[k] && !(en.chip && showTags && flow)) {
        const into = flow ? (byEdge[E.rk] = byEdge[E.rk] || []) : (byTile[en.id] = byTile[en.id] || []);
        into.push.apply(flow ? byEdge[E.rk] : byTile[en.id], byPort[k]);
        delete byPort[k];
      }
    });
    if (!flow && byEdge[E.rk]) {
      [E.rel.l].forEach(function (id) {
        (byTile[id] = byTile[id] || []).push.apply(byTile[id], byEdge[E.rk]);
      });
      delete byEdge[E.rk];
    }
  });
  const selD: Diag | null = opts.selDiag != null ? (diags as Diag[])[opts.selDiag] : null;
  const selT = selD ? (selD.target as AnyTarget) : null;
  geo.badges = [];

  /* limites: tudo que e desenhado entra — terreno, pecas, chips, rotulos (V2) */
  const all: Point[] = [];
  geo.groups.forEach(function (g) {
    g.cells.forEach(function (c) {
      all.push(g.pos[kk(c[0], c[1])]);
    });
  });
  geo.islands.forEach(function (isl) {
    if (isl.region)
      isl.region.cells.forEach(function (c) {
        all.push(isl.region!.pos[kk(c[0], c[1])]);
      });
  });
  if (flow)
    geo.rels.forEach(function (E) {
      E.path.forEach(function (p) {
        all.push(p);
      });
      [E.L, E.Rr].forEach(function (en) {
        if (en.chip) {
          const b = en.chip.box;
          all.push([b[0] - 14, b[1]]);
          all.push([b[0] + b[2] + 14, b[1] + b[3]]);
        }
      });
    });
  Object.keys(lab.labels).forEach(function (id) {
    const b = lab.labels[id].box;
    all.push([b[0], b[1]]);
    all.push([b[0] + b[2], b[1] + b[3]]);
  });
  const minX =
      Math.min(
        ...all.map(function (p) {
          return p[0];
        }),
      ) -
      C -
      8,
    maxX =
      Math.max(
        ...all.map(function (p) {
          return p[0];
        }),
      ) +
      C +
      8;
  const minY =
      Math.min(
        ...all.map(function (p) {
          return p[1];
        }),
      ) -
      C -
      8,
    maxY =
      Math.max(
        ...all.map(function (p) {
          return p[1];
        }),
      ) +
      C +
      56;
  geo.viewBox = [minX, minY, maxX - minX, maxY - minY];

  s.push(
    '<svg class="' +
      (flow ? "v-flow" : "v-contain") +
      '" viewBox="' +
      [minX, minY, maxX - minX, maxY - minY]
        .map(function (v) {
          return v.toFixed(0);
        })
        .join(" ") +
      '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de contextos em colmeia, vista de ' +
      (flow ? "fluxo" : "contenção") +
      '">',
  );
  s.push(
    '<defs><filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="rgb(20,18,30)" flood-opacity="0.10"/></filter>' +
      '<filter id="tsh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgb(20,18,30)" flood-opacity="0.18"/></filter></defs>',
  );

  geo.islands.forEach(function (isl) {
    if (!isl.region) return;
    s.push('<path class="dregion" d="' + fillOf(isl.region.cells, isl.region.pos) + '"/>');
    s.push('<path class="bdom" d="' + outline(isl.region.cells, isl.region.set, isl.region.pos) + '"/>');
  });
  geo.islands.forEach(function (isl) {
    isl.masses.forEach(function (mass) {
      const cells: Axial[] = [],
        set: Record<string, 1> = {};
      mass.groups.forEach(function (g) {
        g.cells.forEach(function (c) {
          cells.push(c);
          set[kk(c[0], c[1])] = 1;
        });
      });
      if (!cells.length) return;
      s.push('<path class="terr ' + mass.type + '" d="' + fillOf(cells, mass.pos) + '" filter="url(#sh)"/>');
      mass.groups.forEach(function (g) {
        if (!g.cells.length) return;
        const d = fillOf(g.cells, mass.pos),
          key = isl.dom.id + "/" + g.sd.id;
        s.push(
          '<g class="sub' + (opts.selSub === key ? " hot on" : "") + '" data-sub="' + esc(key) + '"' + (deco ? ' data-type="' + typeIn(deco.typeOfSub, esc(key)) + '"' : "") + '><path class="subwash" d="' + d + '"/>' + '<path class="bsub" d="' + outline(g.cells, g.set, mass.pos) + '"/></g>',
        );
      });
      s.push('<path class="bmass' + (mass.external ? " ext" : "") + '" d="' + outline(cells, set, mass.pos) + '"/>');
    });
  });

  let selSubIds: string[] = [];
  if (opts.selSub) {
    const info = subOf(m, opts.selSub);
    if (info) selSubIds = info.sd.ids;
  }
  const near: Record<string, 1> = {};
  if (opts.sel) {
    near[opts.sel] = 1;
    m.mapping.forEach(function (r) {
      if (r.l === opts.sel) near[r.r] = 1;
      if (r.r === opts.sel) near[r.l] = 1;
    });
  }

  if (flow)
    geo.rels.forEach(function (E) {
      const rel = E.rel,
        lit =
          (opts.sel && (rel.l === opts.sel || rel.r === opts.sel)) ||
          (opts.selSub && (selSubIds.indexOf(rel.l) >= 0 || selSubIds.indexOf(rel.r) >= 0)) ||
          (selD && selT!.rk === E.rk);
      const faded = (opts.sel || opts.selSub || selD) && !lit;
      /* a bancada só decorava o `<g class="rel">` pelado, sem lit nem fade */
      const dr = deco && !lit && !faded ? deco : null;
      let g =
        '<g class="rel' +
        (lit ? " lit" : "") +
        (faded ? " fade" : "") +
        (dr && dr.bad.has(esc(E.rk)) ? " invalid" : "") +
        '" data-rk="' +
        esc(E.rk) +
        '"' +
        (dr ? ' data-flow="' + (dr.flow[esc(E.rk)] || "none") + '"' : "") +
        ">";
      const d = pathOf(E.path);
      g += '<path class="ecase" d="' + d + '"/>' + (dr ? '<path class="rhit" d="' + d + '"/>' : "") + '<path class="edge' + (rel.c === "-x-" ? " sep" : "") + '" d="' + d + '"/>';
      if (rel.c === "-x-") g += breakMark(E);
      [E.L, E.Rr].forEach(function (en) {
        if (en.chip && showTags) g += portSvg(en.chip, byPort[E.rk + ":" + en.id] || []);
        if (en.arrow) g += arrowAt(en);
      });
      if (byEdge[E.rk]) {
        const mp = badgeSpot(E, geo, lab),
          w = worst(byEdge[E.rk]);
        geo.badges!.push({ rk: E.rk, p: mp });
        g += '<g class="badge"><circle class="ring" cx="' + mp[0].toFixed(1) + '" cy="' + mp[1].toFixed(1) + '" r="8.5"/>' + sevIcon(mp, w.severity, 6.5) + "</g>";
      }
      s.push(g + "</g>");
    });

  const subOfCtx: Record<string, string> = {};
  geo.islands.forEach(function (isl) {
    isl.masses.forEach(function (mass) {
      mass.groups.forEach(function (g) {
        g.sd.ids.forEach(function (id) {
          subOfCtx[id] = isl.dom.id + "/" + g.sd.id;
        });
      });
    });
  });
  geo.islands.forEach(function (isl) {
    isl.masses.forEach(function (mass) {
      mass.groups.forEach(function (g) {
        g.sd.ids.forEach(function (id) {
          const p = tiles[id];
          if (!p) return;
          const key = subOfCtx[id],
            inSel = opts.selSub === key,
            dHit = selD && selT!.ctx === id;
          const cls =
            "node" +
            (opts.sel === id ? " on" : "") +
            (inSel ? " subhot" : "") +
            ((opts.sel && !near[id]) || (opts.selSub && !inSel) || (selD && !dHit && selT!.kind === "tile") ? " fade" : "");
          s.push(
            '<g class="' +
              cls +
              '" data-ctx="' +
              esc(id) +
              '" data-sub="' +
              esc(key) +
              '"' +
              (deco ? ' data-type="' + typeIn(deco.typeOfSub, esc(key)) + '"' : "") +
              ' tabindex="0" role="button" aria-label="context ' +
              esc(id) +
              '">' +
              '<path class="tile ' +
              mass.type +
              '" d="' +
              hexPath(p[0], p[1], HR) +
              '" filter="url(#tsh)"/><path class="hit" d="' +
              hexPath(p[0], p[1], HR - 1) +
              '"/></g>',
          );
        });
      });
    });
  });

  lab.subSpots.forEach(function (sp) {
    const size = sp.size;
    s.push(
      '<g class="sublab' +
        (opts.selSub === sp.sub ? " subhot" : "") +
        '" data-sub="' +
        esc(sp.sub) +
        '"' +
        (deco ? ' data-type="' + typeIn(deco.typeOfSub, esc(sp.sub)) + '"' : "") +
        '><text class="snm" style="font-size:' +
        size +
        'px" x="' +
        sp.p[0].toFixed(0) +
        '" y="' +
        (sp.p[1] + size * 0.36).toFixed(0) +
        '">' +
        esc(sp.id.toUpperCase()) +
        "</text>",
    );
    if (bySub[sp.sub]) {
      const w = worst(bySub[sp.sub]);
      s.push(sevIcon([sp.box[0] - 9, sp.p[1]], w.severity, 5.5));
    }
    s.push("</g>");
  });
  Object.keys(lab.labels).forEach(function (id) {
    const L = lab.labels[id],
      faded = (opts.sel && !near[id]) || (opts.selSub && subOfCtx[id] !== opts.selSub);
    s.push('<text class="cnm' + (faded ? " fade" : "") + (opts.sel === id ? " on" : "") + '"' + (deco ? ' data-type="' + typeIn(deco.typeOfCtx, esc(id)) + '"' : "") + ' x="' + L.x.toFixed(1) + '" y="' + L.y.toFixed(1) + '" text-anchor="' + L.a + '">' + esc(id) + "</text>");
  });
  /* veredito na peca: selo no canto superior direito, com anel da cor do painel
     para ler sobre o amarelo do core (o amarelo e chao, nunca fundo de marcador) */
  Object.keys(byTile)
    .sort()
    .forEach(function (id) {
      const p = tiles[id];
      if (!p) return;
      const w = worst(byTile[id]),
        c = corner(p[0], p[1], 5, HR * 0.86);
      s.push('<g class="badge"><circle class="ring" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="8.5"/>' + sevIcon(c, w.severity, 6.5) + "</g>");
    });

  geo.islands.forEach(function (isl) {
    const xs: number[] = [],
      ys: number[] = [];
    isl.masses.forEach(function (mass) {
      mass.groups.forEach(function (g) {
        g.cells.forEach(function (c) {
          const p = mass.pos[kk(c[0], c[1])];
          xs.push(p[0]);
          ys.push(p[1]);
        });
      });
    });
    if (isl.region)
      isl.region.cells.forEach(function (c) {
        const p = isl.region!.pos[kk(c[0], c[1])];
        xs.push(p[0]);
        ys.push(p[1]);
      });
    if (!xs.length) return;
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2,
      by = Math.max(...ys) + C + 34,
      size = opts.labels === "dom" ? 22 : 16;
    const name = isl.dom.title || isl.dom.id;
    s.push('<text class="dnm" style="font-size:' + size + 'px" x="' + cx.toFixed(0) + '" y="' + by.toFixed(0) + '">' + esc(name) + "</text>");
    s.push('<text class="did" x="' + cx.toFixed(0) + '" y="' + (by + 15).toFixed(0) + '">DOMAIN ' + esc(isl.dom.id.toUpperCase()) + "</text>");
    const dl = (byDom[isl.dom.id] || []).concat(isl === geo.islands[0] ? fileLevel : []);
    if (dl.length) {
      const w = worst(dl);
      s.push(sevIcon([cx - name.length * size * 0.29 - 14, by - size * 0.34], w.severity, 6.5));
    }
  });
  if (deco) s.push(deco.far);
  s.push("</svg>");
  geo.labels = lab;
  return s.join("");
}

/**
 * O SVG do mapa como a bancada o exibe: o `build` da v4 mais o que a navegação
 * precisa nele (`data-type`, `data-flow`, a área de clique das relações, o selo de
 * relação inválida e os nomes de subdomínio que aparecem ao afastar).
 *
 * Não escreve em `diags`: o `buildSvg` anota cada diagnóstico com `i`, e isso vai
 * para cópias.
 */
export function renderSvg(geo: Geometry, diags: TargetedDiagnostic[], opts: ViewOptions): string {
  const nav = navOf(geo),
    typeOfSub: Record<string, string> = {};
  Object.keys(nav.subs).forEach((k) => {
    typeOfSub[esc(k)] = nav.subs[k].type;
  });
  const typeOfCtx: Record<string, string> = {};
  Object.keys(nav.typeOfCtx).forEach((id) => {
    typeOfCtx[esc(id)] = nav.typeOfCtx[id];
  });
  const far = placeLabels(geo, { edges: false, tags: false, ctxLabels: false, subLabels: true, subSize: 18 });
  const farSvg = far.subSpots
    .map(
      (sp) =>
        '<g class="sublab far-lab" data-sub="' + esc(sp.sub) + '" data-type="' + typeIn(typeOfSub, esc(sp.sub)) + '"><text class="snm" style="font-size:' + sp.size + 'px" x="' + sp.p[0].toFixed(0) + '" y="' + (sp.p[1] + sp.size * 0.36).toFixed(0) + '">' + esc(sp.id.toUpperCase()) + "</text></g>",
    )
    .join("");
  const bad = new Set<string>();
  diags.forEach((d) => {
    const t = d.target as AnyTarget;
    if (d.severity === "error" && t.rk) bad.add(t.rk);
  });
  return buildSvg(geo, diags.map((d) => ({ ...d })), opts, { flow: nav.flow, typeOfSub, typeOfCtx, bad, far: farSvg });
}
