/*
 * Calls `reply(parentId, label)` on an already-deployed Milestone forum
 * contract on Preprod — replies to an existing post (or reply).
 *
 * Usage:
 *   CONTRACT_ADDRESS=<address> \
 *   WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
 *   PARENT_ID=1 LABEL="congrats!!" npm run reply:preprod
 */
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreprodConfig } from "./config.js";

const config = new PreprodConfig();

const contractAddress = process.env.CONTRACT_ADDRESS;
const seed = process.env.WALLET_SEED;
const identitySecretKeyHex = process.env.IDENTITY_SECRET_KEY;
const parentIdRaw = process.env.PARENT_ID;
const label = process.env.LABEL ?? "congrats!!";

if (!contractAddress || !seed || !identitySecretKeyHex || !parentIdRaw) {
  throw new Error(
    "Set CONTRACT_ADDRESS, WALLET_SEED, IDENTITY_SECRET_KEY, and PARENT_ID environment variables",
  );
}

const parentId = BigInt(parentIdRaw);
const identitySecretKey = new Uint8Array(Buffer.from(identitySecretKeyHex, "hex"));
const walletCtx = await api.buildWalletAndWaitForFunds(config, seed, identitySecretKey);
const providers = await api.configureProviders(walletCtx, config);

const contract = await api.joinContract(providers, contractAddress, identitySecretKey);
console.log(`Replying to post #${parentId} with "${label}"...`);
const tx = await api.reply(contract, parentId, label);
console.log(`Transaction ${tx.txId} included in block ${tx.blockHeight}`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Public feed state after replying:", state);

process.exit(0);
