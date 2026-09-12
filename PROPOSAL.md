# Milestone — Project Proposal

## 1. Product & Users

**What is Milestone?**
Milestone is a public forum (a "wall") where anyone can post a personal achievement — "ran my first 5k", "shipped a side project", "got a new car" — and others can reply with congratulations or their own spin. Every post and reply is written to the Midnight blockchain in real time.

**Target users**
- Early adopters and builders in the Midnight ecosystem who want a tangible, privacy-preserving demo they can interact with today.
- Developers learning Compact who need a minimal, auditable reference contract showing the public/private boundary, witness handling, and circuit structure.
- Anyone curious about how zero-knowledge identity (pseudonyms derived from a secret key that never leaves the device) works in practice.

**User journey**
1. Connect a wallet (Lace in the browser, or a seed/key pair via CLI).
2. The DApp derives your pseudonym locally: `publicKey(secretKey)` — a one-way hash the contract also computes inside the circuit.
3. Post a milestone (top-level) or reply to an existing one.
4. The transaction is proven client-side (browser) or via the local proof server (CLI) and submitted to Preview/Preprod.
5. The public wall updates instantly for everyone; your wallet address is never revealed, only the stable pseudonym.

---

## 2. Why Midnight?

**Core property demonstrated: private-by-default, disclose-only-what-you-choose**
- The caller's `secretKey` never touches the ledger. It lives exclusively in the caller's private state (IndexedDB in the browser, LevelDB in the CLI) and is supplied to circuits via a `witness`.
- The only value disclosed to the public ledger is the pseudonym: `publicKey(localSecretKey())` — a deterministic, one-way hash.
- The compiler enforces this boundary: any attempt to write a witness-derived value to the ledger without `disclose()` is a **compile-time error**.

**No trusted setup per user, no accumulators, no thresholds**
- Every post/reply is an independent transaction. There is no batching, no Merkle tree of users, no "wait until N people join" — the privacy guarantee holds for a single user from day one.

**Proof delegation to the wallet (browser)**
- The frontend uses `@midnight-ntwrk/dapp-connector-api` and delegates proving to Lace itself (`dappConnectorProofProvider`). No local proof server is required for end users. This is the intended Mainnet UX.

**Compact language fit**
- The contract is ~60 lines of Compact. The public/private split, witness declaration, `disclose()`, and exported pure circuit (`publicKey`) map directly to the language's primitives — making it a clean teaching example.

---

## 3. Public vs. Private Data Model

| Layer | What lives here | Example |
|-------|----------------|---------|
| **Public ledger state** (`export ledger`) | `feed: List<MilestonePost>`, `postCount: Counter` | Every post/reply: `id`, `parentId` (0 = root), `author` (32-byte pseudonym), `label` (text) |
| **Private witness state** (`witness`) | `localSecretKey(): Bytes<32>` | The caller's secret key — never written to chain, never sent over the network |
| **Circuits** | `post(label)`, `reply(parentId, label)`, `publicKey(sk)` | Derive pseudonym inside the circuit, `disclose()` it + the label, append to `feed` |
| **Exported pure circuit** | `publicKey(sk: Bytes<32>): Bytes<32>` | Anyone can recompute a pseudonym from a self-disclosed secret key and verify it matches the on-chain `author` — but cannot reverse it |

**Key invariants enforced by the compiler**
- `secretKey` never appears in `feed`.
- `author` on the ledger is always `disclose(publicKey(localSecretKey()))`.
- The same `secretKey` always produces the same `author`; different keys produce unlinkable pseudonyms.

---

## 4. Mainnet Feasibility

**What works today on Preview/Preprod**
- Contract compiles with Compact `0.31.1` and `@midnight-ntwrk/compact-runtime` pinned to the same version.
- CLI deploys, posts, and replies against Preview and Preprod (requires local proof server on :6300).
- Frontend DApp runs at `milestone-on-midnight.vercel.app`, connects to Lace, proves client-side, and reads the live Preview contract (`ca04bbcc20cd41eeb7c791ecc9c74b817af3663df64f11abbfa838167e7ad05a`).
- 8/8 contract tests pass against the in-memory simulator (no network needed).

**Gaps to close for Mainnet**
| Area | Status | Work needed |
|------|--------|-------------|
| **Audit** | Not started | Formal audit of the Compact contract, witness handling, and ZK circuit artifacts. |
| **Key management UX** | Manual (env vars / IndexedDB) | Seed phrase import/export, hardware wallet support, key rotation/revocation flow. |
| **Proof server** | Local Docker only (CLI) | Browser path already delegates to Lace; CLI would need a hosted/managed proof server for non-technical users. |
| **Indexer / explorer integration** | Manual `status:preview` script | Production-grade indexer with GraphQL/REST for the frontend wall feed. |
| **Gas / fee estimation** | Not exposed | Surface fee estimates in the UI before signing. |
| **Upgradeability** | None (immutable contract) | Decide if/when a v2 is needed; design migration path for existing pseudonyms. |
| **Network stability** | Preview/Preprod only | Validate on Mainnet once Midnight Mainnet launches; testnet incentives may be needed to seed the wall. |

**Realistic timeline**
- **MVP on Mainnet (read-only wall + wallet connect)**: 2–4 weeks after Mainnet launch, assuming Lace Mainnet support and a hosted indexer.
- **Full write-path (post/reply from browser)**: Same window — the frontend already proves client-side; only network config and fee UX need wiring.
- **CLI parity**: Requires a managed proof server or proof delegation to a remote prover; ~4–6 weeks.

**Conclusion**
Milestone is a **minimal, complete vertical slice** of a Midnight DApp: contract → proof → indexer → wallet → UI. It demonstrates the privacy model end-to-end and is ready for Mainnet deployment modulo operational hardening (audit, hosted prover, indexer, fee UX). The contract itself is immutable and audit-friendly by design.