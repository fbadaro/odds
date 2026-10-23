import type { Nav } from "@odds/layout";

export const SUBDOMAIN_TYPES = ["core", "supporting", "generic"] as const;
export type SubdomainType = (typeof SUBDOMAIN_TYPES)[number];

/** O que a legenda da bancada conta no mapa atual: subdomínios por tipo e contextos external. */
export function legendOf(nav: Nav): { types: { type: SubdomainType; count: number }[]; external: number } {
  const subs = Object.values(nav.subs);
  const types = SUBDOMAIN_TYPES.map((type) => ({ type, count: subs.filter((s) => s.type === type).length })).filter(
    (r) => r.count > 0,
  );
  // A bancada conta `!ctxSub[id]`, mas o navOf dá aos externos o grupo "D/external" (type "external"):
  // lá a linha nunca aparece. Aqui contam os sem subdomínio e os de grupo external.
  const external = Object.keys(nav.tiles).filter((id) => {
    const sub = nav.ctxSub[id];
    return !sub || nav.subs[sub]?.type === "external";
  }).length;
  return { types, external };
}
