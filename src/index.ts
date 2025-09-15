import "dotenv/config";
import { quoteLoop } from "./runner/quoteLoop";

async function main() {
  let inProgress = false;
  setInterval(() => {
    if (inProgress) {
      return;
    }

    inProgress = true;

    quoteLoop()
      .then(() => {
        inProgress = false;
      })
      .catch(() => {
        inProgress = false;
      });
  }, 5000);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
