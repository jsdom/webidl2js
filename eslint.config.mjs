import domenicConfig from "@domenic/eslint-config";
import globals from "globals";

export default [
  {
    ignores: [
      "test/output/",
      "test/snapshots/"
    ]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
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
