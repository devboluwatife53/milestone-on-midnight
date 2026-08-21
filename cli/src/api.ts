/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  Milestone,
  type MilestonePrivateState,
  createMilestonePrivateState,
  witnesses,
} from "@milestone/contract";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js/contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  type FinalizedTxData,
  type MidnightProvider,
  type WalletProvider,
} from "@midnight-ntwrk/midnight-js/types";
import { getNetworkId } from "@midnight-ntwrk/midnight-js/network-id";
import { assertIsContractAddress, toHex } from "@midnight-ntwrk/midnight-js/utils";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import {
  InMemoryTransactionHistoryStorage,
  TransactionHistoryStorage,
} from "@midnight-ntwrk/wallet-sdk-abstractions";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { HDWallet, Roles, generateRandomSeed } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import {
  MidnightBech32m,
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from "@midnight-ntwrk/wallet-sdk-address-format";
import { Buffer } from "node:buffer";
import * as Rx from "rxjs";
import { WebSocket } from "ws";
import {
  type MilestoneCircuits,
  type MilestoneContract,
  type MilestoneProviders,
  type DeployedMilestoneContract,
} from "./common-types.js";
import { type Config, contractConfig } from "./config.js";

// Required for GraphQL subscriptions (wallet sync) to work in Node.js
// @ts-expect-error: needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

const milestoneCompiledContract = CompiledContract.make(
  "milestone",
  Milestone.Contract<MilestonePrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(contractConfig.zkConfigPath),
);

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
  /** The 32-byte secret key used inside the contract's localSecretKey witness. */
  ownerSecretKey: Uint8Array;
}

export const milestoneContractInstance: MilestoneContract = new Milestone.Contract(
  witnesses,
);

/** Read the public milestone counter + last disclosed total directly from the chain. */
export const getMilestoneLedgerState = async (
  providers: MilestoneProviders,
  contractAddress: ContractAddress,
) => {
  assertIsContractAddress(contractAddress);
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (state == null) return null;
  const l = Milestone.ledger(state.data);
  return {
    owner: toHex(l.owner),
    milestonesReached: l.milestonesReached,
    lastDisclosedTotal: l.lastDisclosedTotal,
  };
};

export const deploy = async (
  providers: MilestoneProviders,
  ownerSecretKey: Uint8Array,
): Promise<DeployedMilestoneContract> => {
  const ownerPublicKey = Milestone.pureCircuits.publicKey(ownerSecretKey);
  const privateState: MilestonePrivateState = createMilestonePrivateState(ownerSecretKey);
  const contract = await deployContract(providers, {
    compiledContract: milestoneCompiledContract,
    privateStateId: "milestonePrivateState",
    initialPrivateState: privateState,
    args: [ownerPublicKey],
  });
  return contract;
};

export const joinContract = async (
  providers: MilestoneProviders,
  contractAddress: string,
  ownerSecretKey: Uint8Array,
): Promise<DeployedMilestoneContract> =>
  findDeployedContract(providers, {
    contractAddress,
    compiledContract: milestoneCompiledContract,
    privateStateId: "milestonePrivateState",
    initialPrivateState: createMilestonePrivateState(ownerSecretKey),
  });

export const contribute = async (
  contract: DeployedMilestoneContract,
  amount: bigint,
): Promise<FinalizedTxData> => {
  const finalizedTxData = await contract.callTx.contribute(amount);
  return finalizedTxData.public;
};

/** Bridges the wallet-sdk-facade to the midnight-js contract API. */
export const createWalletAndMidnightProvider = async (
  ctx: WalletContext,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(
    ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  return {
    getCoinPublicKey() {
      return state.shielded.coinPublicKey.toHexString();
    },
    getEncryptionPublicKey() {
      return state.shielded.encryptionPublicKey.toHexString();
    },
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx(tx: any) {
      return ctx.wallet.submitTransaction(tx) as any;
    },
  };
};

export const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((state) => state.isSynced),
    ),
  );

export const waitForFunds = (wallet: WalletFacade): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.filter((state) => state.isSynced),
      Rx.map((s) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

const buildShieldedConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl: indexer, indexerWsUrl: indexerWS },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, "ws")),
});

const buildUnshieldedConfig = ({ indexer, indexerWS }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: { indexerHttpUrl: indexer, indexerWsUrl: indexerWS },
  txHistoryStorage: new InMemoryTransactionHistoryStorage(
    TransactionHistoryStorage.TransactionHistoryCommonSchema,
  ),
});

const buildDustConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
  indexerClientConnection: { indexerHttpUrl: indexer, indexerWsUrl: indexerWS },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, "ws")),
});

const deriveKeysFromSeed = (seed: string) => {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, "hex"));
  if (hdWallet.type !== "seedOk") {
    throw new Error("Failed to initialize HDWallet from seed");
  }
  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivationResult.type !== "keysDerived") {
    throw new Error("Failed to derive keys");
  }
  hdWallet.hdWallet.clear();
  return derivationResult.keys;
};

const formatBalance = (balance: bigint): string => balance.toLocaleString();

const DIV = "──────────────────────────────────────────────────────────────";

const printWalletSummary = (state: any, unshieldedKeystore: UnshieldedKeystore) => {
  const networkId = getNetworkId();
  const unshieldedBalance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  const coinPubKey = ShieldedCoinPublicKey.fromHexString(
    state.shielded.coinPublicKey.toHexString(),
  );
  const encPubKey = ShieldedEncryptionPublicKey.fromHexString(
    state.shielded.encryptionPublicKey.toHexString(),
  );
  const shieldedAddress = MidnightBech32m.encode(
    networkId,
    new ShieldedAddress(coinPubKey, encPubKey),
  ).toString();

  console.log(`
${DIV}
  Wallet Overview                            Network: ${networkId}
${DIV}
  Shielded (ZSwap)
  └─ Address: ${shieldedAddress}

  Unshielded
  ├─ Address: ${unshieldedKeystore.getBech32Address()}
  └─ Balance: ${formatBalance(unshieldedBalance)} tNight
${DIV}`);
};

const registerForDustGeneration = async (
  wallet: WalletFacade,
  unshieldedKeystore: UnshieldedKeystore,
): Promise<void> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  if (state.dust.availableCoins.length > 0 && state.dust.balance(new Date()) > 0n) {
    console.log(`  Dust already available (${formatBalance(state.dust.balance(new Date()))} DUST)`);
    return;
  }
  const nightUtxos = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length > 0) {
    console.log(`  Registering ${nightUtxos.length} NIGHT UTXO(s) for dust generation...`);
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      nightUtxos,
      unshieldedKeystore.getPublicKey(),
      (payload: Uint8Array) => unshieldedKeystore.signData(payload),
    );
    const finalized = await wallet.finalizeRecipe(recipe);
    await wallet.submitTransaction(finalized);
  }
  console.log("  Waiting for dust tokens to generate (this can take a few minutes)...");
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s) => s.isSynced),
      Rx.filter((s) => s.dust.balance(new Date()) > 0n),
    ),
  );
};

/**
 * Build (or restore) a wallet from a hex seed, wait for sync, and wait for
 * incoming tNight funds if the balance is currently zero.
 */
export const buildWalletAndWaitForFunds = async (
  config: Config,
  seed: string,
  ownerSecretKey: Uint8Array,
): Promise<WalletContext> => {
  const keys = deriveKeysFromSeed(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

  const walletConfig = {
    ...buildShieldedConfig(config),
    ...buildUnshieldedConfig(config),
    ...buildDustConfig(config),
  };
  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (cfg: any) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg: any) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg: any) =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  console.log(`
${DIV}
  Unshielded Address (send tNight here):
  ${unshieldedKeystore.getBech32Address()}
${
  config.faucet
    ? `
  Fund this wallet from the faucet:
  ${config.faucet}
`
    : ""
}${DIV}
`);

  console.log("  Syncing with network...");
  const syncedState = await waitForSync(wallet);
  printWalletSummary(syncedState, unshieldedKeystore);

  const balance = syncedState.unshielded.balances[unshieldedToken().raw] ?? 0n;
  if (balance === 0n) {
    console.log("  Waiting for incoming tNight...");
    const fundedBalance = await waitForFunds(wallet);
    console.log(`  Balance: ${formatBalance(fundedBalance)} tNight`);
  }

  await registerForDustGeneration(wallet, unshieldedKeystore);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, ownerSecretKey };
};

/** Create a fresh wallet + fresh contract-owner secret key. Both seeds are printed once. */
export const buildFreshWallet = async (config: Config): Promise<WalletContext> => {
  const seed = toHex(Buffer.from(generateRandomSeed()));
  const ownerSecretKey = crypto.getRandomValues(new Uint8Array(32));
  console.log(`
${DIV}
  New Wallet Seed — save this before continuing, it will not be shown again
${DIV}
  ${seed}
${DIV}
  Contract owner secret key (also save this — only you can reset milestones)
${DIV}
  ${toHex(Buffer.from(ownerSecretKey))}
${DIV}
`);
  return buildWalletAndWaitForFunds(config, seed, ownerSecretKey);
};

export const configureProviders = async (ctx: WalletContext, config: Config) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider<MilestoneCircuits>(
    contractConfig.zkConfigPath,
  );
  const accountId = walletAndMidnightProvider.getCoinPublicKey();
  const storagePassword = `${Buffer.from(accountId, "hex").toString("base64")}!`;
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: contractConfig.privateStateStoreName,
      accountId,
      privateStoragePasswordProvider: () => storagePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  } as unknown as MilestoneProviders;
};
