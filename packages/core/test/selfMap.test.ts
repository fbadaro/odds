/**
 * O mapa do próprio projeto (`docs/odds.odds`), julgado pelo próprio linter.
 *
 * O arquivo é o diagrama de arquitetura do `docs/ARCHITECTURE.md` e do README. Se o
 * desenho do projeto mudar sem o mapa acompanhar, ou se uma regra nova discordar dele,
 * esta suíte cobra: ou o mapa muda, ou a discordância vira supressão justificada.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseAndValidate } from "../src/parseAndValidate.js";

const SELF_MAP = fileURLToPath(new URL("../../../docs/odds.odds", import.meta.url));

describe("docs/odds.odds", () => {
  it("is a clean ODDS file: a tree and no diagnostics", () => {
    const result = parseAndValidate(readFileSync(SELF_MAP, "utf8"));
    expect(result.astGenerated).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});
