/**
 * As arestas da colmeia-v4: portas nos lados do hexágono, chips de tag, reparo de
 * chips e o roteamento A* pela própria grade em duas passadas. Porte literal de
 * `Heap`, `routeAll` e `chipW`.
 */
import { C, DIRS, HIN, HR, SQ3, hexDist, kk, px, unkk } from "./hex.js";
import { add, boxHit, cmp, dist, segBox } from "./geometry.js";
import type { Box, EndGeom, Geometry, Point, PortEnd, PortStart, RoutedRelation } from "./types.js";

/* ---------------- arestas: o mar vira estrada ---------------- */
/* A* na propria grade hexagonal. Peca alheia e parede, a vizinhanca dela custa
   caro, terra custa um pouco mais que mar, e celula que ja leva aresta sai mais
   barata — e isso que junta arestas no mesmo corredor. Depois, string-pulling
   contra as pecas: a linha fica reta sempre que pode, e nunca passa a menos de
   CLR do centro de uma peca que nao e dela. */
export class Heap {
  a: [number, number][] = [];
  push(x: [number, number]): void {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      const t = a[p];
      a[p] = a[i];
      a[i] = t;
      i = p;
    }
  }
  pop(): [number, number] {
    const a = this.a,
      top = a[0],
      last = a.pop() as [number, number];
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1,
          r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        const t = a[m];
        a[m] = a[i];
        a[i] = t;
        i = m;
      }
    }
    return top;
  }
}

/** Uma relação durante o roteamento: os campos de `RoutedRelation` nascem aos poucos. */
type Edge = RoutedRelation;
interface Slot {
  E: Edge;
  key: "L" | "Rr";
  e: PortEnd;
}

export function chipW(tags: string[]): number {
  return tags.join(" ").length * 6.0 + 12;
}

export function routeAll(geo: Geometry): void {
  const land: Record<string, 1> = {},
    tileAt: Record<string, string> = {},
    near: Record<string, string[]> = {};
  geo.groups.forEach(function (g) {
    g.cells.forEach(function (c) {
      land[kk(c[0], c[1])] = 1;
    });
  });
  Object.keys(geo.cellOf).forEach(function (id) {
    const c = geo.cellOf[id];
    tileAt[kk(c[0], c[1])] = id;
    DIRS.forEach(function (d) {
      const k = kk(c[0] + d[0], c[1] + d[1]);
      (near[k] = near[k] || []).push(id);
    });
  });
  const ks = Object.keys(land).map(unkk);
  const q0 =
      Math.min(
        ...ks.map(function (c) {
          return c[0];
        }),
      ) - 4,
    q1 =
      Math.max(
        ...ks.map(function (c) {
          return c[0];
        }),
      ) + 4;
  const ys = Object.keys(land).map(function (k) {
    const c = unkk(k);
    return px(c[0], c[1])[1];
  });
  const y0 = Math.min(...ys) - 4 * C * SQ3,
    y1 = Math.max(...ys) + 4 * C * SQ3;
  function inGrid(q: number, r: number): boolean {
    if (q < q0 || q > q1) return false;
    const y = px(q, r)[1];
    return y >= y0 && y <= y1;
  }
  const tiles = geo.tiles;

  const R = geo.cm.mapping.map(function (rel) {
    return { rel: rel, rk: rel.rk } as Edge;
  });

  /* portas: cada ponta pega o lado do hexagono mais alinhado com a saida. Lado
     com tag e exclusivo; se ja tem dono, vai para o vizinho mais alinhado.
     Ponta sem tag nunca divide lado com uma tag — cairia em cima do chip. */
  const byTile: Record<string, PortEnd[]> = {};
  R.forEach(function (E, i) {
    /* o lado desejado e o da linha reta ate o parceiro. Tirado da primeira
       perna de uma rota preliminar, ele herdava o contorno de obstaculos e a
       porta de Warehouse saia de costas para Inventory */
    ([["l", "r"], ["r", "l"]] as const).forEach(function (s) {
      const id = E.rel[s[0]],
        p = tiles[id],
        q = tiles[E.rel[s[1]]];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const tags = E.rel[s[0] === "l" ? "lt" : "rt"];
      (byTile[id] = byTile[id] || []).push({ i: i, side: s[0], ang: ang, tags: tags } as PortEnd);
    });
  });
  function sideAng(k: number): number {
    return ((30 + 60 * k) * Math.PI) / 180;
  }
  function angDiff(a: number, b: number): number {
    const d = Math.abs(a - b) % (2 * Math.PI);
    return d > Math.PI ? 2 * Math.PI - d : d;
  }
  let congested = 0;
  Object.keys(byTile)
    .sort()
    .forEach(function (id) {
      const ends = byTile[id],
        taken: Record<number, number> = {},
        shared: Record<number, number> = {};
      function ranked(e: PortEnd): number[] {
        return [0, 1, 2, 3, 4, 5].sort(function (a, b) {
          return angDiff(sideAng(a), e.ang) - angDiff(sideAng(b), e.ang) || a - b;
        });
      }
      const withTag = ends.filter(function (e) {
          return e.tags.length;
        }),
        without = ends.filter(function (e) {
          return !e.tags.length;
        });
      withTag.sort(function (a, b) {
        return angDiff(sideAng(ranked(a)[0]), a.ang) - angDiff(sideAng(ranked(b)[0]), b.ang) || cmp(R[a.i].rk, R[b.i].rk);
      });
      withTag.forEach(function (e) {
        const r = ranked(e);
        let k: number | undefined = r.filter(function (s) {
          return !taken[s] && angDiff(sideAng(s), e.ang) <= Math.PI / 2 + 1e-6;
        })[0];
        if (k === undefined) {
          k = r[0];
          congested++;
          e.stack = taken[k] || 0;
        }
        taken[k] = (taken[k] || 0) + 1;
        e.k = k;
      });
      without.sort(function (a, b) {
        return cmp(R[a.i].rk, R[b.i].rk);
      });
      without.forEach(function (e) {
        /* na grade, duas pontas no mesmo lado saem pela mesma celula e viram uma
           linha so: lado livre primeiro, dividido so se nao houver outro */
        const r = ranked(e);
        let k: number | undefined = r.filter(function (s) {
          return !taken[s] && !shared[s] && angDiff(sideAng(s), e.ang) <= (Math.PI * 2) / 3 + 1e-6;
        })[0];
        if (k === undefined)
          k = r.filter(function (s) {
            return !taken[s];
          })[0];
        if (k === undefined) k = r[0];
        e.stack = shared[k] || 0;
        shared[k] = (shared[k] || 0) + 1;
        e.k = k;
      });
      ends.forEach(function (e) {
        R[e.i][e.side === "l" ? "endL" : "endR"] = e;
      });
    });

  /* geometria da porta: lado -> SETA COLADA -> respiro -> chip -> linha.
     Ate a v3.2 a ordem era lado, chip, seta: a seta ficava depois do chip, a
     varios px do hexagono, e quando a rota virava logo adiante ela aparecia
     solta no canto — a seta "quebrava". Colada no lado, ela sempre aponta para
     a peca e nunca depende de onde a linha vira. */
  const ARROW_L = 9,
    BREATH = 6;
  function endGeom(_E: Edge, e: PortEnd, id: string, arrowHere: boolean): EndGeom {
    const ctr = tiles[id],
      a = sideAng(e.k),
      n: Point = [Math.cos(a), Math.sin(a)],
      t: Point = [-n[1], n[0]];
    let P = add(ctr, n, HIN),
      chip: EndGeom["chip"] = null;
    if (e.stack) P = add(P, t, (e.stack % 2 ? 1 : -1) * Math.ceil(e.stack / 2) * (e.tags.length ? 17 : 8));
    const tip = add(P, n, 0.5),
      push = e.push || 0;
    const near = (arrowHere ? ARROW_L + 0.5 : 0) + BREATH;
    let far = near;
    if (e.tags.length) {
      const w = chipW(e.tags),
        h = 15,
        ext = Math.abs(n[0]) * w + Math.abs(n[1]) * h;
      /* o raio entra e sai da caixa a exitT do centro; nos lados diagonais uma
         quina da caixa fica mais perto do hexagono do que o ponto de entrada,
         entao o centro tambem respeita meia projecao — a caixa nunca invade o lado */
      const exitT = Math.min(
        Math.abs(n[0]) > 1e-6 ? w / 2 / Math.abs(n[0]) : Infinity,
        Math.abs(n[1]) > 1e-6 ? h / 2 / Math.abs(n[1]) : Infinity,
      );
      const t0 = Math.max(near + exitT, ext / 2 + (arrowHere ? ARROW_L : 0) + 2) + push,
        cc = add(P, n, t0);
      chip = { c: cc, w: w, h: h, box: [cc[0] - w / 2, cc[1] - h / 2, w, h], tags: e.tags };
      far = t0 + exitT;
    }
    const Q = add(P, n, far + 5);
    return { id: id, P: P, n: n, tip: tip, Q: Q, chip: chip, arrow: arrowHere, k: e.k } as EndGeom;
  }
  R.forEach(function (E) {
    const c = E.rel.c;
    E.L = endGeom(E, E.endL, E.rel.l, c === "<--" || c === "<->");
    E.Rr = endGeom(E, E.endR, E.rel.r, c === "-->" || c === "<->");
  });

  /* reparo de chips: chip nao encosta em chip nem em peca alheia. Primeiro se
     afasta da propria peca pela normal, ate 12px; se nao basta, troca de lado —
     so para um lado que nenhuma outra tag da mesma peca ocupa. */
  const tileIds = Object.keys(tiles).sort();
  function tbox(id: string): Box {
    const p = tiles[id];
    return [p[0] - HR, p[1] - HIN, 2 * HR, 2 * HIN];
  }
  const slots: Slot[] = [];
  R.forEach(function (E) {
    slots.push({ E: E, key: "L", e: E.endL });
    slots.push({ E: E, key: "Rr", e: E.endR });
  });
  function geomOf(sl: Slot): EndGeom {
    return sl.E[sl.key];
  }
  function ok(sl: Slot): boolean {
    const en = geomOf(sl);
    if (!en.chip) return true;
    const b = en.chip.box;
    let i: number;
    for (i = 0; i < tileIds.length; i++) if (tileIds[i] !== en.id && boxHit(b, tbox(tileIds[i]))) return false;
    for (i = 0; i < slots.length; i++) {
      if (slots[i] === sl) continue;
      const o = geomOf(slots[i]);
      if (o.chip && boxHit(b, o.chip.box)) return false;
      /* o toco de saida de outra porta (lado -> seta -> linha) tambem e
         obstaculo: uma seta vizinha tampava o F do chip [CF] de Checkout */
      if (segBox(o.P, o.Q, b)) return false;
      if (o.chip && segBox(en.P, en.Q, o.chip.box)) return false;
    }
    return true;
  }
  function regen(sl: Slot): void {
    const c = sl.E.rel.c,
      left = sl.key === "L";
    sl.E[sl.key] = endGeom(sl.E, sl.e, left ? sl.E.rel.l : sl.E.rel.r, left ? c === "<--" || c === "<->" : c === "-->" || c === "<->");
  }
  /* ponta SEM tag cujo toco atravessa o chip de alguem: e ela que tem
     liberdade, entao e ela que troca de lado */
  function stubOk(sl: Slot): boolean {
    const en = geomOf(sl);
    for (let i = 0; i < slots.length; i++) {
      const o = geomOf(slots[i]);
      if (slots[i] !== sl && o.chip && segBox(en.P, en.Q, o.chip.box)) return false;
    }
    return true;
  }
  for (let pass = 0; pass < 3; pass++) {
    let bad = 0;
    slots.forEach(function (sl) {
      if (!sl.e.tags.length || ok(sl)) return;
      const e = sl.e,
        orig = { k: e.k, push: e.push || 0 },
        id = geomOf(sl).id;
      /* lado de QUALQUER outra ponta da peca esta ocupado — nao so o das tags:
         uma tag movida para o lado de uma ponta sem tag voltava a dividir saida */
      const usedK: Record<number, 1> = {};
      (byTile[id] || []).forEach(function (o) {
        if (o !== e) usedK[o.k] = 1;
      });
      const tries: { k: number; push: number }[] = [];
      [4, 8, 12].forEach(function (pu) {
        tries.push({ k: orig.k, push: pu });
      });
      [0, 1, 2, 3, 4, 5]
        .filter(function (k) {
          return k !== orig.k && !usedK[k];
        })
        .sort(function (a, b) {
          return angDiff(sideAng(a), e.ang) - angDiff(sideAng(b), e.ang) || a - b;
        })
        .forEach(function (k) {
          if (angDiff(sideAng(k), e.ang) <= Math.PI * 0.75)
            [0, 4, 8].forEach(function (pu) {
              tries.push({ k: k, push: pu });
            });
        });
      for (let t = 0; t < tries.length; t++) {
        e.k = tries[t].k;
        e.push = tries[t].push;
        regen(sl);
        if (ok(sl)) return;
      }
      e.k = orig.k;
      e.push = orig.push;
      regen(sl);
      bad++;
    });
    slots.forEach(function (sl) {
      if (sl.e.tags.length || stubOk(sl)) return;
      const e = sl.e,
        orig = e.k,
        id = geomOf(sl).id,
        usedK: Record<number, 1> = {};
      (byTile[id] || []).forEach(function (o) {
        if (o !== e) usedK[o.k] = 1;
      });
      const ks = [0, 1, 2, 3, 4, 5]
        .filter(function (k) {
          return k !== orig && !usedK[k];
        })
        .sort(function (a, b) {
          return angDiff(sideAng(a), e.ang) - angDiff(sideAng(b), e.ang) || a - b;
        });
      for (let t = 0; t < ks.length; t++) {
        e.k = ks[t];
        e.stack = 0;
        regen(sl);
        if (stubOk(sl)) return;
      }
      e.k = orig;
      regen(sl);
      bad++;
    });
    if (!bad) break;
  }

  function routeLattice(CHIP_COST: number): void {
    /* passada 2: PELA GRADE. A normal de cada lado do hexagono aponta exatamente
       para o centro da celula vizinha, entao a rota sai da porta pela propria
       grade e anda de centro em centro ate a celula vizinha da outra porta. Toda
       perna fica numa das seis direcoes da colmeia. Curva paga pedagio — a rota
       prefere poucas pernas longas a uma escada —, dividir trecho com outra aresta
       paga caro (na grade, duas linhas no mesmo trecho viram uma so), e a celula
       onde mora o chip de outra peca tambem. */
    const PITCH = C * SQ3,
      usedCell: Record<string, 1> = {},
      usedSeg: Record<string, 1> = {},
      chipCell: Record<string, string> = {};
    function segKey(a: string, b: string): string {
      return a < b ? a + ">" + b : b + ">" + a;
    }
    /* a saida anda quantas celulas o chip e a seta precisam (ate tres), mas
       encurta se for invadir peca ou a saida de outra relacao — chip comprido
       esticava a saida por cima da porta do vizinho */
    const runOwner: Record<string, string> = {};
    function startOf(en: EndGeom, rk: string, partner: string): PortStart {
      const c = geo.cellOf[en.id],
        reach = dist(tiles[en.id], en.Q);
      let s = 1;
      while (s * PITCH < reach - 2 && s < 3) s++;
      function cellAt(i: number): string {
        return kk(c[0] + DIRS[en.k][0] * i, c[1] + DIRS[en.k][1] * i);
      }
      function blocked(i: number): string | boolean {
        const k = cellAt(i);
        return tileAt[k] || (runOwner[k] && runOwner[k] !== rk) || false;
      }
      while (s > 1) {
        let bad = false;
        for (let i = 1; i <= s; i++) if (blocked(i)) bad = true;
        if (!bad) break;
        s--;
      }
      /* nem passa do parceiro: se a celula seguinte fica mais longe dele do que a
         anterior, a saida para ali (senao a rota tem de voltar dando a volta) */
      const pc = geo.cellOf[partner];
      while (s > 1 && hexDist(unkk(cellAt(s)), pc) >= hexDist(unkk(cellAt(s - 1)), pc)) s--;
      const run: string[] = [];
      for (let j = 1; j <= s; j++) {
        run.push(cellAt(j));
        runOwner[cellAt(j)] = rk;
      }
      return { cell: unkk(run[run.length - 1]), run: run };
    }
    /* a saida de cada porta e fixa (lado -> celula vizinha), entao ela entra
       reservada ANTES de rotear: outra aresta pode cruzar, mas paga caro para
       passar por ali, e nunca percorre o mesmo trecho */
    const portCell: Record<string, string> = {};
    /* a celula imediata de TODA porta e reservada antes de qualquer saida
       crescer: reservando relacao por relacao, Warehouse esticava a saida por
       cima da porta de Shipping so por vir antes no alfabeto */
    R.forEach(function (E) {
      [E.L, E.Rr].forEach(function (en) {
        const c = geo.cellOf[en.id],
          k1 = kk(c[0] + DIRS[en.k][0], c[1] + DIRS[en.k][1]);
        if (!runOwner[k1]) runOwner[k1] = E.rk;
      });
    });
    R.forEach(function (E) {
      [E.L, E.Rr].forEach(function (en) {
        en.start = startOf(en, E.rk, en === E.L ? E.rel.r : E.rel.l);
        const c = geo.cellOf[en.id];
        let prev = kk(c[0], c[1]);
        en.start.run.forEach(function (k) {
          (en.chip ? chipCell : portCell)[k] = en.id;
          usedSeg[segKey(prev, k)] = 1;
          prev = k;
        });
      });
    });
    /* meia-volta e permitida, e cara: quando a saida de uma porta ja passou do
       ponto de virar, proibi-la obrigava a rota a contornar a propria peca. O
       trecho repetido some no corte de lacos, logo abaixo. */
    const TURN = [0, 0.5, 1.4, 2.5, 1.4, 0.5];
    /* Desempenho (2026-10-10): o teste "este passo atravessa o chip de outra
       relacao?" rodava contra todos os chips do mapa a cada passo de cada A*, e era
       o grosso do tempo do layout. Os chips nao mudam durante uma passada, entao o
       resultado de cada passo e memorizado: quais relacoes tem chip atravessado por
       ele, na ordem de R. Com CHIP_COST zero o teste nem roda, porque somar zero nao
       muda custo nenhum. A geometria sai identica, byte a byte. */
    const chipBoxes: [number, Box][] = [];
    R.forEach(function (F, fi) {
      [F.L, F.Rr].forEach(function (en) {
        if (en.chip) chipBoxes.push([fi, en.chip.box]);
      });
    });
    const stepHits: Record<number, number[]> = {};
    function hitsOf(stepKey: number, pa: Point, pb: Point): number[] {
      let h = stepHits[stepKey];
      if (h === undefined) {
        h = [];
        for (let ci = 0; ci < chipBoxes.length; ci++) if (segBox(pa, pb, chipBoxes[ci][1])) h.push(chipBoxes[ci][0]);
        stepHits[stepKey] = h;
      }
      return h;
    }
    /* O A* anda por inteiros (2026-10-10): cada celula visitada ganha um numero, e
       o estado e celula*6 + direcao. A versao anterior usava a string 'q,r#d' e a
       quebrava com split a cada passo. Os custos sao somados na mesma ordem e o heap
       recebe os mesmos itens na mesma ordem, entao a rota e a mesma. O que depende so
       da celula (vizinhos, terra, chip e porta) e calculado uma vez por passada. */
    const cid: Record<string, number> = {},
      cQ: number[] = [],
      cR: number[] = [],
      cKey: string[] = [],
      cNb: number[] = [],
      cLand: number[] = [],
      cSeg: (string | null)[] = [];
    function cellId(q: number, r: number): number {
      const key = kk(q, r);
      let id = cid[key];
      if (id === undefined) {
        id = cQ.length;
        cid[key] = id;
        cQ.push(q);
        cR.push(r);
        cKey.push(key);
        cLand.push(land[key] ? 1.12 : 1.0);
        for (let j = 0; j < 6; j++) {
          cNb.push(-2);
          cSeg.push(null);
        }
      }
      return id;
    }
    /* vizinho j da celula: -1 se fora da grade ou ocupado por peca; -2 e "ainda
       nao calculado" */
    function nbOf(id: number, j: number): number {
      let v = cNb[id * 6 + j];
      if (v === -2) {
        const q = cQ[id] + DIRS[j][0],
          r = cR[id] + DIRS[j][1];
        v = !inGrid(q, r) || tileAt[kk(q, r)] ? -1 : cellId(q, r);
        cNb[id * 6 + j] = v;
        if (v >= 0) cSeg[id * 6 + j] = segKey(cKey[id], cKey[v]);
      }
      return v;
    }
    function gridRoute(E: Edge): string[] {
      const A = E.L,
        B = E.Rr,
        own = [E.rel.l, E.rel.r],
        ei = R.indexOf(E);
      const sK = kk(A.start.cell[0], A.start.cell[1]),
        gK = kk(B.start.cell[0], B.start.cell[1]);
      const finalDir = (B.k + 3) % 6,
        gq = B.start.cell[0],
        gr = B.start.cell[1];
      const gId = cellId(gq, gr);
      function h(id: number): number {
        const dq = cQ[id] - gq,
          dr = cR[id] - gr;
        return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
      }
      const open = new Heap(),
        g = new Map<number, number>(),
        from = new Map<number, number>(),
        s0 = cellId(A.start.cell[0], A.start.cell[1]) * 6 + A.k;
      let best: { cost: number; st: number } | null = null;
      g.set(s0, 0);
      open.push([h((s0 / 6) | 0), s0]);
      while (open.a.length) {
        const top = open.pop(),
          st = top[1];
        if (st === -1) break;
        const cc = (st / 6) | 0,
          d = st - cc * 6,
          gs = g.get(st) as number;
        if (top[0] > gs + h(cc) + 1e-9) continue;
        if (cc === gId) {
          const fin = gs + TURN[(finalDir - d + 6) % 6];
          if (best === null || fin < best.cost - 1e-9) {
            best = { cost: fin, st: st };
            open.push([fin, -1]);
          }
          continue;
        }
        for (let j = 0; j < 6; j++) {
          const tc = TURN[(j - d + 6) % 6];
          const n = nbOf(cc, j);
          if (n < 0) continue;
          const nk = cKey[n];
          let cost = cLand[n] + tc;
          const nn = near[nk];
          if (nn) {
            for (let ni = 0; ni < nn.length; ni++)
              if (own.indexOf(nn[ni]) < 0) {
                cost += 0.6;
                break;
              }
          }
          if (chipCell[nk] && own.indexOf(chipCell[nk]) < 0) cost += 5;
          if (portCell[nk] && own.indexOf(portCell[nk]) < 0) cost += 6;
          if (usedCell[nk]) cost += 0.35;
          if (usedSeg[cSeg[cc * 6 + j] as string]) cost += 3;
          /* passo que atravessa o chip de OUTRA relacao: o chip pode avancar
             sobre o corredor entre celulas, e a reserva de celula nao o cobre */
          if (CHIP_COST) {
            const hs = hitsOf(cc * 6 + j, px(cQ[cc], cR[cc]), px(cQ[n], cR[n]));
            for (let hi = 0; hi < hs.length; hi++)
              if (hs[hi] !== ei) {
                cost += CHIP_COST;
                break;
              }
          }
          const ns = n * 6 + j,
            ng = gs + cost,
            old = g.get(ns);
          if (old === undefined || ng < old - 1e-9) {
            g.set(ns, ng);
            from.set(ns, st);
            open.push([ng + h(n), ns]);
          }
        }
      }
      if (!best) return [sK, gK];
      const cells: string[] = [];
      let k: number | undefined = (best as { cost: number; st: number }).st;
      while (k !== undefined) {
        cells.push(cKey[(k / 6) | 0]);
        k = from.get(k);
      }
      return cells.reverse();
    }
    function collinear(a: Point, b: Point, c: Point): boolean {
      return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-3 * dist(a, c) * dist(a, c) + 0.5;
    }
    R.forEach(function (E) {
      const cells = gridRoute(E);
      const all = E.L.start.run.slice(0, -1).concat(cells, E.Rr.start.run.slice(0, -1).reverse());
      /* laco: quando as saidas das duas pontas se cruzam, a rota passava duas
         vezes pela mesma celula — corta o trecho entre as duas passagens */
      for (let a = 0; a < all.length; a++) {
        const b = all.lastIndexOf(all[a]);
        if (b > a) all.splice(a + 1, b - a);
      }
      all.forEach(function (k) {
        usedCell[k] = 1;
      });
      for (let i = 0; i < all.length - 1; i++) usedSeg[segKey(all[i], all[i + 1])] = 1;
      const pts: Point[] = [E.L.P].concat(
        all.map(function (k) {
          const c = unkk(k);
          return px(c[0], c[1]);
        }),
        [E.Rr.P],
      );
      const out: Point[] = [pts[0]];
      for (let j = 1; j < pts.length - 1; j++) if (!collinear(out[out.length - 1], pts[j], pts[j + 1])) out.push(pts[j]);
      out.push(pts[pts.length - 1]);
      E.path = out;
      E.cells = all;
    });
  }

  /* Duas passadas. Rotear ja com custo para atravessar chip alheio fazia a
     linha contornar o obstaculo: Routes -> Shipping dava volta de 2,3x so
     porque o chip de Warehouse estava plantado no corredor natural entre os
     dois. Quem deve sair do caminho e o chip, nao a linha. Entao: 1) rota
     sem custo de chip, para achar os corredores naturais; 2) chip atravessado
     por corredor alheio se afasta ou troca de lado; 3) rota de novo, agora
     com o custo, que so pesa onde o chip nao teve para onde ir. */
  routeLattice(0);
  function linesOk(sl: Slot): boolean {
    const en = geomOf(sl);
    if (!en.chip) return true;
    for (let i = 0; i < R.length; i++) {
      if (R[i] === sl.E) continue;
      const pth = R[i].path;
      for (let j = 0; j < pth.length - 1; j++) if (segBox(pth[j], pth[j + 1], en.chip.box)) return false;
    }
    return true;
  }
  slots.forEach(function (sl) {
    if (!sl.e.tags.length || linesOk(sl)) return;
    const e = sl.e,
      orig = { k: e.k, push: e.push || 0 },
      id = geomOf(sl).id,
      usedK: Record<number, 1> = {};
    (byTile[id] || []).forEach(function (o) {
      if (o !== e) usedK[o.k] = 1;
    });
    const tries: { k: number; push: number }[] = [];
    [4, 8, 12].forEach(function (pu) {
      tries.push({ k: orig.k, push: orig.push + pu });
    });
    [0, 1, 2, 3, 4, 5]
      .filter(function (k) {
        return k !== orig.k && !usedK[k];
      })
      .sort(function (a, b) {
        return angDiff(sideAng(a), e.ang) - angDiff(sideAng(b), e.ang) || a - b;
      })
      .forEach(function (k) {
        if (angDiff(sideAng(k), e.ang) <= Math.PI * 0.75)
          [0, 4, 8].forEach(function (pu) {
            tries.push({ k: k, push: pu });
          });
      });
    for (let t = 0; t < tries.length; t++) {
      e.k = tries[t].k;
      e.push = tries[t].push;
      regen(sl);
      if (ok(sl) && linesOk(sl)) return;
    }
    e.k = orig.k;
    e.push = orig.push;
    regen(sl);
  });
  routeLattice(8);
  geo.rels = R;
  geo.congested = congested;
}
