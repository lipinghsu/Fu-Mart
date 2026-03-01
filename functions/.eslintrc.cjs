module.exports = {
  env: { es6: true, node: true },
  extends: ["eslint:recommended", "google"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    quotes: ["error", "double"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};