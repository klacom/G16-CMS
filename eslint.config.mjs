import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**", "node_modules/**", ".cache/**", "coverage/**",
    "playwright-report/**", "test-results/**", "next-env.d.ts",
    "design/**", "scripts/**", "php-backend/**", ".claude/**",
    "supabase/.temp/**", "supabase/.branches/**",
  ]),
]);
