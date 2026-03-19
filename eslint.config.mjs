import domenicConfig from "@domenic/eslint-config";
import globals from "globals";
import stylisticConfig from "@domenic/eslint-config/stylistic";

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
  ...stylisticConfig,
  {
    rules: {
      "@stylistic/max-len": ["error", { code: 120, ignoreUrls: true, ignoreTemplateLiterals: true }],
      "require-unicode-regexp": "off"
    }
  }
];
