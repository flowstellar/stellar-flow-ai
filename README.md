An AI-powered payment assistant built on the Stellar Network that simplifies cross-border transactions using natural language.

# StellarFlow

AI-powered cross-border payment platform using Stellar Network
 
StellarFlow allows users to send digital payments across borders using AI commands and Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Stellar Testnet Interaction](#stellar-testnet-interaction)
- [Development Note](#development-note)

---

## 🚀 Features

- Conversational AI interface to initiate payments  
- Stellar testnet/mainnet integration for real transactions  
- Real-time transaction confirmations  
- Clean, responsive frontend interface (built with Lovable AI prototype)  

---

## 💻 How It Works

1. User enters payment command in the web interface  
2. AI processes the request and generates Stellar transaction  
3. Transaction is submitted to Stellar testnet/mainnet  
4. Confirmation and transaction hash displayed to user  

> Example: “Send $50 USDT to wallet XYZ”

---

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

This project integrates with Stellar blockchain using a Lovable AI-powered prototype.

- Network: Testnet  
- Example Transaction Hash: <PASTE_HASH_HERE>  

> You can verify it on [Stellar Laboratory](https://laboratory.stellar.org/)

---

> The video shows the AI interface, sending a transaction, and proof of Stellar integration.

---

> Replace with your actual website screenshots

---

## 🧠 Development Note

- The frontend UI and AI integration were prototyped using Lovable AI  
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me  
- `.gitignore
