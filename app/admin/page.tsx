import Link from "next/link";
import { categories } from "@/lib/data";
import { fetchAllPrograms, fetchReports, fetchHelpRequests, fetchEventStats } from "@/lib/queries";
import { deleteProgram, dismissReport, logout, markHelpRequestContacted, markHelpRequestCompleted } from "./actions";

function isStale(dateStr?: string) {
  if (!dateStr) return false;
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return days > 180;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const { status, category, q } = await searchParams;

  const [programs, reports, helpRequests, eventStats] = await Promise.all([
    fetchAllPrograms(),
    fetchReports(),
    fetchHelpRequests(),
    fetchEventStats(30),
  ]);

  const published = programs.filter((p) => p.status === "published").length;

  // --- 프로그램 관리 필터링 ---
  let filtered = programs;
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (category) filtered = filtered.filter((p) => p.category === category);
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(qLower) || p.org.toLowerCase().includes(qLower)
    );
  }

  const grouped = categories
    .map((c) => ({ ...c, items: filtered.filter((p) => p.category === c.slug) }))
    .filter((g) => g.items.length > 0);

  const hasActiveFilter = Boolean(status || category || q);

  function buildHref(newStatus?: string) {
    const params = new URLSearchParams();
    if (newStatus) params.set("status", newStatus);
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/admin${qs ? `?${qs}` : ""}`;
  }

  const statusTabs: { key?: string; label: string }[] = [
    { key: undefined, label: `전체 (${programs.length})` },
    { key: "published", label: `게시됨 (${programs.filter((p) => p.status === "published").length})` },
    { key: "pending", label: `대기중 (${programs.filter((p) => p.status === "pending").length})` },
    { key: "rejected", label: `반려됨 (${programs.filter((p) => p.status === "rejected").length})` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">관리자 대시보드</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/community" className="text-xs text-sky-600 hover:underline">커뮤니티 관리</Link>
          <form action={logout}>
            <button className="text-xs text-neutral-400 hover:text-neutral-600">
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold">{published}</div>
          <div className="text-xs text-neutral-400 mt-1">게시된 프로그램</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold">{reports.length}</div>
          <div className="text-xs text-neutral-400 mt-1">대기중 제보</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold">{programs.length}</div>
          <div className="text-xs text-neutral-400 mt-1">전체 프로그램</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold">{helpRequests.length}</div>
          <div className="text-xs text-neutral-400 mt-1">도움 요청</div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">전환율 (최근 30일)</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold">{eventStats.cardClicks}</div>
              <div className="text-xs text-neutral-400 mt-1">카드 클릭</div>
            </div>
            <div>
              <div className="text-xl font-bold">{eventStats.pageViews}</div>
              <div className="text-xs text-neutral-400 mt-1">
                상세 조회
                {eventStats.viewRate !== null && (
                  <span className="text-emerald-600 ml-1">({eventStats.viewRate}%)</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xl font-bold">{eventStats.applyClicks}</div>
              <div className="text-xs text-neutral-400 mt-1">
                신청 클릭
                {eventStats.applyRate !== null && (
                  <span className="text-emerald-600 ml-1">({eventStats.applyRate}%)</span>
                )}
              </div>
            </div>
          </div>
          {eventStats.cardClicks === 0 && eventStats.pageViews === 0 && eventStats.applyClicks === 0 && (
            <p className="text-xs text-neutral-400 text-center mt-4">
              아직 집계된 이벤트가 없어요. 실사용자가 화면을 이용하면 여기 채워져요.
            </p>
          )}
          {eventStats.topPrograms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 mb-2">신청 클릭 상위 프로그램</p>
              <div className="space-y-1">
                {eventStats.topPrograms.map((tp) => (
                  <div key={tp.program_id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{tp.program_id}</span>
                    <span className="text-neutral-400">{tp.clicks}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500">프로그램 관리</h2>
          <Link
            href="/admin/programs/new"
            className="text-sm bg-emerald-600 text-white rounded-full px-4 py-1.5 hover:bg-emerald-700"
          >
            + 새 프로그램
          </Link>
        </div>

        {/* 상태별 탭 */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((t) => {
            const active = status === t.key || (!status && !t.key);
            return (
              <Link
                key={t.key || "all"}
                href={buildHref(t.key)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-neutral-800 text-white border-neutral-800"
                    : "border-neutral-300 text-neutral-500 hover:border-neutral-400"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* 검색 · 카테고리 필터 */}
        <form action="/admin" method="GET" className="flex gap-2 flex-wrap items-center">
          {status && <input type="hidden" name="status" value={status} />}
          <select
            name="category"
            defaultValue={category || ""}
            className="text-xs rounded-full border border-neutral-300 px-3 py-1.5 text-neutral-600"
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="프로그램명·기관명 검색"
            className="text-xs rounded-full border border-neutral-300 px-3 py-1.5 flex-1 min-w-[160px]"
          />
          <button
            type="submit"
            className="text-xs bg-neutral-800 text-white rounded-full px-3 py-1.5 hover:bg-neutral-900"
          >
            검색
          </button>
          {hasActiveFilter && (
            <Link href="/admin" className="text-xs text-neutral-400 hover:text-neutral-600">
              필터 초기화
            </Link>
          )}
        </form>

        {/* 카테고리별 그룹 */}
        <div className="space-y-3">
          {grouped.length === 0 && (
            <p className="text-sm text-neutral-400 p-5 text-center rounded-2xl border border-neutral-200 bg-white">
              조건에 맞는 프로그램이 없어요.
            </p>
          )}
          {grouped.map((g) => (
            <details
              key={g.slug}
              open={hasActiveFilter}
              className="rounded-2xl border border-neutral-200 bg-white overflow-hidden"
            >
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium flex items-center gap-2">
                <span>{g.emoji} {g.label}</span>
                <span className="text-xs text-neutral-400">({g.items.length})</span>
              </summary>
              <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                {g.items.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{p.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            p.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            p.org_type === "nonprofit"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {p.org_type === "nonprofit" ? "비영리" : "공공"}
                        </span>
                        {isStale(p.last_verified_at) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            확인 필요
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        {p.org} · 확인일 {p.last_verified_at}
                      </p>
                      {p.review_note && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-1">
                          검토 메모: {p.review_note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/programs/${p.id}/edit`}
                        className="text-xs text-neutral-500 hover:text-emerald-600"
                      >
                        수정
                      </Link>
                      <form action={deleteProgram}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-xs text-neutral-400 hover:text-red-500">
                          삭제
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">대기중인 제보</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {reports.length === 0 && (
            <p className="text-sm text-neutral-400 p-5 text-center">
              대기중인 제보가 없어요.
            </p>
          )}
          {reports.map((r) => (
            <div key={r.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-neutral-400">
                  {r.source_type === "link" ? "링크" : "직접입력"}
                </span>
                <p className="text-sm text-neutral-700 break-words">{r.content}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/programs/new?prefill=${encodeURIComponent(r.content)}`}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  등록하기
                </Link>
                <form action={dismissReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-neutral-400 hover:text-red-500">
                    닫기
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">🙋 도움 요청</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {helpRequests.length === 0 && (
            <p className="text-sm text-neutral-400 p-5 text-center">
              대기중인 도움 요청이 없어요.
            </p>
          )}
          {helpRequests.map((h) => (
            <div key={h.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{h.name}</span>
                  <span className="text-xs text-neutral-400">{h.contact}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      h.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {h.status === "pending" ? "대기중" : "연락함"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">프로그램: {h.program_id}</p>
                {h.message && (
                  <p className="text-sm text-neutral-700 break-words mt-1">{h.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {h.status === "pending" && (
                  <form action={markHelpRequestContacted}>
                    <input type="hidden" name="id" value={h.id} />
                    <button className="text-xs text-sky-600 hover:underline">연락함</button>
                  </form>
                )}
                <form action={markHelpRequestCompleted}>
                  <input type="hidden" name="id" value={h.id} />
                  <button className="text-xs text-neutral-400 hover:text-emerald-600">완료</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
