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
        className="text-sm text-neutral-400 hover:text-neutral-600"
      >
        ← 뒤로
      </Link>

      <div className="relative rounded-lg border border-sage-border bg-white p-5 space-y-2">
        <BookmarkButton
          programId={program.id}
          className="absolute top-5 right-5 text-neutral-300 hover:text-primary-deep"
        />
        <div className="flex items-center gap-1.5 pr-8 flex-wrap">
          <h1 className="font-semibold text-lg">{program.title}</h1>
          {program.org_type && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                program.org_type === "public"
                  ? "bg-mint text-ink"
                  : "bg-brand-border/60 text-ink-60"
              }`}
            >
              {program.org_type === "public" ? "공공" : "비영리"}
            </span>
          )}
          <EnrollmentBadge program={program} />
        </div>
        <p className="text-xs text-neutral-400">{program.org}</p>
        <p className="text-sm text-neutral-600">{program.description}</p>
      </div>

      {program.apply_steps && <ApplySteps steps={program.apply_steps} />}

      <div className="rounded-lg border border-primary/30 bg-mint p-5 space-y-2">
        <h2 className="font-medium text-sm text-ink">✅ 이렇게 신청하세요</h2>
        {program.apply_method && (
          <p className="text-sm text-body">{program.apply_method}</p>
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
              className="text-xs border border-primary-deep/40 text-primary-deep rounded-lg px-4 py-1.5 hover:bg-mint"
            >
              📞 {program.phone}
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

      <form action={submit} className="rounded-lg border border-sage-border bg-white p-5 space-y-4">
        <div>
          <h2 className="font-medium text-sm mb-1">이 프로그램 관심 등록</h2>
          <p className="text-xs text-neutral-400">
            신청을 대신 처리해드리진 않지만, 남겨주시면 씨드온이 관련 소식이나
            다음 단계 프로그램을 챙겨드려요.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="text-xs text-neutral-500">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="이름을 입력해주세요"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="contact" className="text-xs text-neutral-500">연락처</label>
          <input
            id="contact"
            name="contact"
            type="tel"
            required
            className="w-full rounded-lg border border-sage-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="010-0000-0000"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-800 text-white text-sm font-medium py-3 hover:bg-neutral-900"
        >
          관심 등록하기
        </button>

        <p className="text-[11px] text-neutral-400 text-center">
          입력하신 정보는 씨드온이 소식 전달 목적으로만 사용하고, 처리가 끝나면
          일정 기간 뒤 삭제해요. 실제 신청은 위 &apos;이렇게 신청하세요&apos;
          안내를 따라 직접 진행해주세요.
        </p>
      </form>
    </div>
  );
}
