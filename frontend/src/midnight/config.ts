import { setNetworkId } from "@midnight-ntwrk/midnight-js/network-id";

export type NetworkName = "preview" | "preprod";

export interface NetworkConfig {
  readonly networkId: NetworkName;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly faucet: string;
  readonly explorer: string;
}

const NETWORKS: Record<NetworkName, NetworkConfig> = {
  preview: {
    networkId: "preview",
    indexer: "https://indexer.preview.midnight.network/api/v3/graphql",
    indexerWS: "wss://indexer.preview.midnight.network/api/v3/graphql/ws",
    node: "https://rpc.preview.midnight.network",
    faucet: "https://faucet.preview.midnight.network/",
    explorer: "https://preview.midnightexplorer.com/contracts",
  },
  preprod: {
    networkId: "preprod",
    indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    node: "https://rpc.preprod.midnight.network",
    faucet: "https://faucet.preprod.midnight.network/",
    explorer: "https://midnightexplorer.com/preprod/contracts",
  },
};

const envNetwork = (import.meta.env.VITE_NETWORK as string | undefined)?.trim();
export const activeNetwork: NetworkName =
  envNetwork === "preview" || envNetwork === "preprod" ? envNetwork : "preprod";

export const networkConfig = NETWORKS[activeNetwork];

// The zk artifacts are copied into public/managed/milestone by
// `npm run sync-zk-assets` (see scripts/sync-zk-assets.mjs), so they're
// reachable as plain static files at runtime.
export const zkConfigBaseUrl = `${window.location.origin}/managed/milestone`;

export const defaultContractAddress = (
  import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined
)?.trim();

setNetworkId(networkConfig.networkId);
