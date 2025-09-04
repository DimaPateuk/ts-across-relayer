import { type Chain } from "viem";
import {
  mainnet,
  arbitrum,
  optimism,
  sepolia,
  optimismSepolia,
  arbitrumSepolia,
} from "viem/chains";

const byId: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [sepolia.id]: sepolia,
  [optimismSepolia.id]: optimismSepolia,
  [arbitrumSepolia.id]: arbitrumSepolia,
};

export function chainFromId(id: number): Chain {
  const c = byId[id];
  if (!c) throw new Error(`Unsupported chainId ${id}. Add it in networks.ts`);
  return c;
}
