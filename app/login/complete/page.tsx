import Link from "next/link";

export default function LoginCompletePage() {
  return (
    <div className="max-w-sm mx-auto text-center py-20 space-y-5">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-emerald-500 mx-auto flex items-center justify-center text-white text-2xl">✓</div>
      <div>
        <h1 className="text-lg font-semibold">가입이 완료됐어요!</h1>
        <p className="text-sm text-neutral-500 mt-1">이제 씨드온을 시작할 준비가 됐어요.</p>
      </div>
      <Link
        href="/mypage"
        className="inline-block w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-3 hover:bg-emerald-700"
      >
        마이페이지로 가기
      </Link>
      <Link href="/" className="block text-xs text-neutral-400 hover:text-neutral-600">
        홈으로
      </Link>
    </div>
  );
}
