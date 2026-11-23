import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Boundary 1: the labs engine never reaches into pages.
  {
    files: ["features/labs/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "**/app/**"],
              message: "features/labs may import only from components/ui, lib, styles and itself, never from app/.",
            },
          ],
        },
      ],
    },
  },

  // Boundary 2: a lab is self-contained. It may use the design system
  // (components/ui, lib), the lab types, and its own files. Not other labs,
  // not pages, not the engine.
  {
    files: ["labs/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**", "@/labs/**", "../**", "@/features/labs/components/**", "@/features/labs/data", "@/features/labs/*.generated"],
              message: "A lab may import only from components/ui, lib, features/labs/{types,define} and its own folder.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.generated.*",
    // Installed from the Fluid Functionalism registry; overwritten on update.
    "components/ui/**",
    "components/sidebar-app/**",
    "components/dialog-sidebar/**",
    "components/queued-stack.tsx",
    "components/fluid-hover-highlight.tsx",
    "components/fluid-root.tsx",
    "hooks/**",
    "lib/**",
  ]),
]);

export default eslintConfig;
