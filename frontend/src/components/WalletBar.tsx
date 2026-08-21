import { networkConfig } from "../midnight/config";
import type { WalletInfo } from "../hooks/useMidnight";

const shorten = (addr: string) =>
  addr.length > 20 ? `${addr.slice(0, 12)}…${addr.slice(-6)}` : addr;

export const WalletBar = ({
  isConnected,
  wallet,
  busy,
  onConnect,
  onDisconnect,
}: {
  isConnected: boolean;
  wallet: WalletInfo | null;
  busy: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) => (
  <header className="wallet-bar">
    <div className="wallet-bar__title">
      <strong>Milestone</strong>
      <span className="wallet-bar__network">{networkConfig.networkId}</span>
    </div>
    <div className="wallet-bar__actions">
      {isConnected && wallet ? (
        <>
          <span className="wallet-bar__address" title={wallet.unshieldedAddress}>
            {wallet.walletName}: {shorten(wallet.unshieldedAddress)}
          </span>
          <button onClick={onDisconnect} disabled={!!busy}>
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={onConnect} disabled={!!busy}>
          {busy ?? "Connect Lace"}
        </button>
      )}
    </div>
  </header>
);
