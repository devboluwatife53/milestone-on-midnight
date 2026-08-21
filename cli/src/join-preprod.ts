/*
 * Reads the public ledger state of an already-deployed Milestone contract
 * on Preprod, without needing a wallet or private state.
 *
 * Usage:
 *   CONTRACT_ADDRESS=<address> npm run status:preprod
 */
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { Milestone } from "@milestone/contract";
import { PreprodConfig } from "./config.js";

const config = new PreprodConfig();
const contractAddress = process.env.CONTRACT_ADDRESS;
if (!contractAddress) {
  throw new Error("Set CONTRACT_ADDRESS to the deployed contract's address");
}

const publicDataProvider = indexerPublicDataProvider(config.indexer, config.indexerWS);
const contractState = await publicDataProvider.queryContractState(contractAddress);

if (contractState == null) {
  console.log(`No contract found at ${contractAddress} on Preprod.`);
} else {
  const l = Milestone.ledger(contractState.data);
  console.log(`
Contract:            ${contractAddress}
owner (public key):  ${Buffer.from(l.owner).toString("hex")}
milestonesReached:   ${l.milestonesReached}
lastDisclosedTotal:  ${l.lastDisclosedTotal}
`);
}

process.exit(0);
