import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * 관리자 화면에서만 쓰는 서버 전용 Supabase 클라이언트.
 *
 * 왜 따로 두는가: 신청자·도움요청에는 청소년의 이름과 연락처가 들어간다.
 * 공개 키(anon)는 브라우저에 그대로 노출되는 키라, RLS를 `using(true)`로
 * 열어두면 누구나 그 명단을 읽을 수 있다. 실제로 help_requests가 그 상태였다.
 *
 * 그래서 개인정보가 든 표는 RLS를 열지 않고, RLS를 우회하는 service_role 키로
 * 서버에서만 읽는다. 이 파일은 "server-only"라서 클라이언트 번들에 섞이면
 * 빌드가 실패한다 — 키가 브라우저로 새어나가는 걸 막는 안전장치다.
 *
 * SUPABASE_SERVICE_ROLE_KEY는 Vercel 환경변수에 넣어야 한다.
 * (NEXT_PUBLIC_ 접두사를 붙이면 안 된다. 붙이는 순간 브라우저로 나간다.)
 */

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ssxxqiwlywcgmgkdgmtz.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 서버 키가 준비돼 있는지. 화면에서 안내를 띄우는 데 쓴다. */
export const hasAdminKey = Boolean(serviceKey);

export const supabaseAdmin = serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
