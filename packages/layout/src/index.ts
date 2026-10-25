/**
 * `@odds/layout` — a colmeia do mapa de contextos ODDS, portada literalmente do
 * script da colmeia-v4 (docs/design/pages/colmeia-v4.html). Sem DOM e sem React;
 * do `@odds/core` só importa tipos.
 *
 * A página foi apagada em 2026-10-24, depois de validada: o porte batia com ela byte a
 * byte, e o que ela produzia ficou congelado nos goldens de test/golden/. Segue no
 * git: `git show e282c83:docs/design/pages/colmeia-v4.html`.
 */
export { layout } from "./layout.js";
export { placeLabels } from "./labels.js";
export { renderSvg } from "./render.js";
export { modelOf, topologyKeys, anchorsOf, targetOf } from "./ast.js";
export type { Anchor } from "./ast.js";
export { navOf } from "./nav.js";
export type { Nav } from "./nav.js";
export { measure, movedTiles, tilesMoved, tierOf } from "./metrics.js";
export type {
  Axial,
  Badge,
  Box,
  CanonModel,
  CanonRelation,
  Chip,
  Connector,
  CtxLabel,
  EndGeom,
  Geometry,
  Group,
  Island,
  LabelOptions,
  LabelResult,
  LayoutContext,
  LayoutDomain,
  LayoutModel,
  LayoutRelation,
  LayoutSubdomain,
  Mass,
  Measure,
  Point,
  PortEnd,
  PreparedDomain,
  PreparedModel,
  PreparedSubdomain,
  Region,
  RoutedRelation,
  SubSpot,
  Target,
  TargetedDiagnostic,
  TerritorySd,
  ViewOptions,
} from "./types.js";
