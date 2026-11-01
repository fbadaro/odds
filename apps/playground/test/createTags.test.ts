import { describe, expect, it } from "vitest";
import { allowedTags, pruneTags, toggleTag } from "../src/features/create/lib/tags";

const empty = { left: [], right: [] };

describe("allowedTags (RULES-EN.md §1.C)", () => {
  it("offers the upstream patterns on the upstream side of a directional line, and BBM", () => {
    expect(allowedTags("-->", "left", false)).toEqual(["OHS", "PL", "S", "BBM"]);
    expect(allowedTags("<--", "right", false)).toEqual(["OHS", "PL", "S", "BBM"]);
  });

  it("offers the downstream patterns on the downstream side", () => {
    expect(allowedTags("-->", "right", false)).toEqual(["ACL", "CF", "C", "BBM"]);
    expect(allowedTags("<--", "left", false)).toEqual(["ACL", "CF", "C", "BBM"]);
  });

  it("offers SK and P on <->, unless a side is external", () => {
    expect(allowedTags("<->", "left", false)).toEqual(["SK", "P", "BBM"]);
    expect(allowedTags("<->", "right", true)).toEqual(["BBM"]);
  });

  it("offers only BBM on -x-", () => {
    expect(allowedTags("-x-", "left", false)).toEqual(["BBM"]);
  });
});

describe("toggleTag", () => {
  it("adds and removes a tag, keeping the catalogue's order", () => {
    const s = toggleTag(toggleTag(empty, "-->", "left", "PL"), "-->", "left", "OHS");
    expect(s.left).toEqual(["OHS", "PL"]);
    expect(toggleTag(s, "-->", "left", "OHS").left).toEqual(["PL"]);
  });

  it("marks SK and P on both sides of <->, and unmarks both", () => {
    const s = toggleTag(empty, "<->", "left", "SK");
    expect(s).toEqual({ left: ["SK"], right: ["SK"] });
    expect(toggleTag(s, "<->", "right", "SK")).toEqual({ left: [], right: [] });
  });

  it("keeps CF and ACL apart on one side: picking one drops the other", () => {
    const s = toggleTag(empty, "-->", "right", "ACL");
    expect(toggleTag(s, "-->", "right", "CF").right).toEqual(["CF"]);
  });

  it("allows C without S: that is a warning the validator gives, not an error to prevent", () => {
    expect(toggleTag(empty, "-->", "right", "C")).toEqual({ left: [], right: ["C"] });
  });
});

describe("pruneTags", () => {
  it("drops what the new connector or an external side no longer allows", () => {
    const s = { left: ["OHS" as const, "BBM" as const], right: ["ACL" as const] };
    expect(pruneTags(s, "-x-", false)).toEqual({ left: ["BBM"], right: [] });
    expect(pruneTags(s, "<--", false)).toEqual({ left: ["BBM"], right: [] });
    expect(pruneTags({ left: ["SK"], right: ["SK"] }, "<->", true)).toEqual({ left: [], right: [] });
  });
});
