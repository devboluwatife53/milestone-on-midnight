import { useState } from "react";
import { networkConfig } from "../midnight/config";
import type { LedgerState } from "../hooks/useMidnight";

export const ContractPanel = ({
  contractAddress,
  ledgerState,
  ownerSecretKeyHex,
  busy,
  onDeploy,
  onJoin,
}: {
  contractAddress?: string;
  ledgerState: LedgerState | null;
  ownerSecretKeyHex: string | null;
  busy: string | null;
  onDeploy: () => void;
  onJoin: (address: string) => void;
}) => {
  const [addressInput, setAddressInput] = useState(contractAddress ?? "");

  return (
    <section className="panel">
      <h2>Contract</h2>
      <div className="panel__row">
        <button onClick={onDeploy} disabled={!!busy}>
          Deploy new contract
        </button>
        <span className="panel__or">or</span>
        <input
          placeholder="Existing contract address"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
        <button onClick={() => onJoin(addressInput.trim())} disabled={!!busy || !addressInput.trim()}>
          Join
        </button>
      </div>

      {contractAddress && (
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
