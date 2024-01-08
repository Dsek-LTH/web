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
  },
  reportUnusedDisableDirectives: true,
};
