import path from "node:path";
import { fileURLToPath } from "node:url";
import { setNetworkId } from "@midnight-ntwrk/midnight-js/network-id";

export const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const contractConfig = {
  privateStateStoreName: "milestone-private-state",
  zkConfigPath: path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "milestone",
  ),
};

export interface Config {
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
  readonly faucet?: string;
}

export class StandaloneConfig implements Config {
  indexer = "http://127.0.0.1:8088/api/v3/graphql";
  indexerWS = "ws://127.0.0.1:8088/api/v3/graphql/ws";
  node = "http://127.0.0.1:9944";
  proofServer = "http://127.0.0.1:6300";
  constructor() {
    setNetworkId("undeployed");
  }
}

export class PreviewConfig implements Config {
  indexer = "https://indexer.preview.midnight.network/api/v3/graphql";
  indexerWS = "wss://indexer.preview.midnight.network/api/v3/graphql/ws";
  node = "https://rpc.preview.midnight.network";
  proofServer = "http://127.0.0.1:6300";
  faucet = "https://faucet.preview.midnight.network/";
  constructor() {
    setNetworkId("preview");
  }
}

export class PreprodConfig implements Config {
  indexer = "https://indexer.preprod.midnight.network/api/v4/graphql";
  indexerWS = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
  node = "https://rpc.preprod.midnight.network";
  proofServer = "http://127.0.0.1:6300";
  faucet = "https://faucet.preprod.midnight.network/";
  constructor() {
    setNetworkId("preprod");
  }
}
