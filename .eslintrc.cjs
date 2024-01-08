/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:svelte/recommended",
    "plugin:svelte/prettier",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    extraFileExtensions: [".svelte"],
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],
  /**
   * Rule overrides and additions.
   * In general, we want to use the recommended rules.
   * However, there are some aspects that we may want to be stricter about
   * to keep the code more maintainable.
   */
  rules: {
    "eslint-comments/require-description": "warn", // Helpful for understanding why a rule is disabled.
    "no-restricted-imports": [
      // Forces the folder structure to reflect the dependency graph.
      // This makes it easier to understand how code may be coupled.
      "warn",
      {
        patterns: [
          {
            group: ["../**[a-zA-Z]/*"], // e.g. `import { foo } from "../bar/baz";`
            message:
              "It looks like you're importing from a different subtree. Consider if this module should be shared or not and act accordingly.",
          },
        ],
      },
    ],
  },
  reportUnusedDisableDirectives: true,
};
