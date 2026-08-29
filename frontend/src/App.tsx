import { useMidnight } from "./hooks/useMidnight";
import { WalletBar } from "./components/WalletBar";
import { MilestoneFeed } from "./components/MilestoneFeed";
import { CelebrateForm } from "./components/CelebrateForm";
import "./App.css";

export const App = () => {
  const m = useMidnight();

  return (
    <div className="app">
      <WalletBar
        isConnected={m.isConnected}
        wallet={m.wallet}
        busy={m.busy}
        onConnect={m.connect}
        onDisconnect={m.disconnect}
      />

      <main>
        {m.error && <p className="error">{m.error}</p>}

        {!m.isConnected ? (
          <p className="panel__hint">
            Connect Lace to celebrate a milestone — your private progress stays yours.
          </p>
        ) : (
          <>
            <MilestoneFeed ledgerState={m.ledgerState} />

            {m.hasContract && (
              <CelebrateForm
                busy={m.busy}
                lastTx={m.lastTx}
                ledgerState={m.ledgerState}
                onCelebrate={m.celebrate}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
