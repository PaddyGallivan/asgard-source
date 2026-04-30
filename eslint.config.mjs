// ESLint config for Asgard worker source
// Catches undefined variables before deploy (like AI_BASE, sendMessage bugs found Apr 2026)
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["workers/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        // Cloudflare Workers globals
        addEventListener: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        ReadableStream: "readonly",
        WritableStream: "readonly",
        TransformStream: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        caches: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        navigator: "readonly",
        // Cloudflare-specific
        ENVIRONMENT: "readonly",
        ASSETS: "readonly",
      },
    },
    rules: {
      // The two bugs we found and fixed
      "no-undef": "error",           // catches AI_BASE, sendMessage etc
      "no-unused-vars": "warn",
      // Code quality
      "no-console": "off",           // workers use console.log
      "no-constant-condition": "warn",
      "no-unreachable": "error",
    },
  },
];
