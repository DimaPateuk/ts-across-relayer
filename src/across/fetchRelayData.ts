import { getPublic } from "../clients/public";
import { SPOKE_POOL, V3_FUNDS_DEPOSITED, type RelayDataV3 } from "./estimator";
import { FETCH_ORIGIN_CHAIN_ID, FETCH_LOOKBACK_BLOCKS } from "../config/chains";

/**
 * Fetch the most recent V3FundsDeposited from origin chain.
 */
export async function fetchLatestRelayData(): Promise<RelayDataV3 | null> {
  const pub = getPublic(FETCH_ORIGIN_CHAIN_ID);

  const latest = await pub.getBlockNumber();
  const fromBlock =
    latest > FETCH_LOOKBACK_BLOCKS ? latest - FETCH_LOOKBACK_BLOCKS : 0n;

  const logs = await pub.getLogs({
    address: SPOKE_POOL[FETCH_ORIGIN_CHAIN_ID],
    event: V3_FUNDS_DEPOSITED,
    fromBlock,
    toBlock: latest,
  });

  if (logs.length === 0) return null;

  const log = logs[logs.length - 1];
  const a = log.args;
  if (!a) return null;

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

  return relayData;
}
