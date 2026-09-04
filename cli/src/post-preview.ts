/*
 * Calls `post(label)` on an already-deployed Milestone forum contract on
 * Preview — drops a new milestone straight onto the public wall.
 *
 * Usage:
 *   CONTRACT_ADDRESS=<address> \
 *   WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
 *   LABEL="got a new car" npm run post:preview
 */
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreviewConfig } from "./config.js";

const config = new PreviewConfig();

const contractAddress = process.env.CONTRACT_ADDRESS;
const seed = process.env.WALLET_SEED;
const identitySecretKeyHex = process.env.IDENTITY_SECRET_KEY;
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
console.log(`Dropping milestone "${label}" onto the wall...`);
const tx = await api.post(contract, label);
console.log(`Transaction ${tx.txId} included in block ${tx.blockHeight}`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Public feed state after posting:", state);

process.exit(0);
