/**
 * 관리자 로그인 증표(세션 쿠키)를 만들고 확인한다.
 *
 * 쿠키 값은 "만료시각.서명"이다. 서명은 서버만 아는 ADMIN_SESSION_SECRET으로
 * 만든 HMAC이라, 값을 지어내거나 만료시각을 늘리면 확인에서 떨어진다.
 *
 * middleware(Edge)와 서버(Node), 시험에서 같이 쓰므로 Web Crypto만 쓰고
 * next/* 를 불러오지 않는다. 비교는 crypto.subtle.verify에 맡긴다(일정 시간 비교).
 *
 * 환경변수가 없거나 너무 짧으면 아무도 들어올 수 없다. 기본값을 두지 않는다.
 */
export const ADMIN_COOKIE = "seedon_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();
const message = (expires: string) => encoder.encode(`seedon-admin:v1:${expires}`);

function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

/** 로그인에 필요한 환경변수가 다 있는지. */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && sessionSecret());
}

/** 입력한 비밀번호가 ADMIN_PASSWORD와 같은지. 길이·앞글자가 시간으로 새지 않게 서명끼리 비교한다. */
export async function isAdminPassword(input: unknown): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  const secret = sessionSecret();
  if (!password || !secret || typeof input !== "string") return false;
  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(password));
  return crypto.subtle.verify("HMAC", key, expected, encoder.encode(input));
}

/** 비밀번호를 맞게 넣은 직후에만 부른다. 설정이 없으면 null. */
export async function createAdminToken(now = Date.now()): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = String(Math.floor(now / 1000) + ADMIN_SESSION_SECONDS);
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), message(expires));
  const hex = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${expires}.${hex}`;
}

export async function isValidAdminToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const secret = sessionSecret();
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(token ?? "");
  if (!secret || !match) return false;
  const [, expires, hex] = match;
  if (Number(expires) <= now / 1000) return false;
  const signature = Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16));
  return crypto.subtle.verify("HMAC", await hmacKey(secret), signature, message(expires));
}
