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
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@angular-eslint": eslintPluginAngular
    },
    rules: {
      // Add your Angular+TS rules here
      "@typescript-eslint/no-unused-vars": "error"
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
