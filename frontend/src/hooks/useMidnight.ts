import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { toHex, fromHex } from "@midnight-ntwrk/midnight-js/utils";
import { connectWallet, disconnectWallet } from "../midnight/dappConnector";
import { buildProviders } from "../midnight/providers";
import {
  contribute as contributeCircuit,
  deploy as deployContractCircuit,
  getMilestoneLedgerState,
  joinContract as joinContractCircuit,
  resetMilestones as resetMilestonesCircuit,
  type DeployedMilestoneContract,
  type MilestoneProviders,
} from "../midnight/contract";
import { defaultContractAddress } from "../midnight/config";

export type LedgerState = {
  owner: string;
  milestonesReached: bigint;
  lastDisclosedTotal: bigint;
};

export type WalletInfo = {
  walletName: string;
  unshieldedAddress: string;
  shieldedAddress: string;
};

// Scoped per contract address — an unscoped key would silently reuse the
// wrong owner secret if this browser deploys or joins more than one
// contract in the same session.
const ownerKeyStorageKey = (contractAddress: string) =>
  `milestone.ownerSecretKey.${contractAddress}`;

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
  const [ownerSecretKeyHex, setOwnerSecretKeyHex] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<{ txId: string; blockHeight?: number } | null>(null);

  const isConnected = api !== null;

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
    async (address: string, ownerSecretKeyOverride?: string) => {
      if (!providers) return;
      setError(null);
      setBusy("Loading contract...");
      try {
        const stored = ownerSecretKeyOverride ?? localStorage.getItem(ownerKeyStorageKey(address));
        const ownerSecretKey = stored ? new Uint8Array(fromHex(stored)) : randomSecretKey();
        const found = await joinContractCircuit(providers, address, ownerSecretKey);
        localStorage.setItem(ownerKeyStorageKey(address), toHex(ownerSecretKey));
        setOwnerSecretKeyHex(toHex(ownerSecretKey));
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

  const createMilestone = useCallback(async () => {
    if (!providers) return;
    setError(null);
    setBusy("Deploying your milestone contract (proving + submitting via Lace)...");
    try {
      const ownerSecretKey = randomSecretKey();
      const deployed = await deployContractCircuit(providers, ownerSecretKey);
      const address = deployed.deployTxData.public.contractAddress;
      localStorage.setItem(ownerKeyStorageKey(address), toHex(ownerSecretKey));
      setOwnerSecretKeyHex(toHex(ownerSecretKey));
      setContract(deployed);
      setContractAddress(address);
      await refreshLedgerState(address, providers);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [providers, refreshLedgerState]);

  const contribute = useCallback(
    async (amount: bigint) => {
      if (!contract || !providers || !contractAddress) return;
      setError(null);
      setBusy(`Proving + submitting contribute(${amount}) via Lace...`);
      try {
        const before = ledgerState;
        const tx = await contributeCircuit(contract, amount);
        setLastTx({ txId: tx.txId, blockHeight: tx.blockHeight });
        await refreshLedgerState(contractAddress, providers);
        return before;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [contract, providers, contractAddress, ledgerState, refreshLedgerState],
  );

  // Load the well-known demo contract by default so there's something to
  // look at right after connecting; users can still create their own or
  // load a different address via MilestoneSwitcher.
  useEffect(() => {
    if (isConnected && providers && defaultContractAddress && contract === null) {
      join(defaultContractAddress);
    }
  }, [isConnected, providers, contract, join]);

  const resetMilestones = useCallback(async () => {
    if (!contract || !providers || !contractAddress) return;
    setError(null);
    setBusy("Proving + submitting resetMilestones() via Lace...");
    try {
      const tx = await resetMilestonesCircuit(contract);
      setLastTx({ txId: tx.txId, blockHeight: tx.blockHeight });
      await refreshLedgerState(contractAddress, providers);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, [contract, providers, contractAddress, refreshLedgerState]);

  return useMemo(
    () => ({
      isConnected,
      wallet,
      contractAddress,
      ledgerState,
      ownerSecretKeyHex,
      busy,
      error,
      lastTx,
      hasContract: contract !== null,
      connect,
      disconnect,
      join,
      createMilestone,
      contribute,
      resetMilestones,
    }),
    [
      isConnected,
      wallet,
      contractAddress,
      ledgerState,
      ownerSecretKeyHex,
      busy,
      error,
      lastTx,
      contract,
      connect,
      disconnect,
      join,
      createMilestone,
      contribute,
      resetMilestones,
    ],
  );
};
