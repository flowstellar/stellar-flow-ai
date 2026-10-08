# StellarFlow

A deterministic command-parsing payment assistant built on the Stellar Network that simplifies cross-border transactions through a fixed command grammar.

StellarFlow allows users to send digital payments across borders using text commands that are matched by a deterministic parser and executed as Stellar blockchain transactions. The platform simplifies blockchain payments for anyone, even without prior crypto knowledge.

---

## 🚀  Features

- Command interface to initiate payments and query account information
- Stellar testnet/mainnet integration for real transactions
- Real-time transaction confirmations
- Clean, responsive frontend interface

---

## 💾 How It Works

1. User enters a payment command in the web interface
2. The deterministic command parser matches the input against a fixed grammar and builds a Stellar transaction request
3. Transaction is submitted to Stellar testnet/mainnet
4. Confirmation and transaction hash displayed to user

> Example: “Send $50 USDT to wallet XYZ”

---

## ℭ 🧠 Command Grammar

The assistant is a deterministic command parser over a fixed grammar. It does not call a language model. The parser is implemented in `src/components/AIAssistant.tsx` as `parseCommand`, which matches the input against the following branches:

### Send (payment)

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

## 🔗 Stellar Testnet Interaction

This project integrates with the Stellar blockchain.

- Network: Testnet
- Example Transaction Hash: <PASTE_HASH_HERE>

> You can verify it on [Stellar Laboratory](https://laboratory.stellar.org/)

---

> The video shows the command interface, sending a transaction, and proof of Stellar integration.

---

> Replace with your actual website screenshots

---

## 🧤 Development Note

- The frontend UI was prototyped using Lovable
- Core logic, Stellar transaction integration, and project idea are implemented and validated by me
- `.gitignore`
