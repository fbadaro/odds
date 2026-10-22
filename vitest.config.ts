import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Os pacotes publicam `./dist`, que nao existe num checkout limpo — sem alias,
 * `npm test` falha ao resolver `@odds/core` antes de qualquer build. Apontar
 * para a fonte tambem elimina o modo de falha oposto, que e pior por ser
 * silencioso: rodar a suite contra um `dist` desatualizado e passar.
 */
export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.ts", "apps/*/test/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@odds/core": fileURLToPath(new URL("packages/core/src/index.ts", import.meta.url)),
      "@odds/layout/fixtures": fileURLToPath(new URL("packages/layout/src/fixtures.ts", import.meta.url)),
      "@odds/layout": fileURLToPath(new URL("packages/layout/src/index.ts", import.meta.url)),
      "@odds/messages": fileURLToPath(new URL("packages/messages/src/index.ts", import.meta.url)),
    },
  },
});
