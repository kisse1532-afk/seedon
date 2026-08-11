import { login } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-sm mx-auto py-16">
      <h1 className="text-lg font-bold mb-1">관리자 로그인</h1>
      <p className="text-xs text-neutral-400 mb-6">
        간단한 비밀번호 게이트예요. 실제 운영 전엔 정식 로그인으로 교체가 필요해요.
      </p>
      <form action={login} className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          required
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {error && (
          <p className="text-xs text-red-500">비밀번호가 맞지 않아요.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-2.5 hover:bg-emerald-700"
        >
          입장하기
        </button>
      </form>
    </div>
  );
}
