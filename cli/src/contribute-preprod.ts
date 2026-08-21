/*
 * Calls `contribute(amount)` on an already-deployed Milestone contract on
 * Preprod. The amount is a private circuit argument — it never touches the
 * ledger unless it pushes the hidden running total past the next milestone.
 *
 * Usage:
 *   CONTRACT_ADDRESS=<address> \
 *   WALLET_SEED=<hex> OWNER_SECRET_KEY=<hex> \
 *   AMOUNT=40 npm run contribute:preprod
 */
import { Buffer } from "node:buffer";
import * as api from "./api.js";
import { PreprodConfig } from "./config.js";

const config = new PreprodConfig();

const contractAddress = process.env.CONTRACT_ADDRESS;
const seed = process.env.WALLET_SEED;
const ownerSecretKeyHex = process.env.OWNER_SECRET_KEY;
const amount = BigInt(process.env.AMOUNT ?? "10");

if (!contractAddress || !seed || !ownerSecretKeyHex) {
  throw new Error(
    "Set CONTRACT_ADDRESS, WALLET_SEED, and OWNER_SECRET_KEY environment variables",
  );
}

const ownerSecretKey = new Uint8Array(Buffer.from(ownerSecretKeyHex, "hex"));
const walletCtx = await api.buildWalletAndWaitForFunds(config, seed, ownerSecretKey);
const providers = await api.configureProviders(walletCtx, config);

const contract = await api.joinContract(providers, contractAddress, ownerSecretKey);
console.log(`Contributing ${amount} (private amount)...`);
const tx = await api.contribute(contract, amount);
console.log(`Transaction ${tx.txId} included in block ${tx.blockHeight}`);

const state = await api.getMilestoneLedgerState(providers, contractAddress);
console.log("Public ledger state after contribution:", state);

process.exit(0);
