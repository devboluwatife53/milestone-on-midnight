import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";

// Midnight's browser SDK packages (level, ledger-v8, compact-runtime) rely on
// Node globals (Buffer, process) that don't exist in the browser by default,
// and ledger-v8 ships a WASM module that needs explicit plugin support plus
// native top-level-await (hence the esnext build target below).
export default defineConfig({
  build: { target: "esnext" },
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  optimizeDeps: {
    exclude: ["@midnight-ntwrk/ledger-v8", "@midnight-ntwrk/onchain-runtime-v3"],
    esbuildOptions: { target: "esnext" },
  },
  worker: {
    format: "es",
  },
});
