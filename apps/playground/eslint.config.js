import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".tsbuild", "src/styles/tokens.css"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    // Scripts e configs rodam em node.
    files: ["scripts/**", "*.config.{js,ts}"],
    languageOptions: { globals: { URL: "readonly", process: "readonly", console: "readonly" } },
  },
  {
    // Base UI só entra pelas casas de src/components/ui (ADR-0014).
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@base-ui/react", "@base-ui/react/*"], message: "Importe Base UI só em src/components/ui/**." }] },
      ],
    },
  },
);
