import { formatUnits } from "viem";
import { estimateFillGas, type RelayDataV3 } from "../across/estimator";
import {
  GAS_SAFETY_MULT,
  GAS_PRICE_CAP_GWEI,
  MIN_PROFIT_ETH,
} from "../config/chains";

/**
 * Exact profit using on-chain gas estimate for SpokePool.fillV3Relay(...)
 */
export async function analyzeQuote(
  destChainId: number,
  relayData: RelayDataV3,
  repaymentChainId: bigint,
  feeTotalWei: bigint
) {
  const est = await estimateFillGas(destChainId, relayData, repaymentChainId);

  if (est.gasPriceGwei > GAS_PRICE_CAP_GWEI) {
    return {
      blockedByGasCap: true as const,
      gas: est.gas,
      gasPriceGwei: est.gasPriceGwei,
      feeEth: 0,
      costEth: Number.NaN,
      profitEth: -Infinity,
      minProfitEth: MIN_PROFIT_ETH,
    };
  }

  const costEthBuffered = est.costEth * GAS_SAFETY_MULT;
  const feeEth = Number(formatUnits(feeTotalWei, 18));
  const profitEth = feeEth - costEthBuffered;

  return {
    blockedByGasCap: false as const,
    gas: est.gas,
    gasPriceGwei: est.gasPriceGwei,
    feeEth,
    costEth: costEthBuffered,
    profitEth,
    minProfitEth: MIN_PROFIT_ETH,
  };
}
