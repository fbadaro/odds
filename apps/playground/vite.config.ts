import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { generateTokens } from "./scripts/generate-tokens.mjs";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const DESIGN_MD = here("../../DESIGN.md");
const TOKENS_CSS = here("./src/styles/tokens.css");

/** Regenera tokens.css ao salvar o DESIGN.md; o Vite então recarrega o CSS por HMR. */
function designTokens(): Plugin {
  return {
    name: "odds:design-tokens",
    configureServer(server) {
      server.watcher.add(DESIGN_MD);
      server.watcher.on("change", (file) => {
        if (file !== DESIGN_MD) return;
        const css = generateTokens(readFileSync(DESIGN_MD, "utf8"));
        if (css !== readFileSync(TOKENS_CSS, "utf8")) writeFileSync(TOKENS_CSS, css);
      });
    },
  };
}

/**
 * Os pacotes publicam ./dist, que não existe num checkout limpo: apontamos para a fonte,
 * como o vitest.config.ts da raiz, para que teste e build resolvam igual (ADR-0015).
 * Ordem importa: o alias é por prefixo, os mais específicos vêm antes.
 */
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), designTokens()],
  resolve: {
    alias: [
      { find: "@odds/layout/map.css", replacement: here("../../packages/layout/map.css") },
      { find: "@odds/layout/fixtures", replacement: here("../../packages/layout/src/fixtures/index.ts") },
      { find: "@odds/layout", replacement: here("../../packages/layout/src/index.ts") },
      { find: "@odds/core", replacement: here("../../packages/core/src/index.ts") },
      { find: "@odds/messages", replacement: here("../../packages/messages/src/index.ts") },
    ],
  },
});
