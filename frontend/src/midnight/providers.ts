import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { CostModel, Transaction } from "@midnight-ntwrk/ledger-v8";
import type { MidnightProvider, UnboundTransaction, WalletProvider } from "@midnight-ntwrk/midnight-js/types";
import type { FinalizedTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { getNetworkId } from "@midnight-ntwrk/midnight-js/network-id";
import {
  fromHex,
  parseCoinPublicKeyToHex,
  parseEncPublicKeyToHex,
  toHex,
} from "@midnight-ntwrk/midnight-js/utils";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { dappConnectorProofProvider } from "@midnight-ntwrk/midnight-js-dapp-connector-proof-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { networkConfig, zkConfigBaseUrl } from "./config";
import type { MilestoneCircuits, MilestoneProviders } from "./contract";

/**
 * Bridges the DApp Connector's `ConnectedAPI` to midnight-js's
 * `WalletProvider` + `MidnightProvider` interfaces, which is what
 * `deployContract` / `findDeployedContract` / `contract.callTx` expect.
 *
 * The connector hands back and accepts hex-encoded, serialized transactions
 * (it has no notion of the `Transaction` class from `@midnight-ntwrk/ledger`),
 * so every call here serializes/deserializes across that boundary.
 */
const buildWalletAndMidnightProvider = async (
  api: ConnectedAPI,
): Promise<WalletProvider & MidnightProvider> => {
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await api.getShieldedAddresses();
  const networkId = getNetworkId();
  const coinPublicKey = parseCoinPublicKeyToHex(shieldedCoinPublicKey, networkId);
  const encryptionPublicKey = parseEncPublicKeyToHex(shieldedEncryptionPublicKey, networkId);

  return {
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => encryptionPublicKey,

    balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
      const txHex = toHex(tx.serialize());
      const { tx: balancedHex } = await api.balanceUnsealedTransaction(txHex);
      return Transaction.deserialize("signature", "proof", "binding", fromHex(balancedHex));
    },

    submitTx: async (tx: FinalizedTransaction) => {
      const txHex = toHex(tx.serialize());
      await api.submitTransaction(txHex);
      // The connector's submitTransaction resolves with no payload; the
      // transaction's own hash (already a plain string) is what
      // midnight-js treats as its id.
      return tx.transactionHash();
    },
  };
};

export const buildProviders = async (api: ConnectedAPI): Promise<MilestoneProviders> => {
  const [walletAndMidnightProvider, { unshieldedAddress }] = await Promise.all([
    buildWalletAndMidnightProvider(api),
    api.getUnshieldedAddress(),
  ]);

  const zkConfigProvider = new FetchZkConfigProvider<MilestoneCircuits>(zkConfigBaseUrl);

  // Delegate proving to the wallet itself (Lace runs the prover) instead of
  // shipping a local proof server — this is the point of the connector API.
  const proofProvider = await dappConnectorProofProvider(
    api,
    zkConfigProvider,
    CostModel.initialCostModel(),
  );

  // `level` resolves to an IndexedDB-backed store in the browser. Private
  // state never leaves this database — it's scoped per wallet account so
  // multiple contract deployments/sessions in the same browser don't bleed
  // into each other.
  const privateStateProvider = levelPrivateStateProvider({
    privateStateStoreName: "milestone-private-state",
    accountId: unshieldedAddress,
    privateStoragePasswordProvider: () =>
      `${btoa(unshieldedAddress).slice(0, 24)}-milestone!`,
  });

  return {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  } as unknown as MilestoneProviders;
};
