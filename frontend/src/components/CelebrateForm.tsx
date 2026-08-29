import { useState } from "react";
import type { LedgerState } from "../hooks/useMidnight";

/**
 * This is the "observable privacy behavior" the assignment asks for: the
 * celebrate() circuit runs and submits a real, proven transaction every
 * time, but your private amount only ever shows up in the public feed when
 * it pushes your hidden running progress across your next personal
 * milestone. Below that, the feed is provably unchanged — not hidden by
 * the UI, but because the chain itself never received the number, and your
 * achievement text never posted either.
 */
export const CelebrateForm = ({
  busy,
  lastTx,
  ledgerState,
  onCelebrate,
}: {
  busy: string | null;
  lastTx: { txId: string; blockHeight?: number } | null;
  ledgerState: LedgerState | null;
  onCelebrate: (amount: bigint, label: string) => Promise<LedgerState | null | undefined>;
}) => {
  const [amount, setAmount] = useState("10");
  const [label, setLabel] = useState("");
  const [diff, setDiff] = useState<{
    before: LedgerState;
    submittedAmount: bigint;
    submittedLabel: string;
  } | null>(null);

  const submit = async () => {
    let value: bigint;
    try {
      value = BigInt(amount || "0");
    } catch {
      return;
    }
    if (value <= 0n || !label.trim()) return;
    const before = await onCelebrate(value, label.trim());
    if (before) {
      setDiff({ before, submittedAmount: value, submittedLabel: label.trim() });
      setLabel("");
    }
  };

  const posted = diff && ledgerState && ledgerState.totalCelebrated > diff.before.totalCelebrated;

  return (
    <section className="panel">
      <h2>Log progress toward a milestone</h2>
      <p className="panel__hint">
        The amount below is a private circuit argument — it never touches the ledger. Your label
        (e.g. "got a new car") only posts to the public feed once your private running total
        crosses the next multiple of 100.
      </p>
      <div className="panel__row">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="private amount"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. got a new car"
        />
        <button onClick={submit} disabled={!!busy}>
          Log progress
        </button>
      </div>

      {busy && <p className="panel__hint">{busy}</p>}

      {lastTx && (
        <p className="panel__hint">
          Last transaction: <code>{lastTx.txId}</code>
          {lastTx.blockHeight != null && ` (block ${lastTx.blockHeight})`}
        </p>
      )}

      {diff && (
        <p className={`panel__hint ${posted ? "panel__hint--disclosed" : "panel__hint--private"}`}>
          Submitted a proven <code>celebrate({diff.submittedAmount.toString()}, "
          {diff.submittedLabel}")</code> transaction.{" "}
          {posted ? (
            <>
              This crossed a milestone: "{diff.submittedLabel}" was just posted to the public
              feed — but not the private amount that got you there.
            </>
          ) : (
            <>
              The feed is unchanged — that {diff.submittedAmount.toString()}-unit contribution
              left zero trace on chain beyond "some valid call happened".
            </>
          )}
        </p>
      )}
    </section>
  );
};
