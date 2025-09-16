import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ethers } from "ethers";
import { CrossChainMessenger, MessageStatus } from "@eth-optimism/sdk";
import dotenv from "dotenv";
import { parseAbiItem } from "viem";

dotenv.config();

const l1Provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC);
const l2Provider = new ethers.providers.JsonRpcProvider(process.env.BASE_RPC);

const L1_STANDARD_BRIDGE = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";

const messenger = new CrossChainMessenger({
  l1ChainId: 1,
  l2ChainId: 8453,
  l1SignerOrProvider: l1Provider,
  l2SignerOrProvider: l2Provider,
});

async function checkBlockForDeposits(blockNumber: bigint) {
  const l1 = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETH_RPC!),
  });

  const DepositInitiated = parseAbiItem(
    "event DepositInitiated(address indexed from, address indexed to, address indexed l1Token, uint256 amount, bytes extraData)"
  );

  const logs = await l1.getLogs({
    address: L1_STANDARD_BRIDGE,
    event: DepositInitiated,
    fromBlock: blockNumber,
    toBlock: blockNumber,
  });

  if (logs.length === 0) {
    console.log(`⛓️ Block ${blockNumber}: no deposits`);
    return;
  }

  console.log(`\n📦 Block ${blockNumber}: found ${logs.length} deposit(s)`);

  for (const log of logs) {
    console.log(
      `   Deposit from ${log.args.from} → ${log.args.to}, token=${log.args.l1Token}, amount=${log.args.amount}, tx=${log.transactionHash}`
    );

    await checkL1ToBaseMessage(log.transactionHash);
  }
}

async function checkL1ToBaseMessage(l1TxHash: string) {
  const receipt = await l1Provider.getTransactionReceipt(l1TxHash);
  if (!receipt) return;

  const messages = await messenger.getMessagesByTransaction(receipt);
  for (const [i, msg] of messages.entries()) {
    const status = await messenger.getMessageStatus(msg);
    console.log(`   ↪ Message #${i} status: ${MessageStatus[status]}`);

    if (status === MessageStatus.READY_FOR_RELAY) {
      console.log("   ✅ Ready for relay on Base");
      // Optional auto-relay:
      // const tx = await messenger.finalizeMessage(msg);
      // console.log("   Relay tx:", tx.hash);
      // await tx.wait();
      // console.log("   Relay complete ✅");
    }
  }
}

async function main() {
  const l1 = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETH_RPC!),
  });

  console.log("🚀 Subscribing to new Ethereum blocks...");

  l1.watchBlocks({
    onBlock: async (block) => {
      try {
        await checkBlockForDeposits(block.number);
      } catch (err) {
        console.error("Error checking block:", block.number, err);
      }
    },
    onError: (err) => {
      console.error("Block subscription error:", err);
    },
  });
}

main().catch(console.error);
