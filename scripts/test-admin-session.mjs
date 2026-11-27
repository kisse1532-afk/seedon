// 관리자 로그인 시험
//   node scripts/test-admin-session.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  ADMIN_SESSION_SECONDS,
  createAdminToken,
  isAdminConfigured,
  isAdminPassword,
  isValidAdminToken,
} from "../lib/admin-session.ts";

const SECRET = "test-only-secret-0123456789abcdefghij";
const setEnv = (password = "test-password", secret = SECRET) => {
  for (const [name, value] of [["ADMIN_PASSWORD", password], ["ADMIN_SESSION_SECRET", secret]]) {
    if (value === null) delete process.env[name];
    else process.env[name] = value;
  }
};

test("맞는 비밀번호로 만든 증표는 통과한다", async () => {
  setEnv();
  assert.equal(await isAdminPassword("test-password"), true);
  assert.equal(await isValidAdminToken(await createAdminToken()), true);
});

test("틀린 비밀번호는 거절한다", async () => {
  setEnv();
  for (const input of ["", "test-passwor", "test-password ", "seedon", null]) {
    assert.equal(await isAdminPassword(input), false, String(input));
  }
});

test("지어낸 쿠키는 거절한다", async () => {
  setEnv();
  const [expires, signature] = (await createAdminToken()).split(".");
  const later = String(Number(expires) + 1000);
  const flipped = (signature[0] === "0" ? "1" : "0") + signature.slice(1);
  for (const forged of [
    undefined,
    "",
    "ok",
    "true",
    expires,
    `${expires}.`,
    `${expires}.${"0".repeat(64)}`,
    `${expires}.${flipped}`,
    `${later}.${signature}`, // 만료시각만 늘리기
    `${expires}.${signature}.x`,
  ]) {
    assert.equal(await isValidAdminToken(forged), false, String(forged));
  }
});

test("다른 비밀 값으로 서명한 쿠키는 거절한다", async () => {
  setEnv("test-password", "another-secret-0123456789abcdefghijk");
  const token = await createAdminToken();
  setEnv();
  assert.equal(await isValidAdminToken(token), false);
});

test("만료된 쿠키는 거절한다", async () => {
  setEnv();
  const now = Date.now();
  const token = await createAdminToken(now);
  assert.equal(await isValidAdminToken(token, now + (ADMIN_SESSION_SECONDS - 5) * 1000), true);
  assert.equal(await isValidAdminToken(token, now + (ADMIN_SESSION_SECONDS + 1) * 1000), false);
});

test("환경변수가 없거나 짧으면 아무도 못 들어온다", async () => {
  setEnv();
  const token = await createAdminToken();
  for (const secret of [null, "", "short"]) {
    setEnv("test-password", secret);
    assert.equal(isAdminConfigured(), false);
    assert.equal(await createAdminToken(), null);
    assert.equal(await isValidAdminToken(token), false);
    assert.equal(await isAdminPassword("test-password"), false);
  }
  setEnv(null);
  assert.equal(isAdminConfigured(), false);
  assert.equal(await isAdminPassword("seedon2026"), false); // 예전 기본값
});

/* 새 관리자 화면·액션을 만들면서 확인을 빠뜨리면 여기서 걸린다. */
test("모든 관리자 화면·액션·API가 서버에서 로그인을 확인한다", () => {
  const root = fileURLToPath(new URL("../app/admin/", import.meta.url));
  const missing = [];
  let checked = 0;
  for (const path of readdirSync(root, { recursive: true })) {
    const file = path.replaceAll("\\", "/");
    if (file.startsWith("login/") || !/(^|\/)(page\.tsx|actions\.ts|route\.ts)$/.test(file)) continue;
    const source = readFileSync(join(root, file), "utf8");
    for (const block of source.split(/^export (?:default )?(?=async function|function|const)/m).slice(1)) {
      const name = /(?:function|const)\s+(\w+)/.exec(block)?.[1];
      if (name === "logout" || /^(dynamic|metadata|revalidate|maxDuration|runtime)$/.test(name)) continue;
      checked++;
      if (!block.includes("await requireAdmin();")) missing.push(`${file}: ${name}`);
    }
  }
  assert.ok(checked >= 20, `검사한 함수 ${checked}개`);
  assert.deepEqual(missing, []);
});
