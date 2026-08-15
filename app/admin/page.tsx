import Link from "next/link";
import { categories } from "@/lib/data";
import { fetchAllPrograms, fetchReports } from "@/lib/queries";
import { fetchHelpRequests, fetchEventStats, fetchApplications } from "@/lib/queries-admin";
import { hasAdminKey } from "@/lib/supabase-admin";
import { deleteProgram, dismissReport, logout, markHelpRequestContacted, markHelpRequestCompleted, markApplicationContacted, markApplicationCompleted } from "./actions";

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

  const [programs, reports, helpRequests, eventStats, applications] = await Promise.all([
    fetchAllPrograms(),
    fetchReports(),
    fetchHelpRequests(),
    fetchEventStats(30),
    fetchApplications(),
  ]);

  const programTitle = new Map(programs.map((p) => [p.id, p.title]));
  const pendingApplications = applications.filter((a) => a.status !== "contacted" && a.status !== "completed").length;

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

      {!hasAdminKey && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">신청자 목록을 못 읽고 있어요</p>
          <p className="text-xs leading-relaxed text-amber-800 mt-1">
            신청자 이름·연락처는 아무나 못 보게 서버 전용 키로만 읽도록 해놨어요. 지금 그 키가 없어서
            신청·도움요청 목록이 비어 보입니다. Vercel 환경변수에{" "}
            <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> 를 넣고 다시 배포하면 보여요.
            (<code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_</code> 를 붙이면 안 됩니다 — 붙이면 브라우저로 새어나가요.)
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500">전환율 (최근 30일)</h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="grid grid-cols-4 gap-3 text-center">
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
            <div>
              <div className="text-xl font-bold">{eventStats.submissions}</div>
              <div className="text-xs text-neutral-400 mt-1">
                폼 제출
                {eventStats.submitRate !== null && (
                  <span className="text-emerald-600 ml-1">({eventStats.submitRate}%)</span>
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
                        {/* 링크가 기관 대문이면 청소년이 거기서 프로그램을 다시
                            찾아야 한다. 딥링크로 바꿔야 할 대상이라 목록에서
                            바로 보이게 한다(2026-08-15). */}
                        {p.link_kind === "info" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                            링크=기관 대문
                          </span>
                        )}
                        {/* 접수 방식(상시/기간)이 비어 있으면 홈 목록에 아예 안 뜬다 */}
                        {!p.enrollment_status && !p.apply_deadline && !p.reopen_note && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                            접수방식 미입력 · 홈 노출 안 됨
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

      {/* 신청(관심 등록) 목록.
          절대규칙 1에 따라 내부 화면이라도 낙인성 라벨은 달지 않는다 —
          프로그램명과 신청 시각만 보여주고, 어떤 조건에 해당하는 사람인지는
          집계하지도 표시하지도 않는다. */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500">📮 신청 (관심 등록)</h2>
          <span className="text-xs text-neutral-400">
            전체 {applications.length}건
            {pendingApplications > 0 && (
              <span className="text-amber-600 font-semibold ml-1.5">· 확인 안 한 게 {pendingApplications}건</span>
            )}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {applications.length === 0 && (
            <p className="text-sm text-neutral-400 p-5 text-center">
              {hasAdminKey
                ? "아직 신청이 없어요."
                : "서버 키가 없어서 못 읽고 있어요. 위 안내를 참고하세요."}
            </p>
          )}
          {applications.map((a) => (
            <div key={a.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{a.applicant_name}</span>
                  <span className="text-xs text-neutral-400">{a.applicant_contact}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      a.status === "contacted"
                        ? "bg-sky-100 text-sky-700"
                        : a.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status === "contacted" ? "연락함" : a.status === "completed" ? "완료" : "대기중"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {a.program_id ? programTitle.get(a.program_id) ?? a.program_id : "프로그램 미지정"}
                  <span className="mx-1.5">·</span>
                  {new Date(a.created_at).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.status !== "contacted" && a.status !== "completed" && (
                  <form action={markApplicationContacted}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-sky-600 hover:underline">연락함</button>
                  </form>
                )}
                {a.status !== "completed" && (
                  <form action={markApplicationCompleted}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-neutral-400 hover:text-emerald-600">완료</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
