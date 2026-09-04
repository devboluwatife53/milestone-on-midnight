import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { toHex, fromHex } from "@midnight-ntwrk/midnight-js/utils";
import { connectWallet, disconnectWallet } from "../midnight/dappConnector";
import { buildProviders } from "../midnight/providers";
import {
  post as postCircuit,
  reply as replyCircuit,
  derivePseudonym,
  getMilestoneLedgerState,
  joinContract as joinContractCircuit,
  type DeployedMilestoneContract,
  type MilestoneProviders,
  type MilestonePost,
} from "../midnight/contract";
import { defaultContractAddress } from "../midnight/config";

export type LedgerState = {
  postCount: bigint;
  feed: MilestonePost[];
};

export type WalletInfo = {
  walletName: string;
  unshieldedAddress: string;
  shieldedAddress: string;
};

// Scoped per contract address — an unscoped key would silently reuse the
// wrong identity secret if this browser deploys or joins more than one
// contract in the same session.
const identityKeyStorageKey = (contractAddress: string) =>
  `milestone.identitySecretKey.${contractAddress}`;

const randomSecretKey = (): Uint8Array => crypto.getRandomValues(new Uint8Array(32));

export const useMidnight = () => {
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [providers, setProviders] = useState<MilestoneProviders | null>(null);
  const [contract, setContract] = useState<DeployedMilestoneContract | null>(null);
  const [contractAddress, setContractAddress] = useState<string | undefined>(
    defaultContractAddress,
  );
  const [ledgerState, setLedgerState] = useState<LedgerState | null>(null);
  const [identitySecretKeyHex, setIdentitySecretKeyHex] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<{ txId: string; blockHeight?: number } | null>(null);

  const isConnected = api !== null;

  // The one-way hash the chain actually sees in place of this wallet's real
  // address — the "observable privacy behavior": derived entirely
  // client-side, never a network call, and never equal to the wallet
  // address it stands in for.
  const pseudonym = useMemo(
    () =>
      identitySecretKeyHex
        ? derivePseudonym(new Uint8Array(fromHex(identitySecretKeyHex)))
        : null,
    [identitySecretKeyHex],
  );

  const connect = useCallback(async () => {
    setError(null);
    setBusy("Connecting to Lace...");
    try {
      const { api: connectedApi, walletName, unshieldedAddress, shieldedAddress } =
        await connectWallet();
      setApi(connectedApi);
      setWallet({ walletName, unshieldedAddress, shieldedAddress });
      const built = await buildProviders(connectedApi);
      setProviders(built);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setApi(null);
    setWallet(null);
    setProviders(null);
    setContract(null);
    setLedgerState(null);
    setIdentitySecretKeyHex(null);
    setLastTx(null);
    setError(null);
  }, []);

  const refreshLedgerState = useCallback(
    async (address: string, currentProviders: MilestoneProviders) => {
      const state = await getMilestoneLedgerState(currentProviders, address);
      setLedgerState(state);
    },
    [],
  );

  const join = useCallback(
    async (address: string, identitySecretKeyOverride?: string) => {
      if (!providers) return;
      setError(null);
      setBusy("Loading the wall...");
      try {
        const stored =
          identitySecretKeyOverride ?? localStorage.getItem(identityKeyStorageKey(address));
        const identitySecretKey = stored ? new Uint8Array(fromHex(stored)) : randomSecretKey();
        const found = await joinContractCircuit(providers, address, identitySecretKey);
        localStorage.setItem(identityKeyStorageKey(address), toHex(identitySecretKey));
        setIdentitySecretKeyHex(toHex(identitySecretKey));
        setContract(found);
        setContractAddress(address);
        await refreshLedgerState(address, providers);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [providers, refreshLedgerState],
  );

  const post = useCallback(
    async (label: string) => {
      if (!contract || !providers || !contractAddress) return;
      setError(null);
      setBusy("Proving + pinning your milestone via Lace...");
      try {
        const tx = await postCircuit(contract, label);
        setLastTx({ txId: tx.txId, blockHeight: tx.blockHeight });
        await refreshLedgerState(contractAddress, providers);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [contract, providers, contractAddress, refreshLedgerState],
  );

  const reply = useCallback(
    async (parentId: bigint, label: string) => {
      if (!contract || !providers || !contractAddress) return;
      setError(null);
      setBusy("Proving + pinning your reply via Lace...");
      try {
        const tx = await replyCircuit(contract, parentId, label);
        setLastTx({ txId: tx.txId, blockHeight: tx.blockHeight });
        await refreshLedgerState(contractAddress, providers);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [contract, providers, contractAddress, refreshLedgerState],
  );

  // The app targets a single, universally-known deployed contract — no
  // manual deploy/join UI — so load it automatically once a wallet connects.
  useEffect(() => {
    if (isConnected && providers && defaultContractAddress && contract === null) {
      join(defaultContractAddress);
    }
  }, [isConnected, providers, contract, join]);

  return useMemo(
    () => ({
      isConnected,
      wallet,
      contractAddress,
      ledgerState,
      identitySecretKeyHex,
      pseudonym,
      busy,
      error,
      lastTx,
      hasContract: contract !== null,
      connect,
      disconnect,
      join,
      post,
      reply,
    }),
    [
      isConnected,
      wallet,
      contractAddress,
      ledgerState,
      identitySecretKeyHex,
      pseudonym,
      busy,
      error,
      lastTx,
      contract,
      connect,
      disconnect,
      join,
      post,
      reply,
    ],
  );
};
