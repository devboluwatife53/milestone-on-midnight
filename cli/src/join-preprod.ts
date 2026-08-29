/*
 * Reads the public feed of an already-deployed Milestone forum contract
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
  const posts = [...l.feed];
  const feedText = posts.length
    ? posts
        .map(
          (post) =>
            `  [tier ${post.tier}] ${Buffer.from(post.author).toString("hex").slice(0, 12)}… — ${post.label}`,
        )
        .join("\n")
    : "  (no milestones celebrated yet)";

  console.log(`
Contract:           ${contractAddress}
totalCelebrated:    ${l.totalCelebrated}

Public feed (newest first):
${feedText}
`);
}

process.exit(0);
