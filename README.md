# StellarFlow

AI-powered cross-border payment platform using Stellar Network
 
AI-powered cross-border payment platform using Stellar Networj

StellarFlow allows users to send digital payments across borders using AI commands and Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.
A deterministic command-parsing payment assistant built on the Stellar Network that simplifies cross-border transactions through a fixed command grammar.

StellarFlow allows users to send digital payments across borders using text commands that are matched by a deterministic parser and executed as Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.

---

## 🚀  Features
## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Stellar Testnet Interaction](#stellar-testnet-interaction)
- [Development Note](#development-note)

---

## 🚀 Features

- Command interface to initiate payments and query account information
- Stellar testnet/mainnet integration for real transactions
- Real-time transaction confirmations
- Clean, responsive frontend interface
- Conversational AI interface to initiate payments  
- Stellar testnet integration for real transactions  
- Real-time transaction confirmations  
- Clean, responsive frontend interface (built with Lovable AI prototype)  

---

## 💾 How It Works

1. User enters payment command in the web  interface  
2. AI processes the request and generates Stellar transaction  
3. Transaction is submitted to Stellar testnet  
4. Confirmation and transaction hash displayed to user  
1. User enters a payment command in the web interface
2. The deterministic command parser matches the input against a fixed grammar and builds a Stellar transaction request
3. Transaction is submitted to Stellar testnet/mainnet
4. Confirmation and transaction hash displayed to user

> Example: “Send $50 USDT to wallet XYG”

---

## ℭ 🧠 Command Grammar
## 🛧 Getting Started

### Prerequisites

- Node.js (and the bundled `npm` package manager)
- Access to the Supabase functions used by the app (network reachability to the configured Supabase project)

The repo already ships a `.env` file in the tree with the required environment variables. No additional env setup is needed to run locally.

### Install

```bash
$ npm install
```

### Development server

```bash
$ npm run dev
```

The dev server binds to port **8080** (configured in `vite.config.ts`). Open http://localhost:8080/ in your browser.

### Build

```bash
$ npm run build
```

### Test

```bash
$ npm run test
```

---

## 🗂 Project Structure

| Path | Description |
| ---- | ----------- |
| `src/` | Application source code (React components, pages, and app entry point). |
| `supabase/functions/` | Supabase Edge Functions that the app calls for AI and Stellar workflows. |
| `src/lib/` | Shared utilities, helpers, and client integrations. |

---

## 🔗 Stellar Testnet Interaction

The assistant is a deterministic command parser over a fixed grammar. It does not call a language model. The parser is implemented in `src/components/AIAssistant.tsx` as `parseCommand`, which matches the input against the following branches:

- Network: Testnet
- Example Transaction Hash: d2b3c4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0e1f2a3b4
- Ledger: 12345678
- Created At: 2024-01-01T00:00:00Z
### Send (payment)
This project integrates with the Stellar testnet using a Lovable AI-powered prototype. The app is testnet-only; there is no mainnet switch in the codebase.

- Network: Testnet (`Networks.TESTNET in `suprabase/functions/stellar-send/index.ts`)
- Horizon endpoint: `https://horizon-testnet.stellar.org` (used by `stellar-send` and `stellar-balance`)
- Example Transaction Hash: <PASTE_HASH_HERE>  

The strict form (case-insensitive):

```
send <amount> <asset> to <destination>
```

- `<amount>` — numeric amount, optionally prefixed with `$` (e.g. `50`, `$50`).
- `<asset>` — the asset code (e.g. `USDT`, `XLM`).
- `<destination>` — the recipient wallet address or known contact name.

The loose form (case-insensitive) accepts the same fields with optional filler words:

```
send <amount> <asset> to <destination>
pay <amount> <asset> to <destination>
transfer <amount> <asset> to <destination>
```

Examples:

- `Send $50 USDT to wallet XYZ
- `pay 10 XLM to GABC… `
- `transfer 25 USDT to alice`

### History

```
history
transaction history
my transactions
show history
```

### Activity

```
activity
recent activity
my activity
```

### Balance

```
balance
my balance
show balance
```

### Contacts

```
contact
contacts
show contacts
my contacts
```

### Explore

```
explore
explore transaction <hash>
```

### Schedule

```
schedule
schedule payment
schedule transfer
```

### Help

Any input that does not match one of the branches above returns a static help string listing the available commands.

---

> The video shows the AI interface, sending a transaction, and proof of Stellar integration.

---

> Replace with your actual website screenshots
> The video shows the AI interface, sending a transaction, and proof of Stellar integration.
## 🖼 Screenshots

### Landing Page

![StellarFlow landing page with the AI payment assistant interface](docs/screenshot-landing.png)

### AI Assistant

## ⚙️ Environment
## 🔗 Stellar Testnet Interaction

This project integrates with the Stellar blockchain.

- Network: Testnet
- Example Transaction Hash: <PASTE_HASH_HERE>

> You can verify it on [Stellar Laboratory](https://laboratory.stellar.org/)
![StellarFlow AI assistant conversation screen initiating a Stellar payment](docs/screenshot-assistant.png)

> The video shows the AI interface, sending a transaction, and proof of Stellar integration.

---

> The video shows the command interface, sending a transaction, and proof of Stellar integration.
## 📸 Screenshots

---

The app reads its Supabase configuration from Vite environment variables at
build time (see `src/integrations/supabase/client.ts`). Copy `.env.example` to
`.env` and fill in your own values before running `npm run dev`.

| Variable | Required | Purpose | Consequence if omitted |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Base URL of the Supabase project used by the frontend client. | Vite inlines `undefine`; the client is created with an invalid URL and the first `stellarApi` call fails at runtime. |
| `VITE_SUPABASE_PUBLISHABLE_KEX | Yes | Public (anon) API key used to authenticate frontend requests to Supabase. | Vite inlines `undefined`; requests are unauthorized and the first `stellarApi` call fails at runtime. |
| `VITE_SUPABASE_PROJECT_ID` | No (unused) | Not read by any code in `src/`. Kept only for reference. | None — nothing in the app depends on it. |
> Replace with your actual website screenshots

---

## 🧰 Development Note

## 🧠 Development Note

- The frontend UI and AI integration were prototyped using Lovable AI  
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me  
- .gitignore

### Required Build Environment Variables

The production build requires the following environment variables. The build will fail fast if either is missing:

- `VITE_SUPABASE_URL` — the Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable (anon) key

For local development, add them to a `.env` file at the repository root. In CI, supply them via repository secrets (see `.github/workflows/ci.yml`).
## 🧤 Development Note

- The frontend UI was prototyped using Lovable
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me
- `.gitignore`
