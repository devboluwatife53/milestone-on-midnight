import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
  pureCircuits,
} from "../managed/milestone/contract/index.js";
import {
  type MilestonePrivateState,
  createMilestonePrivateState,
  witnesses,
} from "../witnesses.js";

/**
 * Serves as a testbed to exercise the milestone contract without a real
 * network, prover, or indexer.
 */
export class MilestoneSimulator {
  readonly contract: Contract<MilestonePrivateState>;
  circuitContext: CircuitContext<MilestonePrivateState>;

  constructor(ownerSecretKey: Uint8Array) {
    this.contract = new Contract<MilestonePrivateState>(witnesses);
    const ownerPublicKey = pureCircuits.publicKey(ownerSecretKey);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createMilestonePrivateState(ownerSecretKey),
        "0".repeat(64),
      ),
      ownerPublicKey,
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(secretKey: Uint8Array, hiddenTotal = 0n) {
    this.circuitContext.currentPrivateState = createMilestonePrivateState(
      secretKey,
      hiddenTotal,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): MilestonePrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public contribute(amount: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.contribute(
      this.circuitContext,
      amount,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public resetMilestones(): Ledger {
    this.circuitContext = this.contract.impureCircuits.resetMilestones(
      this.circuitContext,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public static publicKey(secretKey: Uint8Array): Uint8Array {
    return pureCircuits.publicKey(secretKey);
  }
}
