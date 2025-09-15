import "dotenv/config";
import { formatUnits } from "viem";
import { getPublic } from "../clients/public";
import { V3_FUNDS_DEPOSITED, type RelayDataV3 } from "../across/estimator";
import {
  FETCH_LOOKBACK_BLOCKS,
  FETCH_ORIGIN_CHAIN_ID,
  SPOKE_POOL,
} from "../config/chains";

async function run() {
  const originChainId = FETCH_ORIGIN_CHAIN_ID;
  const pub = getPublic(originChainId);

  const latest = await pub.getBlockNumber();
  const fromBlock =
    latest > FETCH_LOOKBACK_BLOCKS ? latest - FETCH_LOOKBACK_BLOCKS : 0n;
  const toBlock = latest;

  console.log(
    `Scanning chain ${originChainId} blocks ${fromBlock} → ${toBlock} for V3FundsDeposited...`
  );

  const logs = await pub.getLogs({
    address: SPOKE_POOL[originChainId],
    event: V3_FUNDS_DEPOSITED,
    fromBlock,
    toBlock,
  });

  if (logs.length === 0) {
    console.log("No deposits found in this range.");
    return;
  }

  const log = logs[logs.length - 1];
  const a = log.args;

  if (!a) {
    console.log("Log had no args, unexpected.");
    return;
  }

  const relayData: RelayDataV3 = {
    depositor: a.depositor!,
    recipient: a.recipient!,
    inputToken: a.inputToken!,
    outputToken: a.outputToken!,
    inputAmount: a.inputAmount!,
    outputAmount: a.outputAmount!,
    originChainId: a.originChainId!,
    exclusiveRelayer: a.exclusiveRelayer!,
    quoteTimestamp: Number(a.quoteTimestamp!),
    fillDeadline: Number(a.fillDeadline!),
    exclusivityDeadline: Number(a.exclusivityDeadline!),
    message: a.message!,
  };

  console.log("Latest V3FundsDeposited:");
  console.log({
    txHash: log.transactionHash,
    block: log.blockNumber?.toString(),
    depositor: relayData.depositor,
    recipient: relayData.recipient,
    amount: formatUnits(relayData.inputAmount, 18),
    outputAmount: formatUnits(relayData.outputAmount, 18),
    originChainId: relayData.originChainId.toString(),
  });

  console.log("\nrelayData object (ready to pass into analyzeQuote):");
  console.dir(relayData, { depth: null });
}

run().catch(console.error);
