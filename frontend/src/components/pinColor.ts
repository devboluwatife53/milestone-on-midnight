const PIN_COLORS = ["#c1502e", "#2f6f65", "#b9861f", "#6a4a6e"];
const ROTATIONS = ["note--rot-0", "note--rot-1", "note--rot-2", "note--rot-3"];

const hashToIndex = (hex: string, modulus: number): number => {
  let sum = 0;
  for (const char of hex) sum += char.charCodeAt(0);
  return sum % modulus;
};

/** Deterministic pin color per pseudonymous author — same hash, same color. */
export const pinColorFor = (authorHex: string): string =>
  PIN_COLORS[hashToIndex(authorHex, PIN_COLORS.length)];

/** Deterministic slight rotation per post id, so the wall reads as pinned notes, not a grid. */
export const rotationClassFor = (id: bigint): string =>
  ROTATIONS[Number(id % BigInt(ROTATIONS.length))];

export const shortHash = (hex: string): string => `${hex.slice(0, 8)}…${hex.slice(-4)}`;
