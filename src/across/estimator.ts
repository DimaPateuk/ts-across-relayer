import { formatUnits, type Address } from "viem";
import { getPublic } from "../clients/public";

export type Bytes = `0x${string}`;

export type RelayDataV3 = {
  depositor: Address;
  recipient: Address;
  inputToken: Address;
  outputToken: Address;
  inputAmount: bigint;
  outputAmount: bigint;
  originChainId: bigint;
  exclusiveRelayer: Address;
  quoteTimestamp: number; // uint32
  fillDeadline: number; // uint32
  exclusivityDeadline: number; // uint32
  message: Bytes;
};

// Minimal ABI for SpokePool.fillV3Relay((...), uint256)
export const SPOKE_ABI = [
  {
    type: "function",
    name: "fillV3Relay",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "relayData",
        type: "tuple",
        components: [
          { name: "depositor", type: "address" },
          { name: "recipient", type: "address" },
          { name: "inputToken", type: "address" },
          { name: "outputToken", type: "address" },
          { name: "inputAmount", type: "uint256" },
          { name: "outputAmount", type: "uint256" },
          { name: "originChainId", type: "uint256" },
          { name: "exclusiveRelayer", type: "address" },
          { name: "quoteTimestamp", type: "uint32" },
          { name: "fillDeadline", type: "uint32" },
          { name: "exclusivityDeadline", type: "uint32" },
          { name: "message", type: "bytes" },
        ],
      },
      { name: "repaymentChainId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/** TODO: replace placeholders with real SpokePool addresses */
export const SPOKE_POOL: Record<number, Address> = {
  1: "0xSpokePoolOnMainnet",
  42161: "0xSpokePoolOnArbitrum",
  10: "0xSpokePoolOnOptimism",
};

export async function estimateFillGas(
  destChainId: number,
  relayData: RelayDataV3,
  repaymentChainId: bigint
) {
  const pub = getPublic(destChainId);
  const address = SPOKE_POOL[destChainId];
  if (!address)
    throw new Error(`Missing SpokePool address for chain ${destChainId}`);

  const gas = await pub.estimateContractGas({
    address,
    abi: SPOKE_ABI,
    functionName: "fillV3Relay",
    args: [relayData, repaymentChainId],
  });

  const gasPrice = await pub.getGasPrice();
  const costWei = gas * gasPrice;

  return {
    gas,
    gasPrice,
    costWei,
    gasPriceGwei: Number(formatUnits(gasPrice, 9)),
    costEth: Number(formatUnits(costWei, 18)),
  };
}
