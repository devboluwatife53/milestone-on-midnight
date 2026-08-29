import { type ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import {
  deployContract,
  findDeployedContract,
  type DeployedContract,
  type FoundContract,
} from "@midnight-ntwrk/midnight-js/contracts";
import type { FinalizedTxData, MidnightProviders } from "@midnight-ntwrk/midnight-js/types";
import { assertIsContractAddress, toHex } from "@midnight-ntwrk/midnight-js/utils";
import type { ProvableCircuitId } from "@midnight-ntwrk/compact-js";
import {
  Milestone,
  createMilestonePrivateState,
  witnesses,
  type MilestonePrivateState,
} from "@milestone/contract";
import { zkConfigBaseUrl } from "./config";

export type MilestoneCircuits = ProvableCircuitId<Milestone.Contract<MilestonePrivateState>>;

export const MilestonePrivateStateId = "milestonePrivateState";

export type MilestoneProviders = MidnightProviders<
  MilestoneCircuits,
  typeof MilestonePrivateStateId,
  MilestonePrivateState
>;

export type MilestoneContract = Milestone.Contract<MilestonePrivateState>;
export type DeployedMilestoneContract =
  | DeployedContract<MilestoneContract>
  | FoundContract<MilestoneContract>;

export type MilestonePost = {
  author: string;
  tier: bigint;
  label: string;
};

const milestoneCompiledContract = CompiledContract.make(
  "milestone",
  Milestone.Contract<MilestonePrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  // The Node CLI reads compiled circuit files off disk; the browser fetches
  // the same files over HTTP (see providers.ts / FetchZkConfigProvider).
  CompiledContract.withCompiledFileAssets(zkConfigBaseUrl),
);

/** Read the public celebration feed + total count directly from the chain. */
export const getMilestoneLedgerState = async (
  providers: MilestoneProviders,
  contractAddress: ContractAddress,
) => {
  assertIsContractAddress(contractAddress);
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (state == null) return null;
  const l = Milestone.ledger(state.data);
  return {
    totalCelebrated: l.totalCelebrated,
    feed: [...l.feed].map(
      (post): MilestonePost => ({
        author: toHex(post.author),
        tier: post.tier,
        label: post.label,
      }),
    ),
  };
};

/**
 * Deploys a fresh Milestone forum contract. The connecting wallet's own key
 * is used as the private "identity secret" — nobody but this browser
 * session (via its local private state) ever learns it in plaintext.
 */
export const deploy = async (
  providers: MilestoneProviders,
  identitySecretKey: Uint8Array,
): Promise<DeployedMilestoneContract> => {
  const privateState: MilestonePrivateState = createMilestonePrivateState(identitySecretKey);
  return deployContract(providers, {
    compiledContract: milestoneCompiledContract,
    privateStateId: MilestonePrivateStateId,
    initialPrivateState: privateState,
  });
};

export const joinContract = async (
  providers: MilestoneProviders,
  contractAddress: string,
  identitySecretKey: Uint8Array,
): Promise<DeployedMilestoneContract> =>
  findDeployedContract(providers, {
    contractAddress,
    compiledContract: milestoneCompiledContract,
    privateStateId: MilestonePrivateStateId,
    initialPrivateState: createMilestonePrivateState(identitySecretKey),
  });

export const celebrate = async (
  contract: DeployedMilestoneContract,
  amount: bigint,
  label: string,
): Promise<FinalizedTxData> => {
  const finalizedTxData = await contract.callTx.celebrate(amount, label);
  return finalizedTxData.public;
};
