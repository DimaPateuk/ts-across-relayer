import { createAcrossClient } from "@across-protocol/app-sdk";
import { mainnet, arbitrum, optimism } from "viem/chains";
import { getAddress } from "viem";

export const CHAINS = [mainnet.id, arbitrum.id, optimism.id];

export const client = createAcrossClient({
  chains: [mainnet, arbitrum, optimism],
});

export const AMOUNT_ETH = String(process.env.AMOUNT_ETH ?? "1");
export const TARGET_DEST = Number(process.env.TARGET_DEST ?? "10"); // Optimism by default

export const FILLER_ADDRESS = getAddress(
  process.env.FILLER_ADDRESS || "0x0000000000000000000000000000000000000000"
);

/** WETH addresses (checksummed) */
export const WETH: Record<number, `0x${string}`> = {
  [mainnet.id]: getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  [arbitrum.id]: getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  [optimism.id]: getAddress("0x4200000000000000000000000000000000000006"),
};

/* ---------- profit safety controls (env-configurable) ---------- */
export const MIN_PROFIT_ETH = Number(process.env.MIN_PROFIT_ETH ?? "0.000001"); // floor
export const GAS_PRICE_CAP_GWEI = Number(
  process.env.GAS_PRICE_CAP_GWEI ?? "1.0"
); // cap
export const GAS_SAFETY_MULT = Number(process.env.GAS_SAFETY_MULT ?? "1.2"); // 20% buffer
export const FETCH_LOOKBACK_BLOCKS = BigInt(
  process.env.FETCH_LOOKBACK_BLOCKS ?? "200"
);
export const FETCH_ORIGIN_CHAIN_ID = Number(
  process.env.FETCH_ORIGIN_CHAIN_ID ?? "1"
);
