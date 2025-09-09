import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainFromId } from "../config/networks";
import { getRpc } from "../config/chains";

/**
 * Minimal ABI for Optimism L1StandardBridge.depositETH(uint32 _l2Gas, bytes _data)
 */
const L1_STANDARD_BRIDGE_ABI = [
  {
    type: "function",
    name: "depositETH",
    stateMutability: "payable",
    inputs: [
      { name: "_l2Gas", type: "uint32" },
      { name: "_data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function run() {
  const originId = Number(process.env.BRIDGE_ORIGIN_ID ?? "11155111");
  const destId = Number(process.env.BRIDGE_DEST_ID ?? "11155420");
  const amount = parseEther(process.env.BRIDGE_AMOUNT ?? "0.003");

  const l1BridgeEnvKey = `L1_BRIDGE_${originId}`;
  const l1Bridge = must(l1BridgeEnvKey) as `0x${string}`;

  const pk = must("FILLER_PK") as `0x${string}`;

  const account = privateKeyToAccount(pk);

  const l1Chain = chainFromId(originId);
  const l1Rpc = getRpc(originId);
  const wallet = createWalletClient({
    account,
    chain: l1Chain,
    transport: http(l1Rpc),
  });
  const pub = createPublicClient({ chain: l1Chain, transport: http(l1Rpc) });

  const balWei = await pub.getBalance({ address: account.address });
  if (balWei < amount) {
    const have = Number(formatUnits(balWei, 18));
    const need = Number(formatUnits(amount, 18));
    throw new Error(`Insufficient L1 ETH. Have ${have}, need ${need}.`);
  }

  console.log(
    `Bridging ${formatUnits(amount, 18)} ETH from L1(${originId} ${
      l1Chain.name
    }) to L2(${destId}).`
  );
  console.log(`Using L1StandardBridge at ${l1Bridge}`);

  const L2_GAS = 200_000;
  const DATA = "0x";

  const txHash = await wallet.writeContract({
    address: l1Bridge,
    abi: L1_STANDARD_BRIDGE_ABI,
    functionName: "depositETH",
    args: [L2_GAS, DATA],
    value: amount,
  });

  console.log(`Sent bridge tx: ${txHash}`);
  console.log("Wait ~few minutes; then funds should appear on the L2 as ETH.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
