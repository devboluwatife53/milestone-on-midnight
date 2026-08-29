/*
 * Defines the shape of the milestone contract's private state and the
 * witness functions that read/update it. None of this ever touches the
 * public ledger unless a circuit explicitly calls disclose().
 */

import { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { Ledger } from "./managed/milestone/contract/index.js";

export type MilestonePrivateState = {
  readonly secretKey: Uint8Array;
  readonly hiddenProgress: bigint;
  readonly tierReached: bigint;
};

export const createMilestonePrivateState = (
  secretKey: Uint8Array,
  hiddenProgress: bigint = 0n,
  tierReached: bigint = 0n,
): MilestonePrivateState => ({
  secretKey,
  hiddenProgress,
  tierReached,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, MilestonePrivateState>): [
    MilestonePrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  addToHiddenProgress: (
    { privateState }: WitnessContext<Ledger, MilestonePrivateState>,
    percent: bigint,
  ): [MilestonePrivateState, bigint] => {
    const newTotal = privateState.hiddenProgress + percent;
    return [{ ...privateState, hiddenProgress: newTotal }, newTotal];
  },

  currentTier: ({
    privateState,
  }: WitnessContext<Ledger, MilestonePrivateState>): [
    MilestonePrivateState,
    bigint,
  ] => [privateState, privateState.tierReached],

  advanceTier: ({
    privateState,
  }: WitnessContext<Ledger, MilestonePrivateState>): [
    MilestonePrivateState,
    [],
  ] => [
    { ...privateState, tierReached: privateState.tierReached + 1n },
    [],
  ],
};
