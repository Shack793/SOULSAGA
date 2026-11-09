// Run from cron on a VPS:  0 6 * * *  cd /path/to/soulsaga && npx tsx scripts/daily-bot.ts
import "dotenv/config";
import { runDaily } from "../src/lib/bot";

runDaily().then((r) => { console.log(r.join("\n")); process.exit(0); });
