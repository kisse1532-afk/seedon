import { NextResponse } from "next/server";
import { runDailyAlerts } from "@/lib/alerts/notify";

/**
 * 하루 한 번 도는 「맞춤 알림」 작업. 아직 켜지 않았다 — 켜는 법은 vercel.json.example.
 *
 * CRON_SECRET이 없으면 아무도 못 부른다. Vercel은 이 환경변수가 있으면 예약 실행 때
 * `Authorization: Bearer <값>`을 알아서 붙인다.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDailyAlerts();
    return NextResponse.json(result, { status: result.failed ? 500 : 200 });
  } catch (e) {
    console.error("[cron/alerts] failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
