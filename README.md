# Milestone — a public wall for celebrating wins on Midnight

## Product idea

Milestone is a public forum built with Compact: connect a wallet, drop a
milestone you're celebrating — "ran my first 5k", "shipped a side
project" — and it's pinned to a shared wall for everyone to see. Anyone
else can reply to congratulate you or share their own spin, threaded
under your post. Every post and reply lands on chain in real time; there's
no hidden accumulator, no threshold to cross.

Where Midnight comes in: the wall never learns *who* you are. Each post is
authored under a pseudonym — a one-way hash of a private key that never
leaves your device — so the contract can prove every post came from a
real, consistent author without ever disclosing a wallet address, a name,
or a way to link two different pseudonyms to the same person. It's a
small, concrete illustration of the core Midnight pattern: keep sensitive
inputs private by default, and only reveal exactly the fact the
application actually needs the world to see — nothing more.

## Deployed contract

- Network: **Preview**
- Contract address: `PLACEHOLDER_CONTRACT_ADDRESS` — view live on [Midnight Explorer](https://preview.midnightexplorer.com/contracts/PLACEHOLDER_CONTRACT_ADDRESS)
- Verify independently at any time (no wallet needed, reads the indexer directly):
  ```bash
  CONTRACT_ADDRESS=PLACEHOLDER_CONTRACT_ADDRESS npm run status:preview
  ```

## Live demo

**[milestone-on-midnight.vercel.app](https://milestone-on-midnight.vercel.app)** — connect Lace (Preview network), drop a milestone, and reply to someone else's.

## Demo video

`TODO: link a short recording of wallet connect + a successful post() call landing on the wall.`

## Public state vs. private witness

Compact splits contract data into two worlds that never mix unless you say
so explicitly:

- **Public ledger state** (`contract/src/milestone.compact`): `feed` (the
  public wall, a `List<MilestonePost>`) and `postCount` are declared with
  `export ledger`. These are readable by anyone querying the chain —
  that's the entire point of putting them there. Each `MilestonePost` on
  the ledger carries an `id`, a `parentId` (`0` for a top-level post,
  otherwise the id it's replying to), a pseudonymous `author`, and the
  `label` text.
- **Private witness state**: the caller's `secretKey` never appears in the
  ledger. It lives only in the caller's local private state (see
  `contract/src/witnesses.ts`) and is supplied to circuits via a single
  `witness` declaration (`localSecretKey`). The compiler enforces the
  boundary — any attempt to write a witness-derived value to the ledger
  without wrapping it in `disclose()` is a **compile error**.

The `post`/`reply` circuits show the boundary in action: both derive the
caller's `author` pseudonym from their private secret key
(`publicKey(localSecretKey())`) and disclose *that hash* to the ledger —
never the key itself. The chain can verify every post came from someone
holding a valid key, and that the same key always produces the same
pseudonym, without ever learning what that key is or which wallet address
it belongs to.

## Repo layout

```
contract/          Compact contract, generated managed/ output, tests
  src/milestone.compact
  src/witnesses.ts       private-state shape + witness implementation
  src/managed/milestone/ generated circuits, zkir, and prover/verifier keys
  src/test/               vitest suite against a local simulator
cli/                Node-based deployment tooling (Preview + Preprod)
  src/deploy-{preview,preprod}.ts   build/fund a wallet, deploy, print address
  src/post-{preview,preprod}.ts    call post() from the CLI
  src/reply-{preview,preprod}.ts   call reply() from the CLI
  src/join-{preview,preprod}.ts    read back the public wall, no wallet needed
  proof-server.yml       docker compose for the local proof server
frontend/           Browser DApp — Lace wallet connect + circuit calls
  src/midnight/       DApp Connector ↔ midnight-js bridge (see below)
  src/hooks/useMidnight.ts  connect/disconnect/join/post/reply state
  src/components/     nameplate (wallet bar), pseudonym strip, compose card,
                      threaded wall
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
   This project's `contract/` compiles with `compact 0.31.1` specifically
   (pinned in `contract/package.json`'s `compact` script) to match its
   pinned `@midnight-ntwrk/compact-runtime` dependency.
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
   key to keep posting under the same pseudonym on the public wall. To
   reuse an existing wallet on a later run:
   ```bash
   WALLET_SEED=<hex seed> IDENTITY_SECRET_KEY=<hex key> npm run deploy:preprod
   ```
8. **Drop a milestone from the CLI** against an already-deployed contract:
   ```bash
   CONTRACT_ADDRESS=<address> WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
     LABEL="got a new car" npm run post:preprod
   ```
9. **Reply to an existing post**:
   ```bash
   CONTRACT_ADDRESS=<address> WALLET_SEED=<hex> IDENTITY_SECRET_KEY=<hex> \
     PARENT_ID=1 LABEL="congrats!!" npm run reply:preprod
   ```
10. **Check a deployed contract's public wall** at any time:
    ```bash
    CONTRACT_ADDRESS=<address> npm run status:preview
    ```

## Frontend — Lace wallet DApp

`frontend/` is a Vite + React app that connects to Lace via the [DApp
Connector API](https://docs.midnight.network/api-reference/dapp-connector)
(`@midnight-ntwrk/dapp-connector-api`) and calls the same contract as the
CLI, from the browser. It always talks to one fixed, universally-known
deployed contract (`VITE_CONTRACT_ADDRESS`) — there's no manual deploy/join
UI — so connecting a wallet loads that contract's public wall automatically.

```bash
cd frontend
npm run dev            # http://localhost:5173
```

The compiler defaults to **Preprod** (`VITE_NETWORK=preprod`) when unset,
but `frontend/.env.local` targets **Preview** (`VITE_NETWORK=preview`)
against the live contract address above — set it to `preprod` instead once
a Preprod deployment exists (see `.env.example`). `predev`/`prebuild` build
the `contract` workspace and copy its compiled circuit artifacts from
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
- `contract.ts` — deploy / join / `post` / `reply` / `derivePseudonym`,
  mirroring `cli/src/api.ts` but running entirely client-side.

**Observable privacy behavior**: connecting a wallet renders a
"pseudonym strip" that shows your real unshielded wallet address next to
the pin the wall actually uses for your posts — computed client-side by
`derivePseudonym()`, the same `publicKey()` hash the contract itself
proves in the circuit, with no network round-trip. The two values are
never equal, and every post you make from that wallet carries the same
pin, no matter how many times you reconnect. This is provable, not just
asserted by the UI: `publicKey()` is an exported pure circuit, so anyone
can independently recompute your pin from your (self-disclosed, if you
choose) secret key and confirm it matches what's on chain — but nobody
can go the other direction and recover your key, or your wallet address,
from the pin alone.

## Screenshots

**`compact compile` + test output** — compiled circuits and the generated `managed/` tree (zkir + prover/verifier keys):

![compact compile output](screenshots/compile.png)

**`npm run deploy:preview` output** — wallet funding and the resulting on-chain contract address:

![deploy to Preview output](screenshots/deploy.png)
