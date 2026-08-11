import Link from "next/link";
import { fetchProgramsWithPhone } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";

export default async function ThemePhonePage() {
  const items = await fetchProgramsWithPhone();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
          ← 홈으로
        </Link>
        <h1 className="text-xl font-bold mt-2">📞 전화 한 통이면 돼요</h1>
        <p className="text-sm text-neutral-500 mt-1">
          온라인 신청이 어렵거나 복잡하게 느껴진다면, 전화로 바로 문의할 수 있는 프로그램만 모았어요.
        </p>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="text-sm text-neutral-400 py-8 text-center">
            아직 전화 문의가 가능한 프로그램이 등록되지 않았어요.
          </p>
        )}
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold">{p.title}</h3>
                  {p.org_type && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        p.org_type === "public"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {p.org_type === "public" ? "공공" : "비영리"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">{p.org}</p>
              </div>
              {p.last_verified_at && (
                <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                  ✓ {p.last_verified_at} 확인
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-600">{p.description}</p>
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <a
                href={`tel:${p.phone?.replace(/[^0-9]/g, "")}`}
                className="text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 hover:bg-emerald-100"
              >
                📞 {p.phone}
              </a>
              <TrackedLink
                href={`/apply/${p.id}`}
                event="category_card_click"
                programId={p.id}
                category={p.category}
                className="text-sm font-medium bg-emerald-600 text-white rounded-full px-4 py-1.5 hover:bg-emerald-700"
              >
                신청 알아보기 →
              </TrackedLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
