/**
 * As propriedades da colmeia como testes do pacote: as famílias 3 a 6 de
 * docs/design/pages/colmeia-v4.check.mjs, com os mesmos limites e as mesmas contagens.
 * As famílias 1 e 2 testam âncoras da própria página v4 e ficam com ela.
 *
 *   3. invariância — N_SHUFFLE ordens de declaração dão as mesmas posições de peça
 *      (e o validador, o mesmo veredito por âncora);
 *   4. a régua da v2 — cruzamentos e arestas sobre peça alheia caem pelo menos à metade;
 *   5. composição — rótulo × rótulo, rótulo × peça, chip × chip, chip × peça alheia...;
 *   6. localidade — cada edição só move o que lhe diz respeito; o degrau de capacidade
 *      e o domínio deslocado por um vetor único são contados à parte.
 */
import { describe, expect, it } from "vitest";
import { parseAndValidate } from "@odds/core";
import { anchorsOf, layout, measure, movedTiles, placeLabels, targetOf, tierOf } from "@odds/layout";
import type { CanonModel, Geometry, PreparedModel, TargetedDiagnostic, ViewOptions } from "@odds/layout";
import { BREAKS, canon, declared, EXTRA, sourceOf } from "@odds/layout/fixtures";
import { buildSvg } from "../src/render.js";

const N_SHUFFLE = 24;
const KEYS: [string, string][] = [
  ["one", "clean"],
  ["one", "broken"],
  ["many", "clean"],
];

type Span = { start: { line: number; column: number }; end: { line: number; column: number } };
const spanEq = (a: Span, b: Span) =>
  a.start.line === b.start.line && a.start.column === b.start.column && a.end.line === b.end.line && a.end.column === b.end.column;

describe("3. invariância: a ordem de declaração não move nada", () => {
  for (const [model, file] of KEYS) {
    it(`${model}:${file} — ${N_SHUFFLE} embaralhamentos`, { timeout: 30_000 }, () => {
      const src0 = sourceOf(declared(model, file, 0, 0), "today");
      const res0 = parseAndValidate(src0.text);
      const runs = [];
      for (let s = 1; s <= N_SHUFFLE; s++) {
        const dm = declared(model, file, s, 0);
        const src = sourceOf(dm, "today");
        runs.push({ dm, src, res: parseAndValidate(src.text) });
      }
      // a identidade de um diagnóstico é a âncora que continua certa em TODA ordem
      const anchors = res0.diagnostics.map((d) =>
        Object.keys(src0.anchors)
          .filter((k) => spanEq(src0.anchors[k]!, d.span))
          .filter((k) => runs.every((r) => r.src.anchors[k] && r.res.diagnostics.some((x) => x.code === d.code && spanEq(x.span, r.src.anchors[k]!)))),
      );
      anchors.forEach((a, i) => expect(a.length, `${res0.diagnostics[i]!.code} sem âncora estável`).toBeGreaterThan(0));

      const ref = layout(canon(declared(model, file, 0, 0))).tiles;
      /* o veredito de uma ordem, em `code@âncora`: cada diagnóstico vai para a âncora
         estável cujo span, NESTA ordem, é o dele; sem âncora vira `?` e diverge */
      const verdictOf = (res: typeof res0, anchorsOfRun: Record<string, Span>) =>
        res.diagnostics
          .map((d) => `${d.code}@${anchors.map((a) => a[0]!).find((k) => spanEq(anchorsOfRun[k]!, d.span)) ?? "?"}`)
          .sort()
          .join();
      const refVerdict = verdictOf(res0, src0.anchors);
      let moved = 0, verdictDrift = 0;
      for (const { dm, src, res } of runs) {
        moved += movedTiles(ref, layout(canon(dm)).tiles).length;
        if (verdictOf(res, src.anchors) !== refVerdict) verdictDrift++;
      }
      expect({ moved, verdictDrift }).toEqual({ moved: 0, verdictDrift: 0 });
    });
  }
});

describe("4. a régua da v2", () => {
  const V2: Record<string, { crossings: number; overTile: number }> = { one: { crossings: 13, overTile: 7 }, many: { crossings: 7, overTile: 7 } };
  // o que o script imprime hoje: [régua] e [estabilidade] só registram, aqui são fixados
  const PRINTED: Record<string, { crossings: number; overTile: number; maxLen: string; detour: string; detourOf: string }> = {
    one: { crossings: 1, overTile: 0, maxLen: "15.0", detour: "1.88", detourOf: "Checkout|PaymentGateway" },
    many: { crossings: 1, overTile: 0, maxLen: "20.0", detour: "1.25", detourOf: "FleetOps|Routes" },
  };
  const STABILITY: Record<string, number[]> = { one: [6, 6, 0], many: [2, 2, 0] };
  for (const model of ["one", "many"]) {
    it(`${model}: cruzamentos e arestas sobre peça alheia caem à metade da v2`, () => {
      const m = measure(layout(canon(declared(model, "clean", 0, 0))));
      const base = V2[model]!;
      expect(m.detour, `${m.detourOf} anda ${m.detour.toFixed(2)}× a reta`).toBeLessThanOrEqual(2);
      expect(m.crossings * 2).toBeLessThanOrEqual(base.crossings);
      expect(m.overTile * 2, m.overList.join("; ")).toBeLessThanOrEqual(base.overTile);
      expect(m.congested).toBe(0);
      const p = PRINTED[model]!;
      expect({ crossings: m.crossings, overTile: m.overTile, maxLen: m.maxLen.toFixed(1), detour: m.detour.toFixed(2), detourOf: m.detourOf }).toEqual(p);
    });
    it(`${model}: estabilidade — uma relação a mais move poucas peças`, () => {
      const geo = layout(canon(declared(model, "clean", 0, 0)));
      const counts = EXTRA[model]!.map((_, i) => movedTiles(geo.tiles, layout(canon(declared(model, "clean", 0, i + 1))).tiles).length);
      expect(counts).toEqual(STABILITY[model]);
    });
  }
});

describe("5. composição", () => {
  type Box = number[];
  const hit = (a: Box, b: Box) => a[0]! < b[0]! + b[2]! && b[0]! < a[0]! + a[2]! && a[1]! < b[1]! + b[3]! && b[1]! < a[1]! + a[3]!;
  const tileBox = (g: Geometry, id: string): Box => {
    const p = g.tiles[id]!;
    return [p[0] - 28, p[1] - 24.2, 56, 48.4];
  };
  const segHitsBox = (a: number[], b: number[], box: Box) => {
    const [x0, y0, x1, y1] = [box[0]!, box[1]!, box[0]! + box[2]!, box[1]! + box[3]!];
    const inside = (p: number[]) => p[0]! >= x0 && p[0]! <= x1 && p[1]! >= y0 && p[1]! <= y1;
    if (inside(a) || inside(b)) return true;
    for (let t = 0; t <= 1; t += 0.05) if (inside([a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t])) return true;
    return false;
  };
  /* Os selos de aresta saem do desenho (buildSvg escreve em geo.badges), com os
     diagnósticos que o validador dá à fonte. */
  const badgesOf = (model: string, file: string) => {
    const dm = declared(model, file, 0, 0);
    const g = layout(canon(dm));
    const r = parseAndValidate(sourceOf(dm, "today").text);
    const anchors = anchorsOf(r.ast!);
    const diags: TargetedDiagnostic[] = r.diagnostics.map((d) => ({ code: d.code, severity: d.severity, data: d.data, span: d.span, target: targetOf(d, anchors) }));
    const opts: ViewOptions = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };
    buildSvg(g, diags, opts);
    return g;
  };
  const SELOS: Record<string, number> = { "one:broken": 3, "many:clean": 0 };

  for (const model of ["one", "many"]) {
    for (const file of BREAKS[model] ? ["clean", "broken"] : ["clean"]) {
      it(`${model}:${file}: sem colisões`, () => {
        const geo = layout(canon(declared(model, file, 0, 0)));
        const lab = placeLabels(geo, { edges: true, tags: true, ctxLabels: true, subLabels: true, subSize: 13 });
        const ids = Object.keys(geo.tiles).sort();
        const labs = Object.entries(lab.labels);
        const chips: { id: string; rk: string; box: Box }[] = [];
        geo.rels.forEach((E) => [E.L, E.Rr].forEach((en) => { if (en.chip) chips.push({ id: en.id, rk: E.rk, box: en.chip.box }); }));
        const problems: string[] = [];
        for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++)
          if (hit(labs[i]![1].box, labs[j]![1].box)) problems.push(`rótulo ${labs[i]![0]} × rótulo ${labs[j]![0]}`);
        for (const [id, L] of labs) for (const o of ids) if (o !== id && hit(L.box, tileBox(geo, o))) problems.push(`rótulo ${id} × peça ${o}`);
        for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++)
          if (hit(chips[i]!.box, chips[j]!.box)) problems.push(`chip ${chips[i]!.rk}:${chips[i]!.id} × chip ${chips[j]!.rk}:${chips[j]!.id}`);
        for (const c of chips) for (const o of ids) if (o !== c.id && hit(c.box, tileBox(geo, o))) problems.push(`chip ${c.rk}:${c.id} × peça ${o}`);
        /* chip × toco de saída de outra porta */
        geo.rels.forEach((E) => [E.L, E.Rr].forEach((en) => {
          for (const c of chips) if (!(c.rk === E.rk && c.id === en.id) && segHitsBox(en.P, en.Q, c.box)) problems.push(`chip ${c.rk}:${c.id} × toco ${E.rk}:${en.id}`);
        }));
        for (const [id, L] of labs) for (const c of chips) if (hit(L.box, c.box)) problems.push(`rótulo ${id} × chip ${c.rk}:${c.id}`);
        /* título de subdomínio × peça e chip */
        for (const sp of lab.subSpots) {
          for (const o of ids) if (hit(sp.box, tileBox(geo, o))) problems.push(`título ${sp.id} × peça ${o}`);
          for (const c of chips) if (hit(sp.box, c.box)) problems.push(`título ${sp.id} × chip ${c.rk}:${c.id}`);
        }
        /* linha × chip de outra relação */
        geo.rels.forEach((E) => {
          for (let i = 0; i < E.path.length - 1; i++)
            for (const c of chips) if (c.rk !== E.rk && segHitsBox(E.path[i]!, E.path[i + 1]!, c.box)) problems.push(`linha ${E.rk} × chip ${c.rk}:${c.id}`);
        });
        /* na grade, duas arestas no mesmo trecho viram uma linha só */
        const seen: Record<string, string[]> = {};
        geo.rels.forEach((E) => {
          for (let i = 0; i < E.cells.length - 1; i++) {
            const a = E.cells[i]!, b = E.cells[i + 1]!;
            (seen[a < b ? a + ">" + b : b + ">" + a] ||= []).push(E.rk);
          }
        });
        for (const [k, list] of Object.entries(seen)) if (list.length > 1) problems.push(`trecho ${k} dividido por ${list.join(" e ")}`);
        const d2 = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
        for (const [id, L] of labs) {
          const bc = [L.box[0]! + L.box[2]! / 2, L.box[1]! + L.box[3]! / 2], own = d2(bc, geo.tiles[id]!);
          const closer = ids.filter((o) => o !== id && d2(bc, geo.tiles[o]!) < own);
          if (closer.length) problems.push(`rótulo ${id} mais perto de ${closer.join(", ")} do que da própria peça`);
        }
        /* selo de veredito sobre a aresta, no arquivo que tem erros quando há */
        const bfile = BREAKS[model] ? "broken" : "clean";
        if (file === bfile) {
          const g2 = badgesOf(model, bfile);
          const obst: [string, Box][] = Object.keys(g2.tiles).map((id) => [`peça ${id}`, tileBox(g2, id)]);
          g2.rels.forEach((E) => [E.L, E.Rr].forEach((en) => { if (en.chip) obst.push([`chip ${E.rk}:${en.id}`, en.chip.box]); }));
          for (const b of g2.badges!) {
            const box = [b.p[0] - 8.5, b.p[1] - 8.5, 17, 17];
            for (const [nm, o] of obst) if (hit(box, o)) problems.push(`selo ${b.rk} × ${nm}`);
          }
          expect(g2.badges!.length, "selos de aresta").toBe(SELOS[`${model}:${bfile}`]);
        }
        expect(problems).toEqual([]);
      });
    }
  }
});

describe("6. localidade (condição de aceite do ADR-0009)", () => {
  type M = PreparedModel;
  function groupsOf(m: M) {
    const groupOf: Record<string, string> = {}, members: Record<string, string[]> = {}, domOf: Record<string, string> = {};
    m.domains.forEach((d) => {
      d.subdomains.forEach((sd) => { const k = d.id + "/" + sd.id; members[k] = sd.ids.slice(); sd.ids.forEach((id) => { groupOf[id] = k; domOf[id] = d.id; }); });
      if (d.externalIds.length) { const k = d.id + "/external"; members[k] = d.externalIds.slice(); d.externalIds.forEach((id) => { groupOf[id] = k; domOf[id] = d.id; }); }
    });
    return { groupOf, members, domOf };
  }
  function listOf(m: M, k: string): { id: string }[] {
    const [did, sid] = k.split("/");
    const d = m.domains.find((x) => x.id === did)!;
    return sid === "external" ? d.external : d.subdomains.find((s) => s.id === sid)!.contexts;
  }
  interface Edit { kind: "contexto" | "renomear" | "relação"; what: string; m: M; allowed?: Set<string>; crossing?: boolean; rename?: [string, string]; group?: string }
  function localityEdits(model: string) {
    const base = declared(model, "clean", 0, 0);
    const { groupOf, members } = groupsOf(base);
    const partnersOf = (id: string) => base.mapping.filter((r) => r.l === id || r.r === id).map((r) => (r.l === id ? r.r : r.l));
    const fresh = () => declared(model, "clean", 0, 0);
    const edits: Edit[] = [];
    for (const k of Object.keys(members)) {
      const n = members[k]!.length, grows = tierOf(n) !== tierOf(n + 1);
      { const m = fresh(); listOf(m, k).push({ id: "Novo" });
        edits.push({ kind: "contexto", what: `+ Novo em ${k}`, m, allowed: new Set([...members[k]!, "Novo"]), crossing: grows }); }
      { const m = fresh(); listOf(m, k).push({ id: "Novo" });
        m.mapping.push({ l: "Novo", lt: [], c: "<--", rt: [], r: members[k]![0]! });
        edits.push({ kind: "contexto", what: `+ Novo ← ${members[k]![0]}`, m, allowed: new Set([...members[k]!, "Novo"]), crossing: grows }); }
      for (const id of members[k]!) {
        const m = fresh(), list = listOf(m, k);
        list.splice(list.findIndex((c) => c.id === id), 1);
        m.mapping = m.mapping.filter((r) => r.l !== id && r.r !== id);
        const allowed = new Set(members[k]);
        partnersOf(id).forEach((p) => members[groupOf[p]!]!.forEach((x) => allowed.add(x)));
        /* o último contexto de um external leva o bloco junto: é o território que some */
        const crossing = tierOf(n) !== tierOf(n - 1) || (n === 1 && k.endsWith("/external"));
        edits.push({ kind: "contexto", what: `− ${id}`, m, allowed, crossing });
      }
    }
    /* renomear para os dois lados da ordem alfabética: o nome é o último desempate */
    for (const id of Object.keys(groupOf)) for (const nn of ["Aa" + id, "Zz" + id]) {
      const m = fresh();
      listOf(m, groupOf[id]!).find((c) => c.id === id)!.id = nn;
      m.mapping.forEach((r) => { if (r.l === id) r.l = nn; if (r.r === id) r.r = nn; });
      edits.push({ kind: "renomear", what: `${id} → ${nn}`, m, rename: [id, nn], group: groupOf[id] });
    }
    const ends = (rel: { l: string; r: string }) => new Set([...members[groupOf[rel.l]!]!, ...members[groupOf[rel.r]!]!]);
    EXTRA[model]!.forEach((rel, i) =>
      edits.push({ kind: "relação", what: `+ ${rel.l} ${rel.c} ${rel.r}`, m: declared(model, "clean", 0, i + 1), allowed: ends(rel) }));
    base.mapping.forEach((rel, i) => {
      const m = fresh(); m.mapping.splice(i, 1);
      edits.push({ kind: "relação", what: `− ${rel.l} ${rel.c} ${rel.r}`, m, allowed: ends(rel) });
    });
    return { base, edits };
  }

  // [edições, cruzam degrau, deslocam domínio inteiro] — o que o script imprime hoje
  const TALLY: Record<string, Record<string, number[]>> = {
    one: { contexto: [31, 2, 0], renomear: [34, 0, 0], relação: [17, 0, 0] },
    many: { contexto: [40, 5, 1], renomear: [36, 0, 0], relação: [18, 0, 1] },
  };

  for (const model of ["one", "many"]) {
    it(`${model}: cada edição só move o que lhe diz respeito`, { timeout: 30_000 }, () => {
      const { base, edits } = localityEdits(model);
      const { groupOf, domOf } = groupsOf(base);
      const t0 = layout(canon(base)).tiles;
      const at = (t: Record<string, number[]>, id: string) => (t[id] ? t[id]!.map((x) => x.toFixed(1)).join() : "∅");
      const tally: Record<string, number[]> = { contexto: [0, 0, 0], renomear: [0, 0, 0], relação: [0, 0, 0] };
      const failures: string[] = [];
      for (const e of edits) {
        const t = layout(canon(e.m)).tiles as Record<string, number[]>;
        tally[e.kind]![0]!++;
        if (e.rename) {
          const [a, b] = e.rename;
          const moved = Object.keys(t0).filter((id) => at(t0, id) !== at(t, id === a ? b : id)).filter((id) => id !== a);
          if (moved.length > 1 || moved.some((x) => groupOf[x] !== e.group))
            failures.push(`renomear ${e.what} moveu ${moved.join(", ")} (só um gêmeo no mesmo território é aceito)`);
          continue;
        }
        if (e.crossing) { tally[e.kind]![1]!++; continue; }
        const outside = Object.keys(t0).filter((id) => id in t && at(t0, id) !== at(t, id) && !e.allowed!.has(id));
        if (!outside.length) continue;
        /* domínio deslocado inteiro: TODA peça dele andou pelo mesmo vetor */
        const doms = [...new Set(outside.map((id) => domOf[id]!))];
        const rigid = doms.every((d) => {
          const ids = Object.keys(t0).filter((id) => domOf[id] === d && id in t);
          const vec = new Set(ids.map((id) => [t[id]![0]! - t0[id]![0]!, t[id]![1]! - t0[id]![1]!].map((x) => x.toFixed(1)).join()));
          return vec.size === 1 && ids.every((id) => !e.allowed!.has(id));
        });
        if (rigid) { tally[e.kind]![2]!++; continue; }
        failures.push(`${e.what} moveu ${outside.length} peça(s) fora do que lhe diz respeito: ${outside.join(", ")}`);
      }
      expect(failures).toEqual([]);
      expect(tally).toEqual(TALLY[model]);
    });
  }
});
