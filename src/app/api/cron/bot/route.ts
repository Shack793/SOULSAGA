import { NextRequest, NextResponse } from "next/server";
import { runDaily } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily bot trigger for any cron service:  curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite/api/cron/bot
 * Runs one article, two questions, answers to unanswered topics, reader reflections and social sharing.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ report: await runDaily() });
}
