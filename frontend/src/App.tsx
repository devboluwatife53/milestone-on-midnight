import { useMidnight } from "./hooks/useMidnight";
import { WalletBar } from "./components/WalletBar";
import { PseudonymStrip } from "./components/PseudonymStrip";
import { MilestoneFeed } from "./components/MilestoneFeed";
import { ComposeCard } from "./components/ComposeCard";
import "./App.css";

export const App = () => {
  const m = useMidnight();

  return (
    <div className="board">
      <WalletBar
        isConnected={m.isConnected}
        wallet={m.wallet}
        busy={m.busy}
        onConnect={m.connect}
        onDisconnect={m.disconnect}
      />

      {m.error && <p className="error-strip">{m.error}</p>}

      {!m.isConnected ? (
        <p className="intro">
          Connect Lace and drop a milestone — everyone posts under a pin,
          never their wallet address.
        </p>
      ) : (
        <>
          {m.pseudonym && m.wallet && (
            <PseudonymStrip pseudonym={m.pseudonym} walletAddress={m.wallet.unshieldedAddress} />
          )}

          {m.hasContract && <ComposeCard busy={m.busy} onSubmit={m.post} />}

          <MilestoneFeed ledgerState={m.ledgerState} busy={m.busy} onReply={m.reply} />
        </>
      )}
    </div>
  );
};
