import { NextResponse } from "next/server";
import { getUploader } from "@/lib/alerts/uploader";

/** 공문 올리기 화면이 "이 사람이 올릴 수 있나"를 묻는 곳. */
export async function GET(request: Request) {
  const uploader = await getUploader(request);
  return NextResponse.json({ role: uploader?.role ?? null });
}
