import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { MilestoneSimulator } from "./milestone-simulator.js";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Milestone forum contract", () => {
  it("initializes with an empty feed and no milestones celebrated", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    const ledger = simulator.getLedger();

    expect(ledger.totalCelebrated).toEqual(0n);
    expect(simulator.getFeed()).toEqual([]);
  });

  it("keeps small progress private (no ledger change) below 100%", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    simulator.celebrate(40n, "saved some cash");
    expect(simulator.getLedger().totalCelebrated).toEqual(0n);
    expect(simulator.getFeed()).toEqual([]);

    simulator.celebrate(30n, "saved a bit more");
    // hidden progress is now 70%, still under the 100% threshold
    expect(simulator.getLedger().totalCelebrated).toEqual(0n);
    expect(simulator.getFeed()).toEqual([]);

    // private state accumulated even though nothing was disclosed
    expect(simulator.getPrivateState().hiddenProgress).toEqual(70n);
  });

  it("posts to the public feed only once progress reaches 100%", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    simulator.celebrate(40n, "got closer");
    simulator.celebrate(70n, "got a new car"); // hidden progress = 110%, crosses 100%

    expect(simulator.getLedger().totalCelebrated).toEqual(1n);
    const feed = simulator.getFeed();
    expect(feed).toHaveLength(1);
    expect(feed[0].tier).toEqual(1n);
    expect(feed[0].label).toEqual("got a new car");
    expect(feed[0].author).toEqual(MilestoneSimulator.publicKey(key));
  });

  it("never discloses the private percentage or label of a call that doesn't cross 100%", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    simulator.celebrate(40n, "this should never appear on chain");
    expect(simulator.getFeed()).toEqual([]);
  });

  it("newest posts appear first in the feed", () => {
    const alice = randomBytes(32);
    const simulator = new MilestoneSimulator(alice);
    simulator.celebrate(100n, "first milestone");

    const bob = randomBytes(32);
    simulator.switchUser(bob);
    simulator.celebrate(100n, "second milestone");

    const feed = simulator.getFeed();
    expect(feed).toHaveLength(2);
    expect(feed[0].label).toEqual("second milestone");
    expect(feed[1].label).toEqual("first milestone");
  });

  it("hitting exactly 100% in one call posts once", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    simulator.celebrate(100n, "nailed it in one go");
    expect(simulator.getLedger().totalCelebrated).toEqual(1n);
    expect(simulator.getFeed()).toHaveLength(1);
  });

  it("rejects a non-positive percentage", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    expect(() => simulator.celebrate(0n, "nope")).toThrow(
      "Percent must be positive",
    );
  });

  it("rejects a percentage over 100", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    expect(() => simulator.celebrate(101n, "nope")).toThrow(
      "Percent must be at most 100",
    );
  });
});
