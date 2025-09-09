# Filler Bot (Across / Optimism)

## 📦 Setup
```bash
git clone <your-repo>
cd <your-repo>
npm install
```

## ⚙️ Environment
You can switch networks by using different `.env` files. Example for **testnet**:

`.env.testnet`
```env
# Chains to use (Sepolia L1 + OP Sepolia L2)
CHAINS=11155111,11155420

# RPC endpoints
RPC_11155111=https://sepolia.infura.io/v3/<KEY>
RPC_11155420=https://sepolia.optimism.io

# SpokePool contracts (testnet)
SPOKEPOOL_11155111=0x5ef6C01E11889d86803e0B23e3cB3F9E9d97B662
SPOKEPOOL_11155420=0x4e8E101924eDE233C13e2D8622DC8aED2872d505

# WETH contracts
WETH_11155111=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
WETH_11155420=0x4200000000000000000000000000000000000006

# Filler account
FILLER_PK=0xyourprivatekey
FILLER_ADDRESS=0xyouraddress

# Bridge settings
BRIDGE_ORIGIN_ID=11155111
BRIDGE_DEST_ID=11155420
```

---

## 🪙 Step 1: Fund your account
- Get **Sepolia ETH** from a faucet.  
- Ensure your `FILLER_ADDRESS` has a few thousand gwei for testing.

---

## 🔀 Step 2: Bridge ETH to OP Sepolia
Send ETH from L1 → L2:

```bash
npm run bridge:testnet
```

This reduces ETH on Sepolia and (after relay) increases ETH on OP Sepolia.

---

## 🔎 Step 3: Check deposit relay
Check if your bridge tx was relayed to OP Sepolia:

```bash
L1_TX_HASH=0x... npm run checkDeposit:testnet
```

If status is `RELAYED_SUCCEEDED`, ETH is on L2.  
If `RELAYED_FAILED`, the script will attempt a resend with higher gas.

---

## 💧 Step 4: Wrap ETH → WETH
Once ETH is on OP Sepolia, wrap some into WETH:

```bash
CHAIN_ID=11155420 WRAP_MODE=wrap WRAP_AMOUNT=0.001 npm run weth:testnet
```

---

## 📊 Step 5: Check balances
Print ETH and WETH balances on all configured chains:

```bash
npm run balances:testnet
```

---

## 🚀 Step 6: Run filler loop
Quote across chains and check for profitable fills:

```bash
npm run dev:testnet
```

When profitable:
- Script checks if you have enough WETH on destination chain.
- Simulates `fillV3Relay`.
- Submits fill tx if profitable.

---

## Notes
- Always start small (e.g., 0.002–0.003 ETH bridged).  
- Profits on testnet are **just for testing**; mainnet relays are competitive.  
- Use different `.env` files for **testnet** and **mainnet** configs.  
