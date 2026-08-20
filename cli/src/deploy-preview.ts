/*
 * Deploys the Milestone contract to the Midnight Preview testnet.
 *
 * Usage:
 *   WALLET_SEED=<hex>            (optional, else a fresh wallet is generated)
 *   OWNER_SECRET_KEY=<hex>       (optional, else a fresh owner key is generated)
 *   npm run deploy:preview
 *
 * Requires a local proof server running on :6300 (see `npm run proof-server`)
 * and a funded Preview wallet (use the Preview faucet).
 */
import { toHex } from "@midnight-ntwrk/midnight-js/utils";
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreviewConfig } from "./config.js";

const config = new PreviewConfig();

const seed = process.env.WALLET_SEED;
const ownerSecretKeyHex = process.env.OWNER_SECRET_KEY;

const walletCtx = seed
  ? await api.buildWalletAndWaitForFunds(
      config,
      seed,
      ownerSecretKeyHex
        ? new Uint8Array(Buffer.from(ownerSecretKeyHex, "hex"))
        : crypto.getRandomValues(new Uint8Array(32)),
    )
  : await api.buildFreshWallet(config);

const providers = await api.configureProviders(walletCtx, config);

console.log("Deploying Milestone contract to Preview...");
const deployed = await api.deploy(providers, walletCtx.ownerSecretKey);
const contractAddress = deployed.deployTxData.public.contractAddress;

console.log(`
──────────────────────────────────────────────────────────────
  Deployed! Contract address:
  ${contractAddress}
──────────────────────────────────────────────────────────────
`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Initial public ledger state:", state);
console.log(`\nOwner secret key (save this to call resetMilestones later):`);
console.log(`  ${toHex(Buffer.from(walletCtx.ownerSecretKey))}`);

process.exit(0);
