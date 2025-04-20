import domenicConfig from "@domenic/eslint-config";
import globals from "globals";

export default [
  {
    ignores: [
      "test/output/",
      "test/__snapshots__/"
    ]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    }
  },
  {
    files: [
      "test/test.js",
      "test/*.test.js"
    ],
    languageOptions: {
      globals: globals.jest
    }
  },
  ...domenicConfig,
  {
    rules: {
      "max-len": ["error", { code: 120, ignoreTemplateLiterals: true }],
      "require-unicode-regexp": "off"
    }
  }
];
