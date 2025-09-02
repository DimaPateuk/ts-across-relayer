import {
  parseEther,
  formatUnits,
  http,
  createWalletClient,
  createPublicClient,
} from "viem";
import pino from "pino";
import { privateKeyToAccount } from "viem/accounts";
import {
  AMOUNT_ETH,
  CHAINS,
  TARGET_DEST,
  WETH,
  client,
  FILLER_ADDRESS,
  MIN_PROFIT_ETH,
  GAS_PRICE_CAP_GWEI,
  GAS_SAFETY_MULT,
} from "../config/chains";
import { erc20Balance } from "../tokens/erc20";
import { analyzeQuote } from "../profit/analyze";
import { fetchLatestRelayData } from "../across/fetchRelayData";
import { SPOKE_POOL, SPOKE_ABI } from "../across/estimator";

const log = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "HH:MM:ss", singleLine: false },
  },
});

function getRpc(chainId: number): string {
  switch (chainId) {
    case 1:
      return process.env.ETHEREUM_RPC!;
    case 42161:
      return process.env.ARBITRUM_RPC!;
    case 10:
      return process.env.OPTIMISM_RPC!;
    default:
      throw new Error(`No RPC for chain ${chainId}`);
  }
}

export async function quoteLoop() {
  for (const origin of CHAINS) {
    for (const dest of CHAINS) {
      if (origin === dest) continue;
      if (dest !== TARGET_DEST) continue; // focus on one destination while testing

      const inputToken = WETH[origin];
      const outputToken = WETH[dest];

      // 1) Get a quote for the configured test amount
      const quote = await client.getQuote({
        route: {
          originChainId: origin,
          destinationChainId: dest,
          inputToken,
          outputToken,
        },
        inputAmount: parseEther(AMOUNT_ETH),
      });

      log.info(
        {
          origin,
          dest,
          out: quote.deposit.outputAmount.toString(),
          feeWei: quote.fees.totalRelayFee.total.toString(),
        },
        "quote"
      );

      // 2) How much WETH needed on dest
      const needWei = quote.deposit.outputAmount;
      const needEth = Number(formatUnits(needWei, 18));
      log.info({ origin, dest, needEth: needEth.toFixed(6) }, "✅ READY");

      // 3) Check your filler’s balance
      const haveWei = await erc20Balance(dest, outputToken, FILLER_ADDRESS);
      const haveEth = Number(formatUnits(haveWei, 18));

      if (haveWei < needWei) {
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
        continue;
      }

      log.info(
        { dest, haveEth: haveEth.toFixed(6), needEth: needEth.toFixed(6) },
        "🟢 ACTIONABLE"
      );

      // 4) Fetch real relayData from a recent deposit
      const relayData = await fetchLatestRelayData();
      if (!relayData) {
        log.warn("No recent deposits found, skipping...");
        continue;
      }

      const repaymentChainId = BigInt(origin);

      // 5) Profit analysis (exact gas estimate, safety, gas cap)
      let exact: {
        blockedByGasCap: boolean;
        gas: bigint;
        gasPriceGwei: number;
        feeEth: number;
        costEth: number;
        profitEth: number;
        minProfitEth: number;
      } | null = null;

      try {
        exact = await analyzeQuote(
          dest,
          relayData,
          repaymentChainId,
          quote.fees.totalRelayFee.total
        );

        if (exact.blockedByGasCap) {
          log.info(
            {
              dest,
              gasPriceGwei: exact.gasPriceGwei.toFixed(2),
              cap: GAS_PRICE_CAP_GWEI,
            },
            "⛽️ GAS-CAP BLOCK"
          );
          continue;
        }

        log.info(
          {
            gas: exact.gas.toString(),
            gasPriceGwei: exact.gasPriceGwei.toFixed(2),
            feeEth: exact.feeEth.toFixed(6),
            costEthBuffered: exact.costEth.toFixed(6),
            profitEth: exact.profitEth.toFixed(6),
            minProfitEth: MIN_PROFIT_ETH,
          },
          "🔎 EXACT ESTIMATE (REAL DEPOSIT)"
        );

        if (exact.profitEth < MIN_PROFIT_ETH) {
          log.info(
            {
              profitEth: exact.profitEth.toFixed(6),
              minProfitEth: MIN_PROFIT_ETH,
            },
            "🚫 SKIP: profit below minimum"
          );
          continue;
        }
      } catch (e: any) {
        log.warn({ err: e?.message }, "exact estimate failed");
        continue;
      }

      // 6) Simulate before sending to avoid gas loss if already filled
      const pk = process.env.FILLER_PK;
      if (!pk) throw new Error("FILLER_PK missing in .env");
      const account = privateKeyToAccount(pk as `0x${string}`);
      const rpcUrl = getRpc(dest);

      const pub = createPublicClient({
        chain: {
          id: dest,
          name: `chain-${dest}`,
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } },
        },
        transport: http(rpcUrl),
      });

      try {
        await pub.simulateContract({
          address: SPOKE_POOL[dest],
          abi: SPOKE_ABI,
          functionName: "fillV3Relay",
          args: [relayData, repaymentChainId],
          account: account.address,
        });
      } catch (simErr: any) {
        log.warn({ err: simErr?.message }, "⏭️ simulation failed, skipping tx");
        continue; // skip sending if simulation reverts
      }

      // 7) Send the fill transaction (with a small gas buffer)
      const wallet = createWalletClient({
        account,
        chain: {
          id: dest,
          name: `chain-${dest}`,
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } },
        },
        transport: http(rpcUrl),
      });

      log.info("✅ PROFITABLE — simulation passed, sending fill tx...");

      try {
        const txHash = await wallet.writeContract({
          address: SPOKE_POOL[dest],
          abi: SPOKE_ABI,
          functionName: "fillV3Relay",
          args: [relayData, repaymentChainId],
          gas: BigInt(Math.floor(Number(exact!.gas) * GAS_SAFETY_MULT)),
        });

        log.info({ txHash }, "🎉 Fill transaction sent");
      } catch (err: any) {
        log.error({ err: err?.message }, "❌ Fill tx failed");
      }
    }
  }
}
