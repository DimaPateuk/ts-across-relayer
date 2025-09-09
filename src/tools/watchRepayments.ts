import "dotenv/config";
import { formatUnits } from "viem";
import { getPublic } from "../clients/public";
import { ERC20_TRANSFER_ABI } from "../tokens/erc20TransferAbi";
import { WETH, FILLER_ADDRESS, FETCH_LOOKBACK_BLOCKS } from "../config/chains";
import { SPOKE_POOL } from "../across/estimator";

/**
 * We look for WETH Transfer events:
 *   token:   WETH on REPAY_CHAIN_ID
 *   from:    SPOKE_POOL[REPAY_CHAIN_ID]
 *   to:      your FILLER_ADDRESS
 */
const REPAY_CHAIN_ID = Number(process.env.REPAY_CHAIN_ID ?? "1");
const LOOKBACK = FETCH_LOOKBACK_BLOCKS;

async function once() {
  const pub = getPublic(REPAY_CHAIN_ID);
  const token = WETH[REPAY_CHAIN_ID];
  const from = SPOKE_POOL[REPAY_CHAIN_ID];
  const to = FILLER_ADDRESS;

  if (!token) throw new Error(`No WETH token for chain ${REPAY_CHAIN_ID}`);
  if (!from) throw new Error(`No SpokePool for chain ${REPAY_CHAIN_ID}`);

  const latest = await pub.getBlockNumber();
  const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : 0n;

  const logs = await pub.getLogs({
    address: token,
    event: ERC20_TRANSFER_ABI[0],
    args: { from, to },
    fromBlock,
    toBlock: latest,
  });

  if (logs.length === 0) {
    console.log(
      `No repayments found in blocks ${fromBlock}..${latest} on chain ${REPAY_CHAIN_ID}.`
    );
    return;
  }

  let total = 0n;
  for (const log of logs) {
    const v = log.args?.value as bigint;
    total += v;
    console.log(
      [
        `+ Repayment tx=${log.transactionHash}`,
        `block=${log.blockNumber?.toString()}`,
        `amount=${formatUnits(v, 18)} WETH`,
      ].join("  |  ")
    );
  }
  console.log(`\nTotal repaid in window: ${formatUnits(total, 18)} WETH`);
}

async function watch() {
  const intervalMs = Number(process.env.REPAY_POLL_MS ?? "12000");

  let last = 0n;

  const pub = getPublic(REPAY_CHAIN_ID);
  const token = WETH[REPAY_CHAIN_ID];
  const from = SPOKE_POOL[REPAY_CHAIN_ID];
  const to = FILLER_ADDRESS;

  if (!token) throw new Error(`No WETH token for chain ${REPAY_CHAIN_ID}`);
  if (!from) throw new Error(`No SpokePool for chain ${REPAY_CHAIN_ID}`);

  const tick = async () => {
    try {
      const latest = await pub.getBlockNumber();

      const fromBlock =
        last === 0n ? (latest > LOOKBACK ? latest - LOOKBACK : 0n) : last + 1n;

      if (fromBlock > latest) return;

      const logs = await pub.getLogs({
        address: token,
        event: ERC20_TRANSFER_ABI[0],
        args: { from, to },
        fromBlock,
        toBlock: latest,
      });

      for (const log of logs) {
        const v = log.args?.value as bigint;
        console.log(
          [
            `+ Repayment tx=${log.transactionHash}`,
            `block=${log.blockNumber?.toString()}`,
            `amount=${formatUnits(v, 18)} WETH`,
          ].join("  |  ")
        );
        if (log.blockNumber && log.blockNumber > last) last = log.blockNumber;
      }

      if (latest > last) last = latest;
    } catch (e: any) {
      console.error("poll error:", e?.message ?? e);
    }
  };

  console.log(
    `Watching repayments on chain ${REPAY_CHAIN_ID} (from SpokePool -> ${to}). Poll every ${intervalMs}ms.`
  );
  await tick();
  setInterval(tick, intervalMs);
}

if (process.env.WATCH === "1") {
  watch().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  once().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
