import { useState } from "react";

const shorten = (addr: string) =>
  addr.length > 20 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : addr;

export const MilestoneSwitcher = ({
  contractAddress,
  ownerSecretKeyHex,
  busy,
  onCreate,
  onLoad,
}: {
  contractAddress?: string;
  ownerSecretKeyHex: string | null;
  busy: string | null;
  onCreate: () => void;
  onLoad: (address: string) => void;
}) => {
  const [addressInput, setAddressInput] = useState("");
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!contractAddress) return;
    await navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="panel">
      <h2>Your milestone</h2>

      {contractAddress && (
        <p className="panel__hint">
          Viewing <code>{shorten(contractAddress)}</code>{" "}
          <button className="link-button" onClick={copyAddress}>
            {copied ? "copied!" : "copy address"}
          </button>
        </p>
      )}

      <div className="panel__row">
        <button onClick={onCreate} disabled={!!busy}>
          Create your own milestone
        </button>
        <span className="panel__or">or view one by address</span>
        <input
          placeholder="Paste a milestone address"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
        <button
          onClick={() => onLoad(addressInput.trim())}
          disabled={!!busy || !addressInput.trim()}
        >
          View
        </button>
      </div>

      {ownerSecretKeyHex && (
        <p className="panel__warning">
          You created this one — save your owner key (needed to reset it later, never sent
          anywhere): <code>{ownerSecretKeyHex}</code>
        </p>
      )}
    </section>
  );
};
