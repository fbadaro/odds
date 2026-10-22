import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateTokens } from "../scripts/generate-tokens.mjs";

const designMd = readFileSync(new URL("../../../DESIGN.md", import.meta.url), "utf8");
const css: string = generateTokens(designMd);

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `bloco ${selector} ausente`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("\n}", start));
}

describe("tokens.css é derivado do DESIGN.md, nunca escrito à mão", () => {
  it("traz as cores claras no :root e as escuras em [data-theme=\"dark\"]", () => {
    expect(block(":root")).toContain("--c-accent: 108 64 217;");
    expect(block('[data-theme="dark"]')).toContain("--c-accent: 173 141 255;");
  });

  it("traz a força da sombra por tema", () => {
    expect(block(":root")).toContain("--shadow-strength: 0.14;");
    expect(block('[data-theme="dark"]')).toContain("--shadow-strength: 0.5;");
  });

  it("resolve referências de sombra para var(--…)", () => {
    expect(css).toContain(
      "--sh-cta: 0 10px 30px -8px rgb(var(--c-accent) / calc(var(--shadow-strength) * 4));",
    );
    expect(css).toContain("--grad-primary: linear-gradient(180deg, rgb(var(--c-accent-lift)), rgb(var(--c-accent)));");
  });

  it("traz raios", () => {
    expect(css).toContain("--radius-button: 12px;");
  });

  it("não deixa referência {…} sem resolver", () => {
    expect(css).not.toMatch(/\{[a-z]/);
  });

  it("é igual, byte a byte, ao tokens.css versionado", () => {
    const committed = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
    expect(committed).toBe(css);
  });
});

describe("o gerador falha alto", () => {
  const fm = (colors: string, elevation = "  sm: \"0 0 {colors.accent}\"") =>
    `---\ncolors:\n${colors}\ntypography: {}\nrounded: {}\nspacing: {}\nelevation:\n${elevation}\n---\n`;
  const ok = '  accent: "#6C40D9"';

  it("em referência a token inexistente", () => {
    expect(() => generateTokens(fm(ok, '  sm: "0 0 {colors.nope}"'))).toThrow(/colors\.nope/);
  });

  it("em cor -dark sem a variante clara", () => {
    expect(() => generateTokens(fm(`${ok}\n  foo-dark: "#000000"`))).toThrow(/foo-dark/);
  });

  it("em hex malformado, citando o token", () => {
    expect(() => generateTokens(fm('  accent: "#6C40"'))).toThrow(/colors\.accent/);
  });
});
