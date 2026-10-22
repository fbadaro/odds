/**
 * `@odds/layout` — a colmeia do mapa de contextos ODDS, portada literalmente do
 * script da colmeia-v4 (docs/design/pages/colmeia-v4.html). Sem DOM e sem React;
 * do `@odds/core` só importa tipos.
 */
export { layout } from "./layout.js";
export { placeLabels } from "./labels.js";
export { measure, movedTiles, tilesMoved, tierOf } from "./metrics.js";
export type {
  Axial,
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
  TerritorySd,
} from "./types.js";
