/**
 * `@odds/layout` — a colmeia do mapa de contextos ODDS, portada literalmente do
 * protótipo v4. Sem DOM e sem React; do `@odds/core` só importa tipos.
 *
 * O porte batia com o protótipo byte a byte, e o que ele produzia ficou congelado nos
 * goldens de test/golden/. O protótipo segue no git, no commit `e282c83`.
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
