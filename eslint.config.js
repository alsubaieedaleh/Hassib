// eslint.config.js
import eslintPluginAngular from "@angular-eslint/eslint-plugin";
import angularTemplateParser from "@angular-eslint/template-parser";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module"
      },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        confirm: "readonly",
        setTimeout: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        console: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@angular-eslint": eslintPluginAngular
    },
    rules: {
      // Add your Angular+TS rules here
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["**/*.spec.ts"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        expect: "readonly",
        jest: "readonly"
      }
    }
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: angularTemplateParser
    },
    plugins: {
      "@angular-eslint/template": eslintPluginAngular // plugin reused
    },
    rules: {
      // Optional: rules for Angular templates
    }
  }
];

