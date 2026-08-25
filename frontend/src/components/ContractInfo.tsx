import { networkConfig } from "../midnight/config";
import type { LedgerState } from "../hooks/useMidnight";

export const ContractInfo = ({
  contractAddress,
  ledgerState,
  ownerSecretKeyHex,
}: {
  contractAddress?: string;
  ledgerState: LedgerState | null;
  ownerSecretKeyHex: string | null;
}) => {
  return (
    <section className="panel">
      <h2>Contract</h2>

      {contractAddress ? (
        <p className="panel__address">
          Address:{" "}
          <a
            href={`${networkConfig.explorer}/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            {contractAddress}
          </a>
        </p>
      ) : (
        <p className="panel__hint">Loading contract...</p>
      )}

      {ownerSecretKeyHex && (
        <p className="panel__warning">
          Owner secret key (save this — it's needed for resetMilestones, and is never sent
          anywhere): <code>{ownerSecretKeyHex}</code>
        </p>
      )}

      {ledgerState && (
        <table className="ledger-table">
          <tbody>
            <tr>
              <td>owner (public key)</td>
              <td>{ledgerState.owner}</td>
            </tr>
            <tr>
              <td>milestonesReached</td>
              <td>{ledgerState.milestonesReached.toString()}</td>
            </tr>
            <tr>
              <td>lastDisclosedTotal</td>
              <td>{ledgerState.lastDisclosedTotal.toString()}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
};
