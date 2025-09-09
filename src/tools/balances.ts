import "dotenv/config";
import { formatUnits, getAddress } from "viem";

import { getPublic } from "../clients/public";
import { erc20Balance } from "../tokens/erc20";
import { CHAINS, WETH, FILLER_ADDRESS } from "../config/chains";
import { chainFromId } from "../config/chains";
const CHAINS_WITH_NAMES = CHAINS.map((id) => ({
  id,
  name: chainFromId(id).name,
}));
async function run() {
  const addr = getAddress(FILLER_ADDRESS);
  console.log(`Filler address: ${addr}\n`);

  for (const { id, name } of CHAINS_WITH_NAMES) {
    const pub = getPublic(id);

    const ethWei = await pub.getBalance({ address: addr });
    const eth = Number(formatUnits(ethWei, 18));

    const wethAddr = WETH[id];
    const wethWei = await erc20Balance(id, wethAddr, addr);
    const weth = Number(formatUnits(wethWei, 18));

    console.log(
      `${name.padEnd(12)} | ETH: ${eth.toFixed(6).padStart(10)}  | WETH: ${weth
        .toFixed(6)
        .padStart(10)}  | WETH token: ${wethAddr}`
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
