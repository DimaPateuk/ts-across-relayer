import "dotenv/config";
import { quoteLoop } from "./runner/quoteLoop";

async function main() {
  await quoteLoop();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
