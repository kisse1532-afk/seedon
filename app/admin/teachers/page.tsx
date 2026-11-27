import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isOperator } from "@/lib/alerts/operator-session";
import { inviteTeacher, revokeTeacher } from "./actions";

const MESSAGES: Record<string, string> = {
  ok: "초대했어요. 선생님이 로그인한 뒤 seedon.vercel.app/notices 를 열면 돼요.",
  none: "그 아이디로 가입한 계정이 없어요. 선생님이 먼저 가입해야 해요.",
  fail: "저장하지 못했어요. 서버 키와 DB 설정(마이그레이션)을 확인해주세요.",
  auth: "관리자에서 로그아웃한 뒤 다시 로그인해주세요.",
};

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const operator = await isOperator();

  const { data: teachers, error } =
    operator && supabaseAdmin
      ? await supabaseAdmin
          .from("teachers")
          .select("user_id, login_id, invited_at")
          .is("revoked_at", null)
          .order("invited_at", { ascending: false })
      : { data: null, error: null };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href="/admin" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 관리자 홈
      </Link>
      <h1 className="text-lg font-bold">선생님 초대</h1>
      <p className="text-xs leading-relaxed text-neutral-500">
        초대한 선생님은 공문을 올려 <b>학생에게 바로 보이는 카드를 게시</b>할 수 있어요. 실제로 아는 선생님의 아이디만
        넣어주세요.
      </p>

      {msg && MESSAGES[msg] && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{MESSAGES[msg]}</p>
      )}

      {!operator ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          선생님을 초대하려면 관리자에서 <b>로그아웃했다가 다시 로그인</b>해주세요. 그래도 이 안내가 보이면 Vercel
          환경변수 <code>ADMIN_PASSWORD</code>가 없는 거예요.
        </p>
      ) : (
        <>
          <form action={inviteTeacher} className="flex gap-2">
            <input
              name="login_id"
              required
              placeholder="선생님 아이디 또는 이메일"
              className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm"
            />
            <button className="rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white">초대</button>
          </form>

          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
            {error && <p className="p-4 text-sm text-neutral-500">{MESSAGES.fail}</p>}
            {!error && !teachers?.length && <p className="p-4 text-sm text-neutral-400">아직 초대한 선생님이 없어요.</p>}
            {teachers?.map((t) => (
              <div key={t.user_id} className="flex items-center justify-between gap-3 p-4">
                <span className="truncate text-sm">{t.login_id}</span>
                <form action={revokeTeacher}>
                  <input type="hidden" name="user_id" value={t.user_id} />
                  <button className="text-xs text-neutral-400 hover:text-red-500">초대 거두기</button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
