import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { networkConfig } from "./config";

/**
 * Wallets inject their Initial API under `window.midnight`, keyed by a
 * per-install UUID (not a fixed name like "mnLace") — so DApps must
 * enumerate rather than reach for a hardcoded key.
 */
export const listInjectedWallets = (): InitialAPI[] => {
  const injected = window.midnight;
  return injected ? Object.values(injected) : [];
};

export class NoWalletFoundError extends Error {
  constructor() {
    super(
      "No Midnight wallet extension found. Install Lace (Midnight preview build) and reload.",
    );
    this.name = "NoWalletFoundError";
  }
}

/**
 * Connects to the first injected wallet (in practice, Lace) on the network
 * this app is configured for. Returns both the live ConnectedAPI and a
 * snapshot of the wallet's addresses for display.
 */
export const connectWallet = async (): Promise<{
  api: ConnectedAPI;
  walletName: string;
  unshieldedAddress: string;
  shieldedAddress: string;
}> => {
  const wallets = listInjectedWallets();
  if (wallets.length === 0) {
    throw new NoWalletFoundError();
  }
  // A real multi-wallet DApp would let the user pick; Lace is the only
  // wallet we target here.
  const wallet = wallets[0];
  const api = await wallet.connect(networkConfig.networkId);

  const status = await api.getConnectionStatus();
  if (status.status !== "connected") {
    throw new Error("Wallet reported a disconnected status right after connect()");
  }
  if (status.networkId !== networkConfig.networkId) {
    throw new Error(
      `Wallet is on network "${status.networkId}", but this app expects "${networkConfig.networkId}". Switch networks in Lace and reconnect.`,
    );
  }

  const [{ unshieldedAddress }, { shieldedAddress }] = await Promise.all([
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
  ]);

  return { api, walletName: wallet.name, unshieldedAddress, shieldedAddress };
};

/**
 * The DApp Connector API has no `disconnect()` method — the wallet extension
 * owns the authorization grant and manages revocation itself. "Disconnecting"
 * from the DApp side means dropping our reference to the ConnectedAPI and
 * any providers built from it, which is what the caller should do with the
 * return value of this function (i.e. set state back to null).
 */
export const disconnectWallet = (): void => {
  // Intentionally a no-op beyond documentation: nothing to call on `api`.
  // Kept as a named function so the intent is explicit at call sites and in
  // the UI, rather than inlining a comment next to `setApi(null)`.
};
