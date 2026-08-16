import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProgram } from "@/lib/queries";
import TrackedLink from "@/app/_components/TrackedLink";
import BookmarkButton from "@/app/_components/BookmarkButton";
import EnrollmentBadge from "@/app/_components/EnrollmentBadge";
import PhoneLink from "@/app/_components/PhoneLink";
import { submitHelpRequest } from "./actions";
import ApplySteps from "./ApplySteps";
import HelpChatbot from "./HelpChatbot";
import InterestForm from "./InterestForm";
import Reviews from "./Reviews";
import TrackPageView from "@/app/_components/TrackPageView";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await fetchProgram(programId);
  if (!program) return notFound();

  const submitHelp = submitHelpRequest.bind(null, programId);

  // 번호로 시작하는 값만 실제 전화번호로 본다. "1544-3412", "120 (다산콜센터)"는
  // 걸리고, "학교 진로진학상담교사에게 문의" 같은 안내문은 걸리지 않는다.
  const phoneNumber = program.phone?.match(/^\d[\d-]{2,}/)?.[0];

  // 링크가 기관 대문이라 거기서 더 찾아야 하는 경우.
  const isInfoLink = program.link_kind === "info";

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* 조회 기록은 브라우저에서 남긴다 — 봇·링크 미리보기까지 세지 않기 위해서 */}
      <TrackPageView programId={program.id} category={program.category} />
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
        {/* 링크가 기관 대문일 때는 그렇다고 미리 말해준다. "신청하기"라고 해놓고
            재단 홈으로 보내면 청소년이 거기서 프로그램을 처음부터 다시 찾게 된다
            (2026-08-15 로드 지적). 기대를 먼저 맞춰주면 헛걸음이 줄어든다. */}
        {isInfoLink && (
          <p className="rounded-xl bg-white/70 px-3.5 py-2.5 text-xs leading-relaxed text-ink-60">
            아래 버튼은 기관 홈페이지로 가요. 이 프로그램만 따로 있는 신청
            페이지는 아직 못 찾았어요 — 위에 적힌 방법대로 하는 게 제일 빨라요.
          </p>
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
              className="rounded-xl bg-cta px-4 py-2 text-xs font-bold text-dark-surface transition hover:brightness-105"
            >
              {isInfoLink
                ? "기관 홈페이지 열기 ↗"
                : program.apply_link_label || "공식 페이지 바로가기 ↗"}
            </TrackedLink>
          )}
          {/* phone 칸에는 실제 번호("1544-3412")도 있지만 안내문("학교 진로진학상담
              교사에게 문의")이 들어 있는 프로그램도 있다. 안내문에까지 전화 링크를
              걸면 눌러도 아무 일이 없어 청소년이 고장난 줄 안다. 번호로 시작하는
              것만 걸 수 있는 링크로 만들고, 나머지는 글로만 안내한다. */}
          {phoneNumber ? (
            <PhoneLink
              number={phoneNumber}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-deep/40 px-4 py-2 text-xs font-semibold text-primary-deep transition hover:bg-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M6.3 4.5h3l1.5 3.7-1.9 1.1a10.4 10.4 0 0 0 4.8 4.8l1.1-1.9 3.7 1.5v3a1.8 1.8 0 0 1-2 1.8A14.6 14.6 0 0 1 4.5 6.5a1.8 1.8 0 0 1 1.8-2Z" />
              </svg>
              {program.phone}
            </PhoneLink>
          ) : (
            program.phone && (
              <p className="w-full text-xs leading-relaxed text-ink-60">
                문의: {program.phone}
              </p>
            )
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

      <Reviews programId={program.id} />

      <InterestForm programId={program.id} />
    </div>
  );
}
