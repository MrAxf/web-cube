import simpleImportSort from "eslint-plugin-simple-import-sort";
import parser from "astro-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    "plugin:astro/recommended",
    "plugin:astro/jsx-a11y-recommended",
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:eslint-comments/recommended",
    "plugin:regexp/recommended",
    "plugin:tailwindcss/recommended",
    "prettier",
  ),
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      "**/vite.config.*",
      "**/playground/**",
      "**/eslint.config.mjs",
    ],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        project: true,
        extraFileExtensions: [".astro"],
      },
    },

    settings: {
      "import/resolver": {
        typescript: true,
      },
    },

    rules: {
      "import/no-cycle": "off",
      "import/extensions": "off",
      "no-plusplus": "off",
      "no-continue": "off",
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "sort-imports": "off",
      "import/order": "off",
      "no-param-reassign": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-indexed-object-style": [
        "warn",
        "index-signature",
      ],
      "@typescript-eslint/consistent-type-definitions": "warn",
      "@typescript-eslint/method-signature-style": "error",

      "@typescript-eslint/no-empty-interface": [
        "warn",
        {
          allowSingleExtends: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "@typescript-eslint/triple-slash-reference": [
        "error",
        {
          path: "always",
        },
      ],

      curly: "warn",
      "func-names": ["warn", "as-needed"],
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "tailwindcss/classnames-order": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  },
  {
    files: ["**/*.astro"],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },

    rules: {
      "import/no-unresolved": "off",
    },
  },
];
