import { formatUnits, parseAbiItem, type Address } from "viem";
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

export const SPOKE_POOL: Record<number, Address> = {
  1: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5", // Ethereum_SpokePool
  42161: "0xe35e9842fceaca96570b734083f4a58e8f7c5f2a", // Arbitrum_SpokePool
  10: "0x6f26Bf09B1C792e3228e5467807a900A503c0281", // Optimism_SpokePool
};
export const V3_FUNDS_DEPOSITED = parseAbiItem(
  "event V3FundsDeposited(address indexed depositor, address indexed recipient, address indexed inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 originChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes message)"
);

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
export const SPOKE_EVENTS = [
  {
    type: "event",
    name: "V3FundsDeposited",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "inputToken", type: "address", indexed: true },
      { name: "outputToken", type: "address", indexed: false },
      { name: "inputAmount", type: "uint256", indexed: false },
      { name: "outputAmount", type: "uint256", indexed: false },
      { name: "originChainId", type: "uint256", indexed: false },
      { name: "exclusiveRelayer", type: "address", indexed: false },
      { name: "quoteTimestamp", type: "uint32", indexed: false },
      { name: "fillDeadline", type: "uint32", indexed: false },
      { name: "exclusivityDeadline", type: "uint32", indexed: false },
      { name: "message", type: "bytes", indexed: false },
    ],
  },
] as const;
