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

## 🔑 Filler Address Across Chains

Your `FILLER_ADDRESS` is the **same** on every EVM-compatible chain (Ethereum, Optimism, Arbitrum, Sepolia testnet, OP Sepolia, etc.).  
This is because an Ethereum account is just a keypair — the derived public address doesn’t change between networks.

⚠️ Important: while the address is the same, the **balances are chain-specific**.  
You must fund your filler separately on each chain you want to operate on.

---

## 💰 How much to fund on each chain?

- **Destination chain (TARGET_DEST, e.g. Optimism)**  
  - Needs **gas ETH**: ~0.001–0.005 ETH is enough to start (each fill costs ~0.0001–0.0003 ETH).  
  - Needs **WETH**: at least the `AMOUNT_ETH` you want to relay (e.g. 0.001–0.01 WETH).  
  - ✅ This is the most important chain to fund because you front the liquidity here.

- **Origin chain (FETCH_ORIGIN_CHAIN_ID, e.g. Ethereum)**  
  - You don’t need to hold tokens here to fill.  
  - Only required for **watching deposits** (RPC calls).  
  - Just keep a **tiny bit of ETH** (0.001) if you plan to also bridge out, but not required for filling.

- **Repayment chain (REPAY_CHAIN_ID, usually Ethereum)**  
  - This is where your profits are **paid back** (e.g., WETH on Ethereum L1).  
  - You don’t need to pre-fund here for filling, but you may want ~0.001 ETH for gas if you plan to move/unwrap profits later.

---

## 🧮 Example starter setup (testnet)

- On **OP Sepolia** (destination):
  - 0.003 ETH bridged from Sepolia → OP Sepolia.
  - Wrap 0.001 ETH into WETH.
  - Leave 0.002 ETH as gas.

- On **Sepolia (origin)**:
  - No WETH needed.
  - Optional: 0.001 ETH for bridge replays.

---

## 🧮 Example starter setup (mainnet)

- On **Optimism mainnet (destination)**:
  - ~0.02 ETH (enough for 50–100 fills).
  - ~0.01 WETH (to front fills of size 0.01 WETH).

- On **Ethereum mainnet (repayment)**:
  - No upfront WETH needed.
  - Keep ~0.005 ETH if you want to unwrap or move profits.

- On **Arbitrum** (if you include it in CHAINS):
  - Similar to Optimism: ~0.01 ETH + 0.01 WETH.

---

👉 TL;DR  
- Same `FILLER_ADDRESS` everywhere.  
- Fund **ETH + WETH on the destination chain**.  
- Only minimal ETH elsewhere.  
