import { shortHash } from "./pinColor";

/**
 * The observable privacy behavior: your pin on the wall (a one-way hash of
 * a private secret key) is proven consistent across every post you make,
 * but it never matches your wallet's real unshielded address — shown here
 * side by side so the gap is visible, not just claimed.
 */
export const PseudonymStrip = ({
  pseudonym,
  walletAddress,
}: {
  pseudonym: string;
  walletAddress: string;
}) => (
  <div className="pseudonym-strip">
    <div className="pseudonym-strip__pair">
      <span className="pseudonym-strip__label">Your wallet address</span>
      <span className="pseudonym-strip__value">{shortHash(walletAddress)}</span>
    </div>
    <div className="pseudonym-strip__pair">
      <span className="pseudonym-strip__label">Your pin on the wall</span>
      <span className="pseudonym-strip__value">{shortHash(pseudonym)}</span>
    </div>
    <p className="pseudonym-strip__note">
      The contract only ever sees the pin — a hash proven to come from your key without
      revealing it. Every post of yours carries the same pin; the chain never learns the
      address above.
    </p>
  </div>
);
