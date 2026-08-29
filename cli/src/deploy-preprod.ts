/*
 * Deploys the Milestone forum contract to the Midnight Preprod testnet.
 *
 * Usage:
 *   WALLET_SEED=<hex>              (optional, else a fresh wallet is generated)
 *   IDENTITY_SECRET_KEY=<hex>      (optional, else a fresh identity key is generated)
 *   npm run deploy:preprod
 *
 * Requires a local proof server running on :6300 (see `npm run proof-server`)
 * and a funded Preprod wallet (use the Preprod faucet).
 */
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreprodConfig } from "./config.js";

const config = new PreprodConfig();

const seed = process.env.WALLET_SEED;
const identitySecretKeyHex = process.env.IDENTITY_SECRET_KEY;

const walletCtx = seed
  ? await api.buildWalletAndWaitForFunds(
      config,
      seed,
      identitySecretKeyHex
        ? new Uint8Array(Buffer.from(identitySecretKeyHex, "hex"))
        : crypto.getRandomValues(new Uint8Array(32)),
    )
  : await api.buildFreshWallet(config);

const providers = await api.configureProviders(walletCtx, config);

console.log("Deploying Milestone forum contract to Preprod...");
const deployed = await api.deploy(providers, walletCtx.identitySecretKey);
const contractAddress = deployed.deployTxData.public.contractAddress;

console.log(`
──────────────────────────────────────────────────────────────
  Deployed! Contract address:
  ${contractAddress}
──────────────────────────────────────────────────────────────
`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Initial public feed state:", state);

process.exit(0);
