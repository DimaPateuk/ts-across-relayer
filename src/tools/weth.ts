import "dotenv/config";
import {
  createWalletClient,
  http,
  parseEther,
  formatUnits,
  type Chain,
  createPublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, arbitrum, optimism } from "viem/chains";
import { WETH } from "../config/chains";
import { WETH_ABI } from "../tokens/wethAbi";

const CHAINS: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
};

function getRpc(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return process.env.ETHEREUM_RPC!;
    case arbitrum.id:
      return process.env.ARBITRUM_RPC!;
    case optimism.id:
      return process.env.OPTIMISM_RPC!;
    default:
      throw new Error(`Unsupported CHAIN_ID=${chainId}`);
  }
}
async function run() {
  const pk = process.env.FILLER_PK;
  if (!pk) throw new Error("FILLER_PK missing in .env");

  const chainId = Number(process.env.CHAIN_ID ?? "10");
  const mode = process.env.WRAP_MODE ?? "wrap";
  const amount = parseEther(process.env.WRAP_AMOUNT ?? "0.001");

  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chainId: ${chainId}`);

  const account = privateKeyToAccount(pk as `0x${string}`);

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(getRpc(chainId)),
  });

  const pub = createPublicClient({
    chain,
    transport: http(getRpc(chainId)),
  });

  console.log(
    `${mode === "wrap" ? "Wrapping" : "Unwrapping"} ${formatUnits(
      amount,
      18
    )} on chain ${chainId} (${chain.name})`
  );

  let txHash: `0x${string}`;
  if (mode === "wrap") {
    txHash = await wallet.writeContract({
      address: WETH[chainId],
      abi: WETH_ABI,
      functionName: "deposit",
      value: amount,
    });
  } else if (mode === "unwrap") {
    txHash = await wallet.writeContract({
      address: WETH[chainId],
      abi: WETH_ABI,
      functionName: "withdraw",
      args: [amount],
    });
  } else {
    throw new Error(`Invalid WRAP_MODE: ${mode}`);
  }

  console.log("Sent tx:", txHash);

  const balance = await pub.readContract({
    address: WETH[chainId],
    abi: WETH_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log(`New WETH balance: ${formatUnits(balance, 18)} WETH`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
