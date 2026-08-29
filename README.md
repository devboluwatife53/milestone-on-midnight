# Milestone — a public forum for celebrating private milestones on Midnight

## Product idea

Milestone is a public celebration wall built with Compact. Anyone can
connect a wallet and log private progress toward a personal goal — money
saved, distance run, whatever they're privately tracking. The amount itself
is never written to the ledger. The moment their private running total
crosses the next milestone (every 100 units), a post is disclosed to a
shared public feed: the achievement they chose to share ("got a new car")
and the tier they reached — never the number behind it. It's a small,
concrete illustration of the core Midnight pattern: keep sensitive inputs
private by default, and only reveal exactly the fact the application
actually needs the world to see — nothing more.

## Deployed contract

- Network: **Preprod** — TODO: fill in the address here after running `npm run deploy:preprod`
- Verify independently at any time (no wallet needed, reads the indexer directly):
  ```bash
  CONTRACT_ADDRESS=<address> npm run status:preprod
  ```

A deployment also exists on **Preview**:

- Contract address: [`b02281de539e831c9632e406c40b0516ac3a5599b0610a186da119cd5340d57e`](https://preview.midnightexplorer.com/contracts/b02281de539e831c9632e406c40b0516ac3a5599b0610a186da119cd5340d57e) — view live on Midnight Explorer
  ```bash
  CONTRACT_ADDRESS=b02281de539e831c9632e406c40b0516ac3a5599b0610a186da119cd5340d57e npm run status:preview
  ```

## Live demo

`TODO: link once deployed to Vercel/Netlify — see frontend/ for the build to deploy.`

## Demo video

`TODO: link a short recording of wallet connect + a successful celebrate() call landing on the wall.`

## Submission checklist

- [x] Midnight.js SDK + DApp Connector API — `frontend/src/midnight/`
- [x] Lace connect / disconnect — `frontend/src/midnight/dappConnector.ts`,
      wired into the UI via `WalletBar`
- [x] Circuit called from the frontend, result handled — `celebrate()` in
      `frontend/src/midnight/contract.ts`, called from `CelebrateForm`
- [x] Observable privacy behavior — see "Observable privacy behavior" below
- [x] Local private state managed client-side — IndexedDB via
      `levelPrivateStateProvider`, see "Frontend" section below
- [ ] Contract deployed to Preprod with a verifiable address — see
      "Deployed contract" above (TODO once `npm run deploy:preprod` is run)
- [ ] Live demo link (Vercel/Netlify) — see "Live demo" above
- [ ] Demo video (wallet connect + successful circuit call) — see "Demo
      video" above
- [x] Minimum 8 meaningful commits — `git log`

## Public state vs. private witness

Compact splits contract data into two worlds that never mix unless you say
so explicitly:

- **Public ledger state** (`contract/src/milestone.compact`): `feed` (the
  public wall, a `List<MilestonePost>`) and `totalCelebrated` are declared
  with `export ledger`. These are readable by anyone querying the chain —
  that's the entire point of putting them there.
- **Private witness state**: the caller's `secretKey`, their running
  `hiddenProgress`, and how many personal tiers they've already crossed
  never appear in the ledger. They live only in the caller's local private
  state (see `contract/src/witnesses.ts`), and are supplied to circuits via
  `witness` declarations (`localSecretKey`, `addToHiddenProgress`,
  `currentTier`, `advanceTier`). The compiler enforces this — any attempt
  to write a witness-derived value to the ledger without wrapping it in
  `disclose()` is a **compile error**.

The `celebrate` circuit shows the boundary in action: it computes a new
private total from a witness, but only pushes a post to the public `feed`
(and increments `totalCelebrated`) once that total crosses the caller's
next personal milestone threshold. Every call below the threshold leaves
zero trace on chain — not the amount, not the achievement text, not even
the fact that a call happened at all (beyond the transaction itself being
submitted). The author on a disclosed post is a hash derived from the
caller's own secret key via `publicKey()` — pseudonymous, provable, never
tied to a real identity.

## Repo layout

```
contract/          Compact contract, generated managed/ output, tests
  src/milestone.compact
  src/witnesses.ts       private-state shape + witness implementations
  src/managed/milestone/ generated circuits, zkir, and prover/verifier keys
  src/test/               vitest suite against a local simulator
cli/                Node-based deployment tooling (Preview + Preprod)
  src/deploy-{preview,preprod}.ts     build/fund a wallet, deploy, print address
  src/celebrate-{preview,preprod}.ts  call celebrate() from the CLI
  src/join-{preview,preprod}.ts       read back the public feed, no wallet needed
  proof-server.yml       docker compose for the local proof server
frontend/           Browser DApp — Lace wallet connect + circuit calls
  src/midnight/       DApp Connector ↔ midnight-js bridge (see below)
  src/hooks/useMidnight.ts  connect/disconnect/join/celebrate state
  src/components/     wallet bar, milestone feed (the wall), celebrate form
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
3. **Install dependencies** (npm workspaces cover `contract/`, `cli/`, and `frontend/`):
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
6. **Start the local proof server** (needed for CLI deploys — the frontend
   instead delegates proving to Lace itself, no local server required):
   ```bash
   cd ../cli && npm run proof-server   # docker compose, listens on :6300
   ```
7. **Deploy**, in a second terminal — `preview` or `preprod`:
   ```bash
   npm run deploy:preview   # or: npm run deploy:preprod
   ```
   With no `WALLET_SEED` set, this generates a fresh wallet and a fresh
   identity key, prints the wallet's unshielded address, and waits for you
   to fund it from the network's faucet
   ([Preview](https://faucet.preview.midnight.network/) /
   [Preprod](https://faucet.preprod.midnight.network/)) before deploying.
   **Save the printed seed and identity secret key** — reuse the identity
   key to keep posting under the same pseudonymous author on the public
   feed. To reuse an existing wallet on a later run:
   ```bash
   WALLET_SEED=<hex seed> IDENTITY_SECRET_KEY=<hex key> npm run deploy:preprod
   ```
8. **Log a milestone from the CLI** against an already-deployed contract:
   ```bash
   CONTRACT_ADDRESS=<address> WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
     AMOUNT=150 LABEL="got a new car" npm run celebrate:preprod
   ```
9. **Check a deployed contract's public feed** at any time:
   ```bash
   CONTRACT_ADDRESS=<address> npm run status:preview
   ```

## Frontend — Lace wallet DApp

`frontend/` is a Vite + React app that connects to Lace via the [DApp
Connector API](https://docs.midnight.network/api-reference/dapp-connector)
(`@midnight-ntwrk/dapp-connector-api`) and calls the same contract as the
CLI, from the browser. It always talks to one fixed, universally-known
deployed contract (`VITE_CONTRACT_ADDRESS`) — there's no manual deploy/join
UI — so connecting a wallet loads that contract's public feed automatically.

```bash
cd frontend
npm run dev            # http://localhost:5173
```

By default it targets **Preprod** (`VITE_NETWORK=preprod`); set
`frontend/.env.local` to `VITE_NETWORK=preview` to point it at Preview
instead (see `.env.example`). `predev`/`prebuild` build the `contract`
workspace and copy its compiled circuit artifacts from
`contract/src/managed/milestone` into `public/managed/milestone` so the
browser can fetch them over HTTP.

**How it's wired** (`frontend/src/midnight/`):

- `dappConnector.ts` — connect/disconnect. Wallets inject themselves at
  `window.midnight.{uuid}`; we enumerate rather than hardcode a name, call
  `wallet.connect(networkId)`, and read back the connected addresses. The
  connector API has no `disconnect()` — the wallet owns the authorization
  grant, so "disconnect" on the DApp side just drops our reference to the
  connected session.
- `providers.ts` — adapts the connector's `ConnectedAPI` into midnight-js's
  `WalletProvider`/`MidnightProvider` (serializing transactions to hex
  across that boundary), delegates **proving to the wallet itself**
  (`dappConnectorProofProvider`, no local proof server needed in the
  browser), fetches ZK artifacts over HTTP (`FetchZkConfigProvider`), and
  manages **local private state** in IndexedDB (`levelPrivateStateProvider`,
  scoped per connected wallet account).
- `contract.ts` — deploy / join / `celebrate`, mirroring `cli/src/api.ts`
  but running entirely client-side.

**Observable privacy behavior**: the celebrate form calls `celebrate()` for
real every time — a proven, submitted transaction — but diffs
`totalCelebrated` before and after. Submit progress that doesn't cross a
milestone and the feed is provably unchanged: not hidden by the UI, but
because the chain itself never received the number or the label. Submit
progress that crosses a threshold and your achievement appears at the top
of the wall — but never the private amount you typed to get there.

## Screenshots

**`compact compile` + test output** — compiled circuits and the generated `managed/` tree (zkir + prover/verifier keys):

![compact compile output](screenshots/compile.png)

**`npm run deploy:preview` output** — wallet funding and the resulting on-chain contract address:

![deploy to Preview output](screenshots/deploy.png)
