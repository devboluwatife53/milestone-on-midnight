import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { MilestoneSimulator } from "./milestone-simulator.js";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Milestone smart contract", () => {
  it("initializes public state with zero milestones and no private data leaked", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);
    const ledger = simulator.getLedger();

    expect(ledger.milestonesReached).toEqual(0n);
    expect(ledger.lastDisclosedTotal).toEqual(0n);
    expect(ledger.owner).toEqual(MilestoneSimulator.publicKey(owner));
  });

  it("keeps small contributions private (no ledger change) below the milestone threshold", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);

    simulator.contribute(40n);
    let ledger = simulator.getLedger();
    expect(ledger.milestonesReached).toEqual(0n);
    expect(ledger.lastDisclosedTotal).toEqual(0n);

    simulator.contribute(30n);
    ledger = simulator.getLedger();
    // hidden total is now 70, still under the 100 threshold
    expect(ledger.milestonesReached).toEqual(0n);
    expect(ledger.lastDisclosedTotal).toEqual(0n);

    // private state accumulated even though nothing was disclosed
    expect(simulator.getPrivateState().hiddenTotal).toEqual(70n);
  });

  it("discloses the cumulative total only once a milestone is crossed", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);

    simulator.contribute(40n);
    simulator.contribute(70n); // hidden total = 110, crosses the 100 threshold
    const ledger = simulator.getLedger();

    expect(ledger.milestonesReached).toEqual(1n);
    expect(ledger.lastDisclosedTotal).toEqual(110n);
  });

  it("can cross multiple milestones in a single contribution", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);

    simulator.contribute(250n);
    const ledger = simulator.getLedger();

    expect(ledger.milestonesReached).toEqual(1n);
    expect(ledger.lastDisclosedTotal).toEqual(250n);
  });

  it("rejects a non-positive contribution", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);
    expect(() => simulator.contribute(0n)).toThrow(
      "Contribution must be positive",
    );
  });

  it("lets the owner reset the public milestone counter", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);
    simulator.contribute(150n);
    expect(simulator.getLedger().milestonesReached).toEqual(1n);

    simulator.resetMilestones();
    const ledger = simulator.getLedger();
    expect(ledger.milestonesReached).toEqual(0n);
    expect(ledger.lastDisclosedTotal).toEqual(0n);
  });

  it("does not let a non-owner reset the milestone counter", () => {
    const owner = randomBytes(32);
    const simulator = new MilestoneSimulator(owner);
    simulator.contribute(150n);

    simulator.switchUser(randomBytes(32), 150n);
    expect(() => simulator.resetMilestones()).toThrow(
      "Only the owner can reset milestones",
    );
  });
});
