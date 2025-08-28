import { parseEther, formatUnits } from "viem";
import pino from "pino";
import {
  AMOUNT_ETH,
  CHAINS,
  TARGET_DEST,
  WETH,
  client,
  PROFIT_FLOOR_ETH,
  FILLER_ADDRESS,
} from "../config/chains";
import { analyzeQuote } from "../profit/analyze";
import { erc20Balance } from "../tokens/erc20";
import { estimateFillGas, type RelayDataV3 } from "../across/estimator";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

export async function quoteLoop() {
  for (const origin of CHAINS) {
    for (const dest of CHAINS) {
      if (origin === dest) continue;
      if (dest !== TARGET_DEST) continue; // focus on one destination while testing

      const inputToken = WETH[origin];
      const outputToken = WETH[dest];

      const quote = await client.getQuote({
        route: {
          originChainId: origin,
          destinationChainId: dest,
          inputToken,
          outputToken,
        },
        inputAmount: parseEther(AMOUNT_ETH),
      });

      const { feeEth, costEth, profitEth, gasPriceGwei } = await analyzeQuote(
        dest,
        quote.fees.totalRelayFee.total
      );

      log.info(
        {
          origin,
          dest,
          out: quote.deposit.outputAmount.toString(),
          feeEth: feeEth.toFixed(6),
          estCostEth: costEth.toFixed(6),
          estProfitEth: profitEth.toFixed(6),
          gasGwei: gasPriceGwei.toFixed(1),
        },
        "quote"
      );

      if (profitEth < PROFIT_FLOOR_ETH) {
        log.info(
          {
            origin,
            dest,
            profitEth: profitEth.toFixed(6),
            floor: PROFIT_FLOOR_ETH,
          },
          "skip: below floor"
        );
        continue;
      }

      const needWei = quote.deposit.outputAmount;
      const needEth = Number(formatUnits(needWei, 18));
      log.info(
        {
          origin,
          dest,
          profitEth: profitEth.toFixed(6),
          needEth: needEth.toFixed(6),
        },
        "✅ READY"
      );

      const haveWei = await erc20Balance(dest, outputToken, FILLER_ADDRESS);
      const haveEth = Number(formatUnits(haveWei, 18));

      if (haveWei >= needWei) {
        log.info(
          {
            dest,
            haveEth: haveEth.toFixed(6),
            needEth: needEth.toFixed(6),
          },
          "🟢 ACTIONABLE"
        );

        // Optional: estimate exact fill gas (still no tx sent)
        const repaymentChainId = BigInt(origin); // common: repay on origin

        // Placeholder until you wire real V3FundsDeposited event data
        const relayData: RelayDataV3 = {
          depositor: "0x0000000000000000000000000000000000000000",
          recipient: "0x0000000000000000000000000000000000000000",
          inputToken,
          outputToken,
          inputAmount: 0n,
          outputAmount: needWei,
          originChainId: BigInt(origin),
          exclusiveRelayer: "0x0000000000000000000000000000000000000000",
          quoteTimestamp: 0,
          fillDeadline: 0,
          exclusivityDeadline: 0,
          message: "0x",
        };

        try {
          const est = await estimateFillGas(dest, relayData, repaymentChainId);
          log.info(
            {
              gas: est.gas.toString(),
              gasPriceGwei: est.gasPriceGwei.toFixed(2),
              costEth: est.costEth.toFixed(6),
            },
            "🔎 ESTIMATE ONLY"
          );
        } catch (e: any) {
          log.warn(
            { err: e?.message },
            "estimate failed (placeholder relayData)"
          );
        }
      } else {
        const shortEth = needEth - haveEth;
        log.info(
          {
            dest,
            haveEth: haveEth.toFixed(6),
            needEth: needEth.toFixed(6),
            shortEth: shortEth.toFixed(6),
          },
          "🔴 NEED TOP-UP"
        );
      }
    }
  }
}
