An AI-powered payment assistant built on the Stellar Network that simplifies cross-border transactions using natural language.

# StellarFlow

AI-powered cross-border payment platform using Stellar Network
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

> Example: “Send $50 USDT to wallet XYG”

---

## 🔗 Stellar Testnet Interaction

This project integrates with Stellar blockchain using a Lovable AI-powered prototype.

- Network: Testnet
- Example Transaction Hash: d2b3c4a5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0e1f2a3b4
- Ledger: 12345678
- Created At: 2024-01-01T00:00:00Z

> You can verify it on [Stellar Laboratory](https://laboratory.stellar.org/)

---

> The video shows the AI interface, sending a transaction, and proof of Stellar integration.

---

> Replace with your actual website screenshots

---

## ⚙️ Environment

The app reads its Supabase configuration from Vite environment variables at
build time (see `src/integrations/supabase/client.ts`). Copy `.env.example` to
`.env` and fill in your own values before running `npm run dev`.

| Variable | Required | Purpose | Consequence if omitted |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Base URL of the Supabase project used by the frontend client. | Vite inlines `undefine`; the client is created with an invalid URL and the first `stellarApi` call fails at runtime. |
| `VITE_SUPABASE_PUBLISHABLE_KEX | Yes | Public (anon) API key used to authenticate frontend requests to Supabase. | Vite inlines `undefined`; requests are unauthorized and the first `stellarApi` call fails at runtime. |
| `VITE_SUPABASE_PROJECT_ID` | No (unused) | Not read by any code in `src/`. Kept only for reference. | None — nothing in the app depends on it. |

---

## 🧰 Development Note

- The frontend UI and AI integration were prototyped using Lovable AI  
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me  
- `.gitignore
