import type { Nav } from "@odds/layout";

export const SUBDOMAIN_TYPES = ["core", "supporting", "generic"] as const;
export type SubdomainType = (typeof SUBDOMAIN_TYPES)[number];

/** O que a legenda da bancada conta no mapa atual: subdomínios por tipo e contextos external. */
export function legendOf(nav: Nav): { types: { type: SubdomainType; count: number }[]; external: number } {
  const subs = Object.values(nav.subs);
  const types = SUBDOMAIN_TYPES.map((type) => ({ type, count: subs.filter((s) => s.type === type).length })).filter(
    (r) => r.count > 0,
  );
  // como o renderLegend da bancada: contexto sem subdomínio
  const external = Object.keys(nav.tiles).filter((id) => !nav.ctxSub[id]).length;
  return { types, external };
}
