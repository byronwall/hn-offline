/**
 * This is intended to be a basic starting point for linting in your app.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },

  // Base config
  extends: ["eslint:recommended"],

  overrides: [
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["boundaries", "solid"],
      extends: [
        // "plugin:jsx-a11y/recommended",
        "plugin:@dword-design/import-alias/recommended",
        "plugin:solid/recommended",
      ],
      settings: {
        formComponents: ["Form"],
        linkComponents: [
          { name: "Link", linkAttribute: "to" },
          { name: "NavLink", linkAttribute: "to" },
        ],
        "import/resolver": {
          typescript: {},
        },

        "boundaries/include": ["app/**/*"],
        "boundaries/elements": [
          {
            mode: "full",
            type: "shared",
            pattern: [
              "app/components/**/*",
              "app/data/**/*",
              "app/drizzle/**/*",
              "app/hooks/**/*",
              "app/lib/**/*",
              "app/server/**/*",
              "app/stores/**/*",
            ],
          },
          {
            mode: "full",
            type: "feature",
            capture: ["featureName"],
            pattern: ["app/features/*/**/*"],
          },
          {
            mode: "full",
            type: "app",
            capture: ["_", "fileName"],
            pattern: ["app/routes/**/*"],
          },
          {
            mode: "full",
            type: "neverImport",
            pattern: ["app/*", "app/tasks/**/*"],
          },
        ],
      },
      rules: {
        curly: "warn",
        // "jsx-a11y/click-events-have-key-events": "off",
        // "jsx-a11y/no-static-element-interactions": "off",

        "import/no-duplicates": "warn",

        "sort-imports": [
          "warn",
          { ignoreCase: true, ignoreDeclarationSort: true },
        ],

        "import/order": [
          "warn",
          {
            "newlines-between": "always",

            groups: [
              "builtin",
              "external",
              "internal",
              "index",
              "sibling",
              "parent",
              "object",
              "type",
            ],

            alphabetize: {
              order: "asc",

              caseInsensitive: true,
            },
          },
        ],
        "import/newline-after-import": "warn",
        "@dword-design/import-alias/prefer-alias": [
          "warn",
          {
            alias: {
              "~": "./src/",
            },
          },
        ],

        "boundaries/no-unknown": ["error"],
        "boundaries/no-unknown-files": ["error"],
        "boundaries/element-types": [
          "error",
          {
            default: "disallow",
            rules: [
              {
                from: ["shared"],
                allow: ["shared"],
              },
              {
                from: ["feature"],
                allow: [
                  "shared",
                  ["feature", { featureName: "${from.featureName}" }],
                ],
              },
              {
                from: ["app", "neverImport"],
                allow: ["shared", "feature", "app"],
              },
            ],
          },
        ],
      },
    },

    // Typescript
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
      },
    },

    // Node
    {
      files: [".eslintrc.cjs"],
      env: {
        node: true,
      },
    },
  ],
};
