An AI-powered payment assistant built on the Stellar Network that simplifies cross-border transactions using natural language.

# StellarFlow

AI-powered cross-border payment platform using Stellar Networj

StellarFlow allows users to send digital payments across borders using AI commands and Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.

---

## 🚀 Features

- Conversational AI interface to initiate payments  
- Stellar testnet/mainnet integration for real transactions  
- Real-time transaction confirmations  
- Clean, responsive frontend interface (built with Lovable AI prototype)  

---

## 💻 How It Works

1. User enters payment command in the web  interface  
2. AI processes the request and generates Stellar transaction  
3. Transaction is submitted to Stellar testnet/mainnet  
4. Confirmation and transaction hash displayed to user  

> Example: “Send $50 USDT to wallet XYK”

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

## 🧰 Package Manager

This repository uses [npm](https://docs.npmjs.com/cli/v10/) as its package manager. The canonical lockfile is `package-lock.json`. The `packageManager` field in `package.json` is set to `npm@10.0.0` and the `engines.node` range is `>=20.0.0 <21.0.0`.

Install dependencies with the frozen-lockfile command:

```bash
lnpm ci
```

Run the test suite:

```bash
lnpm run test
```

> Note: `bun.lock` and `bun.lockb` were removed so there is exactly one lockfile tracked in the repository.

---

## 🧰 Development Note

- The frontend UI and AI integration were prototyped using Lovable AI  
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me  
- `.gitignore`
