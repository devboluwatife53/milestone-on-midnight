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
  type MilestonePost,
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

  constructor(secretKey: Uint8Array) {
    this.contract = new Contract<MilestonePrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createMilestonePrivateState(secretKey),
        "0".repeat(64),
      ),
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

  public switchUser(secretKey: Uint8Array) {
    this.circuitContext.currentPrivateState = createMilestonePrivateState(secretKey);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getFeed(): MilestonePost[] {
    return [...this.getLedger().feed];
  }

  public getPrivateState(): MilestonePrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public post(label: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.post(
      this.circuitContext,
      label,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public reply(parentId: bigint, label: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.reply(
      this.circuitContext,
      parentId,
      label,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public static publicKey(secretKey: Uint8Array): Uint8Array {
    return pureCircuits.publicKey(secretKey);
  }
}
