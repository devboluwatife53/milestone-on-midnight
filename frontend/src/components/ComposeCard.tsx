import { useState } from "react";

export const ComposeCard = ({
  busy,
  onSubmit,
}: {
  busy: string | null;
  onSubmit: (label: string) => Promise<void>;
}) => {
  const [label, setLabel] = useState("");

  const submit = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setLabel("");
  };

  return (
    <section className="compose">
      <span className="compose__pin" />
      <h2>Drop a milestone</h2>
      <textarea
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Ran my first 5k, shipped a side project, paid off a loan…"
        maxLength={280}
      />
      <div className="compose__row">
        <span className="compose__hint">
          {busy ?? "Pinned under a pseudonym — never your wallet address."}
        </span>
        <button onClick={submit} disabled={!!busy || !label.trim()}>
          Pin it
        </button>
      </div>
    </section>
  );
};
