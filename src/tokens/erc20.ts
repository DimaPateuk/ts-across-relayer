import { getPublic } from "../clients/public";

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export async function erc20Balance(
  chainId: number,
  token: `0x${string}`,
  owner: `0x${string}`
) {
  const pub = getPublic(chainId);
  return await pub.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [owner],
  });
}
