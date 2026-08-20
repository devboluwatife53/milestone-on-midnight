/*
 * Defines the shape of the milestone contract's private state and the
 * witness functions that read/update it. None of this ever touches the
 * public ledger unless a circuit explicitly calls disclose().
 */

import { Ledger } from "./managed/milestone/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type MilestonePrivateState = {
  readonly secretKey: Uint8Array;
  readonly hiddenTotal: bigint;
};

export const createMilestonePrivateState = (
  secretKey: Uint8Array,
  hiddenTotal: bigint = 0n,
): MilestonePrivateState => ({
  secretKey,
  hiddenTotal,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, MilestonePrivateState>): [
    MilestonePrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  addToHiddenTotal: (
    { privateState }: WitnessContext<Ledger, MilestonePrivateState>,
    amount: bigint,
  ): [MilestonePrivateState, bigint] => {
    const newTotal = privateState.hiddenTotal + amount;
    return [{ ...privateState, hiddenTotal: newTotal }, newTotal];
  },
};
