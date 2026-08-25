import { useMidnight } from "./hooks/useMidnight";
import { WalletBar } from "./components/WalletBar";
import { MilestoneProgress } from "./components/MilestoneProgress";
import { ContributeForm } from "./components/ContributeForm";
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
          <p className="panel__hint">Connect Lace to contribute — your amount stays private.</p>
        ) : (
          <>
            <MilestoneProgress ledgerState={m.ledgerState} />

            {m.hasContract && (
              <>
                <ContributeForm
                  busy={m.busy}
                  lastTx={m.lastTx}
                  ledgerState={m.ledgerState}
                  onContribute={m.contribute}
                />
                <section className="panel">
                  <h2>Owner action</h2>
                  <button onClick={m.resetMilestones} disabled={!!m.busy}>
                    Reset milestones
                  </button>
                  <p className="panel__hint">
                    Only succeeds if this session holds the owner's secret key — proven in zero
                    knowledge, without revealing the key itself.
                  </p>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
