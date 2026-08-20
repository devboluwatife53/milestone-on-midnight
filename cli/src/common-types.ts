import { Milestone, type MilestonePrivateState } from "@milestone/contract";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js/types";
import type {
  DeployedContract,
  FoundContract,
} from "@midnight-ntwrk/midnight-js/contracts";
import type { ProvableCircuitId } from "@midnight-ntwrk/compact-js";

export type MilestoneCircuits = ProvableCircuitId<
  Milestone.Contract<MilestonePrivateState>
>;

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
