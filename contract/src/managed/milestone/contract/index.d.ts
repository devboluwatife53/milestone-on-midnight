import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type MilestonePost = { author: Uint8Array; tier: bigint; label: string };

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  addToHiddenProgress(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      percent_0: bigint): [PS, bigint];
  currentTier(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  advanceTier(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, []];
}

export type ImpureCircuits<PS> = {
  celebrate(context: __compactRuntime.CircuitContext<PS>,
            percent_0: bigint,
            label_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  celebrate(context: __compactRuntime.CircuitContext<PS>,
            percent_0: bigint,
            label_0: string): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  publicKey(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  celebrate(context: __compactRuntime.CircuitContext<PS>,
            percent_0: bigint,
            label_0: string): __compactRuntime.CircuitResults<PS, []>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  feed: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: MilestonePost };
    [Symbol.iterator](): Iterator<MilestonePost>
  };
  readonly totalCelebrated: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
