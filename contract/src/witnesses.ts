/*
 * Defines the shape of the milestone contract's private state and the
 * witness function that reads it. None of this ever touches the public
 * ledger unless a circuit explicitly calls disclose() on a value derived
 * from it.
 */

import { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { Ledger } from "./managed/milestone/contract/index.js";

export type MilestonePrivateState = {
  readonly secretKey: Uint8Array;
};

export const createMilestonePrivateState = (
  secretKey: Uint8Array,
): MilestonePrivateState => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, MilestonePrivateState>): [
    MilestonePrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
