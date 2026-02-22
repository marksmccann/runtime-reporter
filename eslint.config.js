import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    { ignores: ["dist/", "coverage/", "node_modules/", "**/*.cjs"] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
];
