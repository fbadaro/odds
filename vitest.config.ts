import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Os pacotes publicam `./dist`, que nao existe num checkout limpo — sem alias,
 * `npm test` falha ao resolver `@odds/core` antes de qualquer build. Apontar
 * para a fonte tambem elimina o modo de falha oposto, que e pior por ser
 * silencioso: rodar a suite contra um `dist` desatualizado e passar.
 *
 * Os aliases sao por prefixo: os mais especificos vem antes. `@odds/layout/map.css`
 * e `@odds/layout/fixtures` precisam preceder `@odds/layout`.
 */
const alias = [
  { find: "@odds/core", replacement: at("packages/core/src/index.ts") },
  { find: "@odds/layout/map.css", replacement: at("packages/layout/map.css") },
  { find: "@odds/layout/fixtures", replacement: at("packages/layout/src/fixtures/index.ts") },
  { find: "@odds/layout", replacement: at("packages/layout/src/index.ts") },
  { find: "@odds/messages", replacement: at("packages/messages/src/index.ts") },
];

/** Pacotes rodam em node; so os testes de componente de `apps/` (.tsx) ganham DOM (jsdom). */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "packages", environment: "node", include: ["packages/*/test/**/*.test.ts"] },
      },
      // Regra nas apps: .tsx -> jsdom, .ts -> node; excecao usa o pragma `// @vitest-environment jsdom`.
      {
        resolve: { alias },
        test: {
          name: "apps-logic",
          environment: "node",
          include: ["apps/*/test/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        // Componentes (.tsx) precisam de DOM; a logica das apps (.ts) le arquivos e fica em node.
        test: {
          name: "apps-dom",
          environment: "jsdom",
          include: ["apps/*/test/**/*.test.tsx"],
          setupFiles: [at("apps/playground/test/setup-dom.ts")],
        },
      },
    ],
  },
});
