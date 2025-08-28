import { createAcrossClient } from "@across-protocol/app-sdk";
import { mainnet, arbitrum, optimism } from "viem/chains";
import { getAddress } from "viem";

export const CHAINS = [mainnet.id, arbitrum.id, optimism.id];

export const client = createAcrossClient({
  // integratorId: 'your-id', // optional
  chains: [mainnet, arbitrum, optimism],
});

export const PROFIT_FLOOR_ETH = Number(
  process.env.PROFIT_FLOOR_ETH ?? "0.00005"
);

export const AMOUNT_ETH = String(process.env.AMOUNT_ETH ?? "1");

export const TARGET_DEST = Number(process.env.TARGET_DEST ?? "10"); // default Optimism

export const FILLER_ADDRESS = getAddress(
  process.env.FILLER_ADDRESS || "0x0000000000000000000000000000000000000000"
);

/** WETH addresses (checksummed) */
export const WETH: Record<number, `0x${string}`> = {
  [mainnet.id]: getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  [arbitrum.id]: getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  [optimism.id]: getAddress("0x4200000000000000000000000000000000000006"),
};
