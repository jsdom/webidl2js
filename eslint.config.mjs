import domenicConfig from "@domenic/eslint-config";
import stylisticConfig from "@domenic/eslint-config/stylistic";
import globals from "globals";

export default [
  {
    ignores: ["test/output/", "test/snapshots/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  ...domenicConfig,
  ...stylisticConfig,
];
