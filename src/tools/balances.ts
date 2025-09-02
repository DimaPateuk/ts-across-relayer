import "dotenv/config";
import { formatUnits, getAddress } from "viem";
import { mainnet, arbitrum, optimism } from "viem/chains";

import { getPublic } from "../clients/public";
import { WETH, FILLER_ADDRESS } from "../config/chains";
import { erc20Balance } from "../tokens/erc20";

const CHAINS = [
  { id: mainnet.id, name: "Ethereum" },
  { id: arbitrum.id, name: "Arbitrum" },
  { id: optimism.id, name: "Optimism" },
];

async function run() {
  const addr = getAddress(FILLER_ADDRESS);
  console.log(`Filler address: ${addr}\n`);

  for (const { id, name } of CHAINS) {
    const pub = getPublic(id);

    // Native ETH balance
    const ethWei = await pub.getBalance({ address: addr });
    const eth = Number(formatUnits(ethWei, 18));

    // WETH (ERC-20) balance
    const wethAddr = WETH[id];
    const wethWei = await erc20Balance(id, wethAddr, addr);
    const weth = Number(formatUnits(wethWei, 18));

    console.log(
      `${name.padEnd(9)} | ETH: ${eth.toFixed(6).padStart(10)}  | WETH: ${weth
        .toFixed(6)
        .padStart(10)}  | WETH token: ${wethAddr}`
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
