// Copies the compiled circuit artifacts (zkir, prover/verifier keys) out of
// contract/src/managed so Vite can serve them as static files. The browser
// needs to fetch these over HTTP (FetchZkConfigProvider) — it can't read
// them off disk the way the Node CLI does.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "contract", "src", "managed", "milestone");
const dest = path.resolve(here, "..", "public", "managed", "milestone");

if (!existsSync(src)) {
  console.error(
    `No compiled contract found at ${src}.\nRun "npm run compact" in contract/ first.`,
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Synced compiled circuit artifacts: ${src} -> ${dest}`);
