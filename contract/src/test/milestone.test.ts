import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { MilestoneSimulator } from "./milestone-simulator.js";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("Milestone forum contract", () => {
  it("initializes with an empty feed", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    expect(simulator.getLedger().postCount).toEqual(0n);
    expect(simulator.getFeed()).toEqual([]);
  });

  it("drops a milestone post to the public feed", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);

    simulator.post("got a new car");

    const feed = simulator.getFeed();
    expect(feed).toHaveLength(1);
    expect(feed[0].id).toEqual(1n);
    expect(feed[0].parentId).toEqual(0n);
    expect(feed[0].label).toEqual("got a new car");
    expect(feed[0].author).toEqual(MilestoneSimulator.publicKey(key));
  });

  it("assigns increasing ids and keeps newest posts first", () => {
    const alice = randomBytes(32);
    const simulator = new MilestoneSimulator(alice);
    simulator.post("first milestone");

    const bob = randomBytes(32);
    simulator.switchUser(bob);
    simulator.post("second milestone");

    const feed = simulator.getFeed();
    expect(feed).toHaveLength(2);
    expect(feed[0].label).toEqual("second milestone");
    expect(feed[0].id).toEqual(2n);
    expect(feed[1].label).toEqual("first milestone");
    expect(feed[1].id).toEqual(1n);
  });

  it("replies to an existing post, recording its parent id", () => {
    const alice = randomBytes(32);
    const simulator = new MilestoneSimulator(alice);
    simulator.post("ran my first 5k");

    const bob = randomBytes(32);
    simulator.switchUser(bob);
    simulator.reply(1n, "congrats!!");

    const feed = simulator.getFeed();
    expect(feed).toHaveLength(2);
    expect(feed[0].parentId).toEqual(1n);
    expect(feed[0].label).toEqual("congrats!!");
    expect(feed[0].author).toEqual(MilestoneSimulator.publicKey(bob));
    expect(feed[1].author).toEqual(MilestoneSimulator.publicKey(alice));
  });

  it("rejects a reply to a post id that doesn't exist yet", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    expect(() => simulator.reply(1n, "nope")).toThrow(
      "Parent post does not exist",
    );
  });

  it("rejects a reply with parentId 0 (reserved for top-level posts)", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    simulator.post("a post");
    expect(() => simulator.reply(0n, "nope")).toThrow("Invalid parent post");
  });

  it("the same secret key always produces the same pseudonymous author", () => {
    const key = randomBytes(32);
    const simulator = new MilestoneSimulator(key);
    simulator.post("first");
    simulator.post("second");

    const feed = simulator.getFeed();
    expect(feed[0].author).toEqual(feed[1].author);
  });

  it("different secret keys produce different pseudonymous authors", () => {
    const alice = randomBytes(32);
    const bob = randomBytes(32);
    expect(MilestoneSimulator.publicKey(alice)).not.toEqual(
      MilestoneSimulator.publicKey(bob),
    );
  });
});
