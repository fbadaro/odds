/**
 * O layout da colmeia-v4: tudo sai da forma canônica. Massas por domínio, domínios
 * em prateleira, empacotamento dos territórios, colocação das peças e, por fim, as
 * arestas (route.ts). Porte literal de `layoutAt`/`layout`.
 */
import { C, DIRS, HR, MIN_STEP, SQ3, hexDist, kk, pixelToAxial, px } from "./hex.js";
import { clone, cmp, dist, distPS, tieLess } from "./geometry.js";
import { canon, prep } from "./canon.js";
import { extAt, extentFn, layoutMasses, massesOf } from "./masses.js";
import { centroidOf, dilateFill, erode, fillMassHoles, interiorCells, packMass, regionOf } from "./territories.js";
import { routeAll } from "./route.js";
import type { Axial, CanonModel, Geometry, Group, Island, LayoutModel, Mass, Point, PreparedDomain } from "./types.js";

/* ---------------- layout: tudo sai da forma canonica ---------------- */
export const LAMBDA = 1.0; /* puxada para o centro do territorio, contra a puxada dos parceiros */
export const EDGE_TOLL = 40; /* pedagio de celula na orla do territorio, em px (~0,8 celula) */
export const CLOSE_TOLL = 150; /* pedagio de parceiro a menos de tres celulas: abaixo disso, dois chips frente a frente nao cabem na grade */
export const CLR = HR + 3; /* folga minima entre aresta e peca que nao e dela */

interface Box4 {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
interface Prepared {
  dom: PreparedDomain;
  masses: Mass[];
  box: Box4;
  massOfCtx: Record<string, Mass>;
  w: number;
  h: number;
  origin: Point;
}
interface Scored {
  sc: number;
  i: number;
  ang: number;
  snap: { c: Point; ext: number[] }[];
}

export function layoutAt(cm: CanonModel): Geometry {
  const rels = cm.mapping,
    partners: Record<string, string[]> = {},
    deg: Record<string, number> = {};
  rels.forEach(function (rel) {
    (partners[rel.l] = partners[rel.l] || []).push(rel.r);
    (partners[rel.r] = partners[rel.r] || []).push(rel.l);
    deg[rel.l] = (deg[rel.l] || 0) + 1;
    deg[rel.r] = (deg[rel.r] || 0) + 1;
  });
  Object.keys(partners).forEach(function (k) {
    partners[k].sort();
  });

  /* 1. cada dominio: massas, e o angulo do external escolhido pelo grafo */
  const prepared: Prepared[] = cm.domains.map(function (dom) {
    const masses = massesOf(dom);
    const massOfCtx: Record<string, Mass> = {};
    masses.forEach(function (m) {
      m.groups.forEach(function (g) {
        g.sd.ids.forEach(function (id) {
          massOfCtx[id] = m;
        });
      });
    });
    /* O angulo do external continua saindo do grafo, mas so das relacoes do
       proprio external — e numa edicao dessas ele e uma das pontas, entao pode
       andar. Tres coisas mudaram da v3 para que SO ele ande: a distancia vai
       ate o TERRITORIO do parceiro (o arranjo agora e fixo, a massa inteira nao
       diz mais onde ele esta); atravessar QUALQUER massa paga, nao so o core; e
       o external e posto por ultimo, no raio dele, sem empurrar ninguem
       (layoutMasses). Duas candidatas novas, 0 e PI, ao lado das massas. */
    const extM = masses.filter(function (m) {
      return m.external;
    })[0];
    const groupOfCtx: Record<string, Group> = {};
    masses.forEach(function (m) {
      m.groups.forEach(function (g) {
        g.sd.ids.forEach(function (id) {
          groupOfCtx[id] = g;
        });
      });
    });
    const cands = extM
      ? [0.5, 0.33, 0.67, 0.17, 0.83, 1.5, 1.33, 1.67, 1.17, 1.83, 0, 1].map(function (x) {
          return x * Math.PI;
        })
      : [0.5 * Math.PI];
    const scored: Scored[] = [];
    cands.forEach(function (ang, ci) {
      masses.forEach(function (m) {
        m.ext = null;
        /* a v4 zera o centro aqui; layoutMasses o repõe em toda massa */
        m.c = null as unknown as Point;
      });
      layoutMasses(masses, ang);
      const tmp: Record<string, Group> = {};
      masses.forEach(function (m) {
        packMass(m, [0, 0], tmp);
      });
      masses.forEach(function (m) {
        m.ext = extentFn(m);
      });
      const rad = layoutMasses(masses, ang);
      masses.forEach(function (m) {
        const t: Record<string, Group> = {};
        packMass(m, [0, 0], t);
      });
      let sc = rad * 0.35;
      if (extM)
        rels.forEach(function (rel) {
          const a = groupOfCtx[rel.l],
            b = groupOfCtx[rel.r];
          if (!a || !b || a.mass === b.mass) return;
          if (a.mass !== extM && b.mass !== extM) return;
          const other = a.mass === extM ? b : a;
          const tgt = other.seed;
          sc += dist(extM.c, tgt);
          masses.forEach(function (m) {
            if (m === extM || m === other.mass) return;
            const rr = Math.min(...(m.ext as number[]));
            if (distPS(m.c, extM.c, tgt) < rr * 0.9) sc += 2 * Math.max(...(m.ext as number[]));
          });
        });
      scored.push({
        sc: sc,
        i: ci,
        ang: ang,
        snap: masses.map(function (m) {
          return { c: m.c.slice() as Point, ext: (m.ext as number[]).slice() };
        }),
      });
    });
    scored.sort(function (a, b) {
      return a.sc - b.sc || a.i - b.i;
    });
    masses.forEach(function (m, i) {
      m.c = scored[0].snap[i].c;
      m.ext = scored[0].snap[i].ext;
    });
    const bx: Box4 = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    masses.forEach(function (m) {
      bx.minX = Math.min(bx.minX, m.c[0] - extAt(m, Math.PI));
      bx.maxX = Math.max(bx.maxX, m.c[0] + extAt(m, 0));
      bx.minY = Math.min(bx.minY, m.c[1] - extAt(m, -Math.PI / 2));
      bx.maxY = Math.max(bx.maxY, m.c[1] + extAt(m, Math.PI / 2));
    });
    return { dom: dom, masses: masses, box: bx, massOfCtx: massOfCtx } as Prepared;
  });

  /* 2. dominios em prateleira, em ordem de id; o numero de linhas sai da
        proporcao da tela. v4: a v3 testava toda ordem de dominios pela
        distancia das ligacoes entre eles — uma busca fatorial (8 dominios, um
        segundo; 10, nao termina) e uma escolha discreta que uma relacao entre
        dois dominios podia virar, levando o terceiro junto. */
  const HALO = C * SQ3,
    pitch = 2 * HALO + 34;
  prepared.forEach(function (pr) {
    pr.w = pr.box.maxX - pr.box.minX + pitch;
    pr.h = pr.box.maxY - pr.box.minY + pitch;
  });
  let bestOrg: Record<number, Point> | null = null,
    bestSc = Infinity;
  const order = prepared.map(function (_, i) {
    return i;
  });
  for (let k = 1; k <= prepared.length; k++) {
    const per = Math.ceil(prepared.length / k),
      rows: number[][] = [];
    let i: number;
    for (i = 0; i < order.length; i += per) rows.push(order.slice(i, i + per));
    if (rows.length !== k) continue;
    /* linha mais curta que a mais larga fica CENTRADA: encostada a esquerda
       ela deixava um quadrante vazio e esticava as ligacoes entre dominios */
    const org: Record<number, Point> = {};
    let yCur = 0,
      W = 0;
    rows.forEach(function (row) {
      W = Math.max(
        W,
        row.reduce(function (a, ix) {
          return a + prepared[ix].w;
        }, 0),
      );
    });
    rows.forEach(function (row) {
      const h = Math.max(
        ...row.map(function (ix) {
          return prepared[ix].h;
        }),
      );
      let xCur =
        (W -
          row.reduce(function (a, ix) {
            return a + prepared[ix].w;
          }, 0)) /
        2;
      row.forEach(function (ix) {
        const pr = prepared[ix];
        org[ix] = [xCur + pr.w / 2, yCur + h / 2];
        xCur += pr.w;
      });
      yCur += h;
    });
    const sc = Math.abs(Math.log(W / yCur / 1.4));
    if (sc < bestSc - 1e-6) {
      bestSc = sc;
      bestOrg = org;
    }
  }
  prepared.forEach(function (pr, ix) {
    const o = (bestOrg as Record<number, Point>)[ix];
    pr.origin = [o[0] - (pr.box.minX + pr.box.maxX) / 2, o[1] - (pr.box.minY + pr.box.maxY) / 2];
  });
  /* v4, localidade: o mapa e ancorado no hub do primeiro dominio, nao no canto
     da caixa. Com a caixa como referencia, o external trocar de angulo
     recentrava o dominio inteiro e todas as pecas "andavam" sem sair do lugar
     relativo. Coordenada estavel e trabalho do layout; enquadrar e da camera. */
  const anchor: Point = prepared.length ? (prepared[0].origin.slice() as Point) : [0, 0];
  /* e cada origem cai num ponto da grade: assim um dominio que a prateleira
     desloca anda INTEIRO, sem ser reempacotado num encaixe diferente da grade */
  prepared.forEach(function (pr) {
    const o: Point = [pr.origin[0] - anchor[0], pr.origin[1] - anchor[1]],
      ax = pixelToAxial(o[0], o[1]);
    pr.origin = px(ax[0], ax[1]);
  });

  /* 3. empacota de verdade */
  const groupOf: Record<string, Group> = {};
  prepared.forEach(function (pr) {
    pr.masses.forEach(function (m) {
      m.groups.forEach(function (g) {
        g.sd.ids.forEach(function (id) {
          groupOf[id] = g;
        });
      });
    });
  });
  const occupied: Record<string, Group> = {},
    groups: Group[] = [];
  prepared.forEach(function (pr) {
    pr.masses.forEach(function (m) {
      packMass(m, pr.origin, occupied);
      fillMassHoles(m);
    });
    pr.masses.forEach(function (m) {
      m.groups.forEach(function (g) {
        if (g.cells.length) groups.push(g);
      });
    });
  });

  /* 4. pecas: cada contexto vai para a celula do proprio territorio que minimiza
        a distancia aos parceiros, com a puxada LAMBDA para o centro. Tres
        varreduras de reparo com os outros fixos.
     v4, localidade: cada territorio se resolve SOZINHO. Na v3 a colocacao era
     uma passada gulosa unica sobre o mapa inteiro — a ordem global, o
     espacamento contra pecas de outro territorio e a puxada para a posicao
     exata do parceiro faziam um contexto novo em Vendas mexer em Expedicao. Agora
     uma peca so le o proprio territorio: parceiro de fora puxa para o CENTRO do
     territorio dele (que so muda no degrau), e a distancia a peca alheia vira
     regra de terreno — peca nao senta em celula vizinha de territorio alheio, o
     que ja garante tres celulas entre portas de territorios diferentes. */
  prepared.forEach(function (pr) {
    pr.masses.forEach(function (m) {
      m.groups.forEach(function (g) {
        g.key = pr.dom.id + "/" + g.sd.id;
        g.dom = pr.dom.id;
      });
    });
  });
  const ctxs: { id: string; g: Group }[] = [],
    sig: Record<string, string> = {};
  groups.forEach(function (g) {
    g.sd.ids.forEach(function (id) {
      ctxs.push({ id: id, g: g });
    });
  });
  /* A ordem dentro do territorio decide quem escolhe celula primeiro. Grau,
     depois a ASSINATURA (em que territorios estao os parceiros), e so entao o
     nome. Renomear nao muda grau nem assinatura: so troca de lugar com um gemeo
     estrutural, se houver — o empate que a ordem do arquivo nao pode desfazer,
     porque embaralhar o arquivo nao pode mover nada. */
  ctxs.forEach(function (cx) {
    sig[cx.id] = (partners[cx.id] || [])
      .map(function (q) {
        return groupOf[q] ? groupOf[q].key : "?";
      })
      .sort()
      .join(",");
  });
  ctxs.sort(function (a, b) {
    return (deg[b.id] || 0) - (deg[a.id] || 0) || cmp(sig[a.id], sig[b.id]) || cmp(a.id, b.id);
  });
  const pos: Record<string, Point> = {},
    cellOf: Record<string, Axial> = {};
  groups.forEach(function (g) {
    g.ct = centroidOf(g.cells, g.pos);
  });
  /* Tres termos, e a calibragem veio da primeira captura: com a puxada dos
     parceiros SOMADA, contexto de grau alto fugia para a orla do territorio e o
     miolo ficava vazio. Agora ela e media (grau nao vira forca), celula de orla
     paga pedagio, e parceiro a duas celulas paga tambem — duas portas frente a
     frente precisam de seta, respiro, chip e um pedaco de linha entre elas. */
  const interiorOf: Record<string, 1> = {},
    ownerOf: Record<string, Group> = {},
    borderOf: Record<string, 1> = {};
  groups.forEach(function (g) {
    interiorCells(g).forEach(function (c) {
      interiorOf[kk(c[0], c[1])] = 1;
    });
    g.cells.forEach(function (c) {
      ownerOf[kk(c[0], c[1])] = g;
    });
  });
  groups.forEach(function (g) {
    g.cells.forEach(function (c) {
      for (let j = 0; j < 6; j++) {
        const o = ownerOf[kk(c[0] + DIRS[j][0], c[1] + DIRS[j][1])];
        if (o && o !== g) {
          borderOf[kk(c[0], c[1])] = 1;
          break;
        }
      }
    });
  });
  function place(cx: { id: string; g: Group }): void {
    const g = cx.g,
      ps = partners[cx.id] || [];
    let bestC: Axial | null = null,
      bs = Infinity,
      fb: Axial | null = null,
      fs = -1;
    g.cells.forEach(function (c) {
      const key = kk(c[0], c[1]),
        p = g.pos[key];
      let dmin = Infinity;
      for (const id in cellOf) {
        if (id === cx.id || groupOf[id] !== g) continue;
        dmin = Math.min(dmin, hexDist(c, cellOf[id]));
      }
      let s = LAMBDA * dist(p, g.ct) + (interiorOf[key] ? 0 : EDGE_TOLL),
        pull = 0;
      /* Parceiro no external nao puxa: o external gira quando QUALQUER relacao
         dele muda, e a puxada levaria junto quem conversa com ele por outra
         relacao (remover Stripe → Pagamentos movia Expedicao). Parceiro em
         OUTRO dominio tambem nao: a prateleira desloca dominios inteiros, e a
         puxada reorganizaria o de dentro — com ela fora, o dominio anda rigido. */
      let np = 0;
      ps.forEach(function (q) {
        const mine = groupOf[q] === g;
        if (!mine && ((groupOf[q].mass.external && !g.mass.external) || groupOf[q].dom !== g.dom)) return;
        np++;
        pull += dist(p, mine && pos[q] ? pos[q] : groupOf[q].ct);
        if (mine && cellOf[q] && hexDist(c, cellOf[q]) < 3) s += CLOSE_TOLL;
      });
      if (np) s += pull / np;
      if (!borderOf[key] && dmin >= MIN_STEP && tieLess(s, c, bs, bestC, g.mass.base)) {
        bs = s;
        bestC = c;
      }
      if (tieLess(-dmin, c, -fs, fb, g.mass.base)) {
        fs = dmin;
        fb = c;
      }
    });
    const c = (bestC || fb) as unknown as Axial;
    cellOf[cx.id] = c;
    pos[cx.id] = g.pos[kk(c[0], c[1])];
  }
  ctxs.forEach(place);
  for (let sweep = 0; sweep < 3; sweep++) {
    let changed = false;
    ctxs.forEach(function (cx) {
      const before = cellOf[cx.id].join();
      delete cellOf[cx.id];
      delete pos[cx.id];
      place(cx);
      if (cellOf[cx.id].join() !== before) changed = true;
    });
    if (!changed) break;
  }

  const islands: Island[] = prepared.map(function (pr) {
    const domCells: Record<string, 1> = {};
    pr.masses.forEach(function (m) {
      if (m.external) return;
      m.groups.forEach(function (g) {
        g.cells.forEach(function (c) {
          domCells[kk(c[0], c[1])] = 1;
        });
      });
    });
    return {
      dom: pr.dom,
      masses: pr.masses,
      region: Object.keys(domCells).length ? regionOf(erode(dilateFill(domCells, 3), 2)) : null,
    };
  });

  const geo = {
    cm: cm,
    islands: islands,
    groups: groups,
    tiles: pos,
    cellOf: cellOf,
    groupOf: groupOf,
    partners: partners,
  } as Geometry;
  routeAll(geo);
  return geo;
}

/** A `Geometry` de um modelo sem domínio desenhável. Única divergência do porte
    (plano, Task 3): a v4 lança exceção quando nenhum domínio tem massa (`hub`
    indefinido), e uma relação sem peça quebraria o roteamento; aqui sai vazio. */
function emptyGeometry(cm: CanonModel): Geometry {
  return { cm: cm, islands: [], groups: [], tiles: {}, cellOf: {}, groupOf: {}, partners: {}, rels: [], congested: 0 };
}

/* Tentado e recusado: gerar tres layouts e ficar com o de menos cruzamentos.
   Cruzamentos caiam (7 -> 2 no dominio unico), mas o criterio e caotico — uma
   relacao que nem toca o external mudava a contagem, o angulo saltava e 17 de 17
   pecas se moviam. Cada escolha discreta que olha o mapa inteiro e mais um ponto
   de salto. O angulo agora depende so das relacoes do proprio external. */
/**
 * A colmeia de um modelo. Equivale, na v4, a
 * `layout(canon(declared("__live", "clean", 0, 0)))` com `MODELS.__live = model`:
 * `declared` sem variante, sem relação extra e sem embaralhar é `prep(clone(model))`.
 * Não muta `model`.
 */
export function layout(model: LayoutModel): Geometry {
  const cm = canon(prep(clone(model)));
  if (
    !cm.domains.some(function (d) {
      return massesOf(d).length;
    })
  )
    return emptyGeometry(cm);
  return layoutAt(cm);
}
