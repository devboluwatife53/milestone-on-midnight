# Milestone — a private-contribution counter on Midnight

## Product idea

Milestone is a minimal privacy-preserving fundraising/progress tracker built
with Compact. Contributors submit amounts privately — no one, not even the
chain, ever sees an individual contribution — but the *moment* the running
total crosses a milestone (every 100 units), that cumulative total is
deliberately disclosed on-chain and the public milestone counter ticks up.
It's a small, concrete illustration of the core Midnight pattern: keep
sensitive inputs private by default, and only reveal exactly the aggregate
fact the application actually needs the world to see — nothing more.

## Public state vs. private witness

Compact splits contract data into two worlds that never mix unless you say
so explicitly:

- **Public ledger state** (`contract/src/milestone.compact`): `owner`,
  `milestonesReached`, and `lastDisclosedTotal` are declared with `export
  ledger`. These are readable by anyone querying the chain — that's the
  entire point of putting them there.
- **Private witness state**: the caller's `secretKey` and their running
  `hiddenTotal` never appear in the ledger. They live only in the caller's
  local private state (see `contract/src/witnesses.ts`), and are supplied to
  circuits via `witness` declarations (`localSecretKey`, `addToHiddenTotal`).
  The compiler enforces this — any attempt to write a witness-derived value
  to the ledger without wrapping it in `disclose()` is a **compile error**.

The `contribute` circuit shows the boundary in action: it computes
`newTotal` from a private witness, but only calls `disclose(newTotal)` (and
increments the public counter) once that total crosses the next milestone
threshold. Every contribution below the threshold leaves zero trace on
chain — not the amount, not even the fact that a contribution happened.
`resetMilestones` shows the same pattern for authorization: the owner proves
they know the secret key behind `owner` without ever revealing that key.

## Repo layout

```
contract/          Compact contract, generated managed/ output, tests
  src/milestone.compact
  src/witnesses.ts       private-state shape + witness implementations
  src/managed/milestone/ generated circuits, zkir, and prover/verifier keys
  src/test/               vitest suite against a local simulator
cli/                Preview-network deployment tooling
  src/deploy-preview.ts   build/fund a wallet, deploy, print contract address
  src/join-preview.ts     read back public state of a deployed contract
  proof-server.yml        docker compose for the local proof server
screenshots/        compile + deploy output
```

## Setup — run it locally

Prerequisites: macOS/Linux, [Docker](https://www.docker.com/), Node.js 22.

1. **Install the Compact toolchain** (compiler + CLI):
   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf https://raw.githubusercontent.com/midnightntwrk/compact/main/install.sh | sh
   compact update            # fetches the latest compactc release
   compact --version
   ```
2. **Use Node 22**:
   ```bash
   nvm install 22 && nvm use 22
   ```
3. **Install dependencies** (npm workspaces cover `contract/` and `cli/`):
   ```bash
   npm install
   ```
4. **Compile the contract** — regenerates `contract/src/managed/milestone/`
   (circuits, zkir, prover/verifier keys):
   ```bash
   cd contract && npm run compact
   ```
5. **Run the test suite** (contract logic against an in-memory simulator,
   no network needed):
   ```bash
   npm test
   ```
6. **Start the local proof server** (needed for any real deploy):
   ```bash
   cd ../cli && npm run proof-server   # docker compose, listens on :6300
   ```
7. **Deploy to Preview**, in a second terminal:
   ```bash
   npm run deploy:preview
   ```
   With no `WALLET_SEED` set, this generates a fresh wallet and contract
   owner key, prints the wallet's unshielded address, and waits for you to
   fund it from the [Preview faucet](https://faucet.preview.midnight.network/)
   before deploying. **Save the printed seed and owner secret key** — the
   owner key is required to later call `resetMilestones`. To reuse an
   existing wallet on a later run:
   ```bash
   WALLET_SEED=<hex seed> OWNER_SECRET_KEY=<hex key> npm run deploy:preview
   ```
8. **Check a deployed contract's public state** at any time:
   ```bash
   CONTRACT_ADDRESS=<address> npm run status:preview
   ```

## Deployed contract

- Network: **Preview**
- Contract address: `4bf6030d9e9bbf98ede5570fa18507216cb66c06c944857bcb63ec68a79555fd`
- Verify independently at any time (no wallet needed, reads the indexer directly):
  ```bash
  CONTRACT_ADDRESS=4bf6030d9e9bbf98ede5570fa18507216cb66c06c944857bcb63ec68a79555fd npm run status:preview
  ```

## Screenshots

- `screenshots/compile.png` — `compact compile` output listing the compiled
  circuits and the generated `managed/` tree (zkir + prover/verifier keys).
- `screenshots/deploy.png` — `npm run deploy:preview` output showing the
  wallet funding step and the resulting on-chain contract address.
