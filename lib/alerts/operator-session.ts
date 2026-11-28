import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 「맞춤 알림」 도구에서 운영자를 알아보는 서명 쿠키.
 *
 * 왜 따로 두나: 기존 관리자 쿠키(seedon_admin=ok)는 값이 고정이라 누구나 브라우저에서
 * 만들어 넣을 수 있다. 공문 게시와 선생님 초대는 학생 화면에 바로 나가는 일이라
 * 그 쿠키만 믿지 않고, 비밀번호를 맞게 넣었을 때만 만들 수 있는 서명을 확인한다.
 *
 * ADMIN_PASSWORD가 없으면(코드에 적힌 기본 비밀번호로 도는 상태) 서명을 만들지
 * 않는다 — 누구나 아는 비밀번호로 선생님 초대를 열 수는 없다.
 */
const COOKIE = "seedon_operator";
const WEEK = 60 * 60 * 24 * 7;

function secret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return `${password}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`;
}

const sign = (expires: string, key: string) =>
  createHmac("sha256", key).update(`seedon-operator:${expires}`).digest("hex");

/** 관리자 로그인에 성공한 직후에만 부른다. */
export async function startOperatorSession(): Promise<void> {
  const key = secret();
  if (!key) return;
  const expires = String(Math.floor(Date.now() / 1000) + WEEK);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: WEEK,
    path: "/",
  });
}

export async function isOperator(): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const [expires, signature] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  const expected = Buffer.from(sign(expires, key));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
