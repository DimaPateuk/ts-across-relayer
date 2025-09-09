import { createPublicClient, http } from "viem";
import { sepolia, optimismSepolia } from "viem/chains";
import { getL2TransactionHashes } from "viem/op-stack";

const L1_RPC = process.env.L1_RPC!;
const L2_RPC = process.env.L2_RPC!;

const L1_TX_HASH =
  "0xb0ce7236db998bdc60854124d1676343d3c0546ecd2c1a887ce977e6d3544445"; //envStr("L1_TX_HASH", "");
const DEPOSIT_L1_TX = L1_TX_HASH; //process.argv[2] as `0x${string}`;
async function main() {
  const l1 = createPublicClient({ chain: sepolia, transport: http(L1_RPC) });
  const l2 = createPublicClient({
    chain: optimismSepolia,
    transport: http(L2_RPC),
  });

  console.log("Checking L1 deposit tx:", DEPOSIT_L1_TX);
  const l1Receipt = await l1.getTransactionReceipt({ hash: DEPOSIT_L1_TX });

  const l2Hashes = getL2TransactionHashes(l1Receipt);
  if (!l2Hashes.length)
    throw new Error("No L2 deposit transactions derived from this L1 tx.");

  const l2Hash = l2Hashes[0];
  console.log("Derived L2 tx hash:", l2Hash);

  const l2Receipt = await l2.waitForTransactionReceipt({ hash: l2Hash });
  console.log(
    "L2 receipt status:",
    l2Receipt.status,
    "block",
    l2Receipt.blockNumber
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
