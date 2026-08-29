/*
 * Calls `celebrate(percent, label)` on an already-deployed Milestone forum
 * contract. The percentage is a private circuit argument (1-100) — it never
 * touches the ledger unless it pushes your hidden running progress past
 * 100% (one completed goal). When it does, `label` (the achievement text,
 * e.g. "got a new car") is posted to the public feed alongside the tier
 * reached.
 *
 * Usage:
 *   CONTRACT_ADDRESS=<address> \
 *   WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
 *   PERCENT=40 LABEL="got a new car" npm run celebrate:preview
 */
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreviewConfig } from "./config.js";

const config = new PreviewConfig();

const contractAddress = process.env.CONTRACT_ADDRESS;
const seed = process.env.WALLET_SEED;
const identitySecretKeyHex = process.env.IDENTITY_SECRET_KEY;
const percent = BigInt(process.env.PERCENT ?? "10");
const label = process.env.LABEL ?? "hit a milestone";

if (!contractAddress || !seed || !identitySecretKeyHex) {
  throw new Error(
    "Set CONTRACT_ADDRESS, WALLET_SEED, and IDENTITY_SECRET_KEY environment variables",
  );
}

const identitySecretKey = new Uint8Array(Buffer.from(identitySecretKeyHex, "hex"));
const walletCtx = await api.buildWalletAndWaitForFunds(config, seed, identitySecretKey);
const providers = await api.configureProviders(walletCtx, config);

const contract = await api.joinContract(providers, contractAddress, identitySecretKey);
console.log(`Logging ${percent}% (private) progress toward "${label}"...`);
const tx = await api.celebrate(contract, percent, label);
console.log(`Transaction ${tx.txId} included in block ${tx.blockHeight}`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Public feed state after celebrating:", state);

process.exit(0);
