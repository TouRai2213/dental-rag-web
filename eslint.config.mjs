import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.*",
      ".claude/**",
      "coverage/**",
    ],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // General JavaScript/ES6 rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["warn", "all"],
      "no-duplicate-imports": "warn",

      // React specific rules
      "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],
      "react/no-unescaped-entities": "warn",
      "react/self-closing-comp": ["error", { component: true, html: true }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Next.js specific rules
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

      // Code quality rules
      "prefer-template": "warn",
      "object-shorthand": "warn",
      "no-useless-concat": "warn",
    },
  },
];

export default eslintConfig;
