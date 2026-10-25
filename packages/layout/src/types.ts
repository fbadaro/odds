/**
 * Os tipos do @odds/layout. Descrevem o que o script ES5 da colmeia-v4 constrói e
 * muta: a forma de cada objeto é a do legado, campo por campo, porque o porte é
 * literal (plano, "Regra do porte"). Por isso vários campos nascem depois do objeto
 * (`Mass.c`, `Group.cells`…): são preenchidos por fases sucessivas do layout.
 */

import type { Diagnostic } from "@odds/core";

/** Ponto em pixels. */
export type Point = [number, number];
/** Célula em coordenada axial `[q, r]`. */
export type Axial = [number, number];
/** Caixa `[x, y, largura, altura]`. */
export type Box = [number, number, number, number];

export type Connector = "-->" | "<--" | "<->" | "-x-";

/** As seis propriedades de contexto do GRAMMAR.md §3, mais o título. Os valores
    textuais já trazem as aspas da fonte `.odds` (o gerador de fonte as copia). */
export interface LayoutContext {
  id: string;
  title?: string;
  type?: string;
  description?: string;
  responsibilities?: string[];
  maturity?: string;
  team?: string;
  technology?: string;
}

export interface LayoutSubdomain {
  id: string;
  type: string;
  title?: string;
  description?: string;
  owner?: string;
  contexts: LayoutContext[];
  /** Preenchido por `prep`. */
  ids?: string[];
}

export interface LayoutDomain {
  id: string;
  title?: string;
  subdomains: LayoutSubdomain[];
  external?: LayoutContext[];
  /** Preenchido por `prep`. */
  externalIds?: string[];
}

export interface LayoutRelation {
  l: string;
  lt: string[];
  c: Connector;
  rt: string[];
  r: string;
  /** A identidade da relação, o par não ordenado `menor|maior`; posta por `canon`. */
  rk?: string;
}

export interface LayoutModel {
  file: string;
  domains: LayoutDomain[];
  mapping: LayoutRelation[];
}

/* ---- a forma depois de prep/canon: é só ela que o layout vê ---- */

export interface PreparedSubdomain extends LayoutSubdomain {
  ids: string[];
}
export interface PreparedDomain extends LayoutDomain {
  subdomains: PreparedSubdomain[];
  external: LayoutContext[];
  externalIds: string[];
}
export interface PreparedModel extends LayoutModel {
  domains: PreparedDomain[];
}
export interface CanonRelation extends LayoutRelation {
  rk: string;
}
export interface CanonModel extends PreparedModel {
  mapping: CanonRelation[];
}

/* ---- geografia ---- */

/** O subdomínio de um território. O bloco `external` vira um pseudo-subdomínio
    `{id: "external", type: "external"}`. */
export interface TerritorySd {
  id: string;
  type: string;
  title?: string;
  contexts: LayoutContext[];
  ids: string[];
}

/** Um território: as células de um subdomínio dentro da massa do seu tipo. */
export interface Group {
  sd: TerritorySd;
  /** Número de células pedido (`cellsFor`). */
  n: number;
  mass: Mass;
  seed: Point;
  cells: Axial[];
  set: Record<string, 1>;
  /** O mesmo objeto que `mass.pos`. */
  pos: Record<string, Point>;
  /** `"Dominio/Subdominio"`. */
  key: string;
  dom: string;
  /** Centroide das células. */
  ct: Point;
}

/** A massa de um tipo de subdomínio (core, supporting, generic) ou do external. */
export interface Mass {
  type: string;
  external?: boolean;
  groups: Group[];
  n: number;
  R: number;
  Rcap: number;
  /** Centro relativo à origem do domínio. */
  c: Point;
  /** Extensão por ângulo (24 setores); `null` antes da primeira medida. */
  ext: number[] | null;
  /** Centro absoluto. */
  ctr: Point;
  pos: Record<string, Point>;
  base: Axial;
}

export interface Region {
  cells: Axial[];
  set: Record<string, 1>;
  pos: Record<string, Point>;
}

export interface Island {
  dom: PreparedDomain;
  masses: Mass[];
  /** O contorno do domínio, sem o external; `null` se não houver célula própria. */
  region: Region | null;
}

/* ---- arestas ---- */

/** Uma ponta de relação antes da geometria: o lado do hexágono escolhido. */
export interface PortEnd {
  i: number;
  side: "l" | "r";
  ang: number;
  tags: string[];
  /** Lado do hexágono, 0–5. */
  k: number;
  stack?: number;
  push?: number;
}

export interface Chip {
  c: Point;
  w: number;
  h: number;
  box: Box;
  tags: string[];
}

export interface PortStart {
  cell: Axial;
  run: string[];
}

/** A geometria de uma ponta: lado → seta colada → respiro → chip → linha. */
export interface EndGeom {
  id: string;
  P: Point;
  n: Point;
  tip: Point;
  Q: Point;
  chip: Chip | null;
  arrow: boolean;
  k: number;
  start: PortStart;
}

export interface RoutedRelation {
  rel: CanonRelation;
  rk: string;
  endL: PortEnd;
  endR: PortEnd;
  L: EndGeom;
  Rr: EndGeom;
  path: Point[];
  cells: string[];
}

/** O que `layout` devolve: a geo da v4, com tudo que o render (Task 4) lê dela. */
export interface Geometry {
  cm: CanonModel;
  islands: Island[];
  groups: Group[];
  tiles: Record<string, Point>;
  cellOf: Record<string, Axial>;
  groupOf: Record<string, Group>;
  partners: Record<string, string[]>;
  rels: RoutedRelation[];
  congested: number;
  /** Escrito pelo render, não pelo layout (o build da v4 o escreve na geo). */
  viewBox?: [number, number, number, number];
  /** Escrito pelo render: os selos de aresta já postos, que `badgeSpot` evita. */
  badges?: Badge[];
  /** Escrito pelo render: os rótulos que ele desenhou. */
  labels?: LabelResult;
}
export interface Badge {
  rk: string;
  p: Point;
}

/* ---- rótulos ---- */

export interface LabelOptions {
  edges: boolean;
  tags: boolean;
  ctxLabels: boolean;
  subLabels: boolean;
  subSize?: number;
}

export interface CtxLabel {
  x: number;
  y: number;
  a: "middle" | "start" | "end";
  box: Box;
}

export interface SubSpot {
  sub: string;
  id: string;
  p: Point;
  box: Box;
  size: number;
}

export interface LabelResult {
  labels: Record<string, CtxLabel>;
  subSpots: SubSpot[];
}

export interface Measure {
  crossings: number;
  overTile: number;
  overList: string[];
  congested: number;
  detour: number;
  detourOf: string;
  maxLen: number;
  tiles: number;
  rels: number;
}

/* ---- o desenho ---- */

/** O estado da v4 que o `build` lia de `state`. */
export interface ViewOptions {
  view: "flow" | "contain";
  tags: "on" | "off";
  /** Os valores que a v4 aceita em `state.labels`: `"ctx"`, `"sub"` ou `"dom"`. */
  labels: string;
  /** O contexto selecionado. */
  sel: string | null;
  /** O subdomínio selecionado, `"Dominio/Subdominio"`. */
  selSub: string | null;
  /** O índice do diagnóstico selecionado em `diags`. */
  selDiag: number | null;
}
/** Onde um diagnóstico mora no mapa. */
export type Target =
  | { kind: "dom"; dom: string }
  | { kind: "sub"; sub: string }
  | { kind: "tile"; ctx: string }
  | { kind: "edge"; rk: string }
  | { kind: "port"; rk: string; ctx: string }
  | { kind: "file" };
export type TargetedDiagnostic = Pick<Diagnostic, "code" | "severity" | "data" | "span"> & { target: Target };
