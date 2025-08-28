import { getPublic } from "../clients/public";
import { formatUnits } from "viem";

// rough gas used per fill (tunable; start conservative)
const GAS_USED_BY_CHAIN: Record<number, bigint> = {
  1: 220_000n, // mainnet
  42161: 350_000n, // arbitrum
  10: 300_000n, // optimism
};

export async function analyzeQuote(destChainId: number, feeTotalWei: bigint) {
  const pub = getPublic(destChainId);
  const gasPrice = await pub.getGasPrice(); // wei per gas

  const gasUsed = GAS_USED_BY_CHAIN[destChainId] ?? 300_000n;
  const safety = 13n; // 1.3x buffer
  const txCostWei = (gasUsed * gasPrice * safety) / 10n;

  const feeEth = Number(formatUnits(feeTotalWei, 18));
  const costEth = Number(formatUnits(txCostWei, 18));
  const profitEth = feeEth - costEth;

  return {
    feeEth,
    costEth,
    profitEth,
    gasPriceGwei: Number(formatUnits(gasPrice, 9)),
  };
}
