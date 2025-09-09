import { createAcrossClient } from "@across-protocol/app-sdk";
import { createPublicClient, http, getAddress, type Address } from "viem";
import {
  mainnet,
  arbitrum,
  optimism,
  sepolia,
  optimismSepolia,
  arbitrumSepolia,
  type Chain,
} from "viem/chains";
import {
  parseChains,
  buildRpcMap,
  buildWethMap,
  buildSpokePoolMap,
  envNum,
  envStr,
} from "./env";

/* ----- chain registry (add more if needed) ----- */
const byId: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [sepolia.id]: sepolia,
  [optimismSepolia.id]: optimismSepolia,
  [arbitrumSepolia.id]: arbitrumSepolia,
};
export const chainFromId = (id: number) => {
  const c = byId[id];
  if (!c) throw new Error(`Unsupported chainId ${id}`);
  return c;
};

/* ----- core runtime knobs ----- */
export const CHAINS = parseChains();
export const TARGET_DEST = envNum("TARGET_DEST", 10);
export const FETCH_ORIGIN_CHAIN_ID = envNum("FETCH_ORIGIN_CHAIN_ID", 1);
export const FETCH_LOOKBACK_BLOCKS = BigInt(
  envNum("FETCH_LOOKBACK_BLOCKS", 200)
);
export const REPAY_CHAIN_ID = envNum("REPAY_CHAIN_ID", 1);

export const AMOUNT_ETH = envStr("AMOUNT_ETH", "0.001");
export const MIN_PROFIT_ETH = Number(envStr("MIN_PROFIT_ETH", "0.000001"));
export const GAS_PRICE_CAP_GWEI = Number(envStr("GAS_PRICE_CAP_GWEI", "1.0"));
export const GAS_SAFETY_MULT = Number(envStr("GAS_SAFETY_MULT", "1.2"));

export const FILLER_ADDRESS = getAddress(
  (process.env.FILLER_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`
);

/* ----- per-chain maps built from simple env vars ----- */
export const RPC_URLS = buildRpcMap(CHAINS);
console.log("RPC_URLS:", RPC_URLS);
export const WETH: Record<number, Address> = buildWethMap(CHAINS);
export const SPOKE_POOL: Record<number, Address> = buildSpokePoolMap(CHAINS);

/* ----- helpers & clients ----- */
export const getRpc = (chainId: number) => {
  const url = RPC_URLS[chainId];
  if (!url) throw new Error(`Missing RPC_${chainId}`);
  return url;
};

export function makePublic(chainId: number) {
  return createPublicClient({
    chain: chainFromId(chainId),
    transport: http(getRpc(chainId)),
  });
}

export const client = createAcrossClient({
  chains: CHAINS.map(chainFromId),
});
