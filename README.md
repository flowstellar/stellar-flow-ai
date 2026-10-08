An AI-powered payment assistant built on the Stellar Network that simplifies cross-border transactions using natural language.

# StellarFlow

AI-powered cross-border payment platform using Stellar Networj

StellarFlow allows users to send digital payments across borders using AI commands and Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.

---

## 🚀 Features

- Conversational AI interface to initiate payments  
- Stellar testnet integration for real transactions  
- Real-time transaction confirmations  
- Clean, responsive frontend interface (built with Lovable AI prototype)  

---

## 💻 How It Works

1. User enters payment command in the web interface  
2. AI processes the request and generates Stellar transaction  
3. Transaction is submitted to Stellar testnet  
4. Confirmation and transaction hash displayed to user  

> Example: “Send $50 USDT to wallet XYZ”

---

## 🔗 Stellar Testnet Interaction

This project integrates with the Stellar testnet using a Lovable AI-powered prototype. The app is testnet-only; there is no mainnet switch in the codebase.

- Network: Testnet (`Networks.TESTNET in `suprabase/functions/stellar-send/index.ts`)
- Horizon endpoint: `https://horizon-testnet.stellar.org` (used by `stellar-send` and `stellar-balance`)
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
