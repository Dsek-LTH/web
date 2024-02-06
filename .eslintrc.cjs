/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "plugin:@typescript-eslint/recommended",
    // "plugin:@typescript-eslint/recommended-type-checked", // type-checked rules seem to not understand svelte's generated types
    "plugin:svelte/recommended",
    "plugin:svelte/prettier",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    // project: true, // TODO: enable for type-checked rules
    // tsconfigRootDir: __dirname, // TODO: enable for type-checked rules
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
  reportUnusedDisableDirectives: true,
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
            // any path beginning with ../ and ending with /<folder>/<file>
            // e.g. import { foo } from "../bar/baz";
            group: ["../**/*[a-zA-Z0-9_-]*/*"],
            message:
              "\nIt looks like you're importing from a different subtree. " +
              "Consider whether the imported code should really be shared. Suggestions:\n" +
              "1) Write new code specific to your usage.\n" +
              "2) Move the imported code to a shared location, e.g. a parent folder.\n" +
              "3) Verify that you're using the correct path alias, e.g. $lib.",
          },
        ],
      },
    ],
  },
};
