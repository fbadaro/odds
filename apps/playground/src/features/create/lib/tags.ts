import type { ConnectorType, PatternTag } from "@odds/core";

/**
 * Which tags the relationship form offers, from the normative matrix of
 * `RULES-EN.md` §1.C. A form that lets the user make an error teaches nothing, so
 * every combination that is an `error` is out of reach; what is only a warning
 * (a `C` with no `S`) stays possible, and the validator speaks as always.
 */

export type Side = "left" | "right";
export interface TagState {
  left: PatternTag[];
  right: PatternTag[];
}

/** The order tags are written in: `AST_SCHEMA.md`'s catalogue, the one the sample files follow. */
const ORDER: readonly PatternTag[] = ["OHS", "PL", "ACL", "CF", "SK", "C", "S", "P", "BBM"];
const UPSTREAM: ReadonlySet<PatternTag> = new Set(["OHS", "PL", "S", "BBM"]);
const DOWNSTREAM: ReadonlySet<PatternTag> = new Set(["ACL", "CF", "C", "BBM"]);
const MUTUAL: ReadonlySet<PatternTag> = new Set(["SK", "P"]);

/** Which side of a directional line is upstream. */
const upstreamSide = (c: "-->" | "<--"): Side => (c === "-->" ? "left" : "right");

/** `external`: a side of the line is an external context, and there is no Shared Kernel or Partnership with a third party. */
export function allowedTags(connector: ConnectorType, side: Side, external: boolean): PatternTag[] {
  if (connector === "-x-") return ["BBM"];
  if (connector === "<->") return ORDER.filter((t) => t === "BBM" || (MUTUAL.has(t) && !external));
  const set = side === upstreamSide(connector) ? UPSTREAM : DOWNSTREAM;
  return ORDER.filter((t) => set.has(t));
}

const sorted = (tags: Iterable<PatternTag>) => ORDER.filter((t) => new Set(tags).has(t));
const other = (side: Side): Side => (side === "left" ? "right" : "left");

/** SK and P are bilateral, so they go on and off on both sides; CF and ACL cannot share a side. */
export function toggleTag(s: TagState, connector: ConnectorType, side: Side, tag: PatternTag): TagState {
  const on = !s[side].includes(tag);
  const flip = (tags: PatternTag[]) => {
    const next = new Set(tags);
    if (!on) next.delete(tag);
    else {
      next.add(tag);
      if (tag === "CF") next.delete("ACL");
      if (tag === "ACL") next.delete("CF");
    }
    return sorted(next);
  };
  const next = { ...s, [side]: flip(s[side]) };
  if (connector === "<->" && MUTUAL.has(tag)) next[other(side)] = flip(s[other(side)]);
  return next;
}

/** After the connector or a side changes: what is no longer allowed goes. */
export function pruneTags(s: TagState, connector: ConnectorType, external: boolean): TagState {
  const keep = (side: Side) => s[side].filter((t) => allowedTags(connector, side, external).includes(t));
  return { left: keep("left"), right: keep("right") };
}
