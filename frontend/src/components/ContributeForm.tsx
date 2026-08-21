import { useState } from "react";
import type { LedgerState } from "../hooks/useMidnight";

/**
 * This is the "observable privacy behavior" the assignment asks for: the
 * contribute() circuit runs and submits a real, proven transaction every
 * time, but the amount only ever shows up in the public ledger diff when it
 * pushes the hidden running total across a milestone boundary. Below that,
 * the disclosed fields are provably unchanged — not hidden by the UI, but
 * because the chain itself never received the number.
 */
export const ContributeForm = ({
  busy,
  lastTx,
  ledgerState,
  onContribute,
}: {
  busy: string | null;
  lastTx: { txId: string; blockHeight?: number } | null;
  ledgerState: LedgerState | null;
  onContribute: (amount: bigint) => Promise<LedgerState | null | undefined>;
}) => {
  const [amount, setAmount] = useState("10");
  const [diff, setDiff] = useState<{ before: LedgerState; submittedAmount: bigint } | null>(
    null,
  );

  const submit = async () => {
    const value = BigInt(amount || "0");
    const before = await onContribute(value);
    if (before) {
      setDiff({ before, submittedAmount: value });
    }
  };

  return (
    <section className="panel">
      <h2>Contribute (private amount)</h2>
      <p className="panel__hint">
        The amount below is a private circuit argument. It is never written to the ledger —
        only the cumulative total is disclosed, and only once it crosses the next multiple of
        100.
      </p>
      <div className="panel__row">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={submit} disabled={!!busy}>
          Contribute
        </button>
      </div>

      {busy && <p className="panel__hint">{busy}</p>}

      {lastTx && (
        <p className="panel__hint">
          Last transaction: <code>{lastTx.txId}</code>
          {lastTx.blockHeight != null && ` (block ${lastTx.blockHeight})`}
        </p>
      )}

      {diff && ledgerState && (
        <p className={`panel__hint ${diff.before.lastDisclosedTotal === ledgerState.lastDisclosedTotal ? "panel__hint--private" : "panel__hint--disclosed"}`}>
          Submitted a proven <code>contribute({diff.submittedAmount.toString()})</code>{" "}
          transaction.{" "}
          {diff.before.lastDisclosedTotal === ledgerState.lastDisclosedTotal ? (
            <>
              <code>lastDisclosedTotal</code> is still {ledgerState.lastDisclosedTotal.toString()}
              , unchanged — that {diff.submittedAmount.toString()}-unit contribution left zero
              trace on chain beyond "some valid contribution happened".
            </>
          ) : (
            <>
              This contribution crossed a milestone: <code>lastDisclosedTotal</code> went from{" "}
              {diff.before.lastDisclosedTotal.toString()} to{" "}
              {ledgerState.lastDisclosedTotal.toString()} — but that revealed total, not the
              individual amount you just submitted.
            </>
          )}
        </p>
      )}
    </section>
  );
};
