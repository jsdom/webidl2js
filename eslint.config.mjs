import domenicConfig from "@domenic/eslint-config";
import domenicStylisticConfig from "@domenic/eslint-config/stylistic";
import globals from "globals";

export default [
  {
    ignores: ["test/output/", "test/snapshots/"],
  },
  ...domenicConfig,
  ...domenicStylisticConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
];
