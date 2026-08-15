import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProgram } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";
import { submitApplication, submitHelpRequest } from "./actions";
import ApplySteps from "./ApplySteps";
import HelpChatbot from "./HelpChatbot";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await fetchProgram(programId);
  if (!program) return notFound();

  // 상세페이지 조회 이벤트 기록 (서버 렌더링 시점, 실패해도 페이지 렌더링엔 영향 없음)
  supabase
    .from("program_events")
    .insert({ event_type: "apply_page_view", program_id: programId, category: program.category })
    .then(() => {});

  const submit = submitApplication.bind(null, programId);
  const submitHelp = submitHelpRequest.bind(null, programId);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        href={`/category/${program.category}`}
        className="text-[13px] font-medium text-meta transition hover:text-ink"
      >
        ← 뒤로
      </Link>

      <div className="relative space-y-2 rounded-card border border-sage-border bg-white p-5">
        <BookmarkButton
          programId={program.id}
          className="absolute top-5 right-5 text-sage-border hover:text-primary-deep"
        />
        <div className="flex flex-wrap items-center gap-1.5 pr-8">
          <h1 className="text-lg font-extrabold tracking-tight text-ink">{program.title}</h1>
          {program.org_type && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                program.org_type === "public"
                  ? "bg-mint text-primary-deep"
                  : "bg-brand-border/60 text-ink-60"
              }`}
            >
              {program.org_type === "public" ? "공공" : "비영리"}
            </span>
          )}
          <EnrollmentBadge program={program} />
        </div>
        <p className="text-xs text-meta">{program.org}</p>
        <p className="text-sm leading-relaxed text-body">{program.description}</p>
      </div>

      {program.apply_steps && <ApplySteps steps={program.apply_steps} />}

      <div className="space-y-2 rounded-card border border-primary/30 bg-mint p-5">
        <h2 className="text-sm font-bold text-primary-deep">이렇게 신청하세요</h2>
        {program.apply_method && (
          <p className="text-sm leading-relaxed text-body">{program.apply_method}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {program.link && (
            <TrackedLink
              href={program.link}
              event="apply_link_click"
              programId={program.id}
              category={program.category}
              external
              // CTA 색(#FFAE6B)은 브랜드 규칙상 화면당 하나만 쓴다.
              // 이 화면에서 실제 신청으로 넘어가는 버튼이 여기 하나뿐이라 여기에 배정.
              className="text-xs font-bold bg-cta text-dark-surface rounded-lg px-4 py-1.5 hover:opacity-90 transition-opacity"
            >
              {program.apply_link_label || "공식 페이지 바로가기 ↗"}
            </TrackedLink>
          )}
          {program.phone && (
            <a
              href={`tel:${program.phone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-deep/40 px-4 py-2 text-xs font-semibold text-primary-deep transition hover:bg-white"
            >
              {program.phone}
            </a>
          )}
        </div>
      </div>

      <HelpChatbot
        programTitle={program.title}
        description={program.description}
        applyMethod={program.apply_method ?? null}
        applySteps={program.apply_steps ?? null}
        submitHelp={submitHelp}
      />

      <form action={submit} className="space-y-4 rounded-card border border-sage-border bg-white p-5">
        <div>
          <h2 className="mb-1 text-sm font-bold text-ink">이 프로그램 관심 등록</h2>
          <p className="text-xs leading-relaxed text-ink-60">
            신청을 대신 처리해드리진 않지만, 남겨주시면 씨드온이 관련 소식이나
            다음 단계 프로그램을 챙겨드려요.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-semibold text-ink-60">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-neutral-400"
            placeholder="이름을 입력해주세요"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact" className="text-xs font-semibold text-ink-60">연락처</label>
          <input
            id="contact"
            name="contact"
            type="tel"
            required
            className="w-full rounded-control border border-sage-border px-4 py-3 text-sm text-body transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-neutral-400"
            placeholder="010-0000-0000"
          />
        </div>

        {/* 이 버튼만 검정(neutral-800)이라 브랜드 밖으로 튀어 있었다.
            신청 자체는 위 CTA에서 하고 여기는 부수 동작이므로, 눈에 덜 띄는
            테두리 버튼으로 두되 색은 브랜드 안에서 쓴다. */}
        <button
          type="submit"
          className="w-full rounded-control border border-primary-deep bg-white py-3.5 text-sm font-bold text-primary-deep transition hover:bg-mint"
        >
          관심 등록하기
        </button>

        <p className="text-center text-[11px] leading-relaxed text-meta">
          입력하신 정보는 씨드온이 소식 전달 목적으로만 사용하고, 처리가 끝나면
          일정 기간 뒤 삭제해요. 실제 신청은 위 &apos;이렇게 신청하세요&apos;
          안내를 따라 직접 진행해주세요.
        </p>
      </form>
    </div>
  );
}
