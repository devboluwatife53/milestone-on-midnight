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
  <header className="nameplate">
    <div className="nameplate__title">
      <h1>Milestone</h1>
      <span className="nameplate__network">{networkConfig.networkId}</span>
    </div>
    <div className="nameplate__actions">
      {isConnected && wallet ? (
        <>
          <span className="nameplate__address" title={wallet.unshieldedAddress}>
            {wallet.walletName}: {shorten(wallet.unshieldedAddress)}
          </span>
          <button onClick={onDisconnect} disabled={!!busy}>
            Disconnect
          </button>
        </>
      ) : (
        <button onClick={onConnect} disabled={!!busy}>
          {busy ?? "Connect Wallet"}
        </button>
      )}
    </div>
  </header>
);
