import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProgram } from "@/lib/queries";
import { kstToday } from "@/lib/alerts/options";
import { notificationBody, NOTIFICATION_TITLE } from "@/lib/alerts/notify-text";
import { isShareable, shareClosed } from "@/lib/alerts/share";
import NoticeFacts from "@/app/apply/[programId]/NoticeFacts";

/**
 * 학생이 어른에게 보낸 「쉬운 안내」 — 읽기만 하는 화면.
 *
 * 카드 번호 말고는 아무것도 받지 않는다. 로그인·학생 설정을 읽지 않으므로 누가
 * 열어도 같은 화면이다.
 */
type Props = { params: Promise<{ programId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { programId } = await params;
  const program = await fetchProgram(programId);
  if (!program || !isShareable(program)) return { robots: { index: false, follow: false } };

  // 메신저 미리보기는 옆 사람도 본다.
  const title = notificationBody(program.title);
  return {
    title,
    description: NOTIFICATION_TITLE,
    robots: { index: false, follow: false },
    openGraph: { title, description: NOTIFICATION_TITLE, url: `/share/${program.id}` },
    twitter: { title, description: NOTIFICATION_TITLE },
  };
}

export default async function SharePage({ params }: Props) {
  const { programId } = await params;
  const program = await fetchProgram(programId);
  if (!program || !isShareable(program)) return notFound();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="rounded-xl bg-mint px-4 py-3 text-sm leading-relaxed text-body">
        학생이 보여드리려고 보낸 안내예요. 어른의 추천이 있어야 신청할 수 있는 기회예요.
      </p>

      {shareClosed(program, kstToday()) && (
        <p className="rounded-xl border border-sage-border bg-white px-4 py-3 text-sm font-bold text-ink">
          이번 모집은 끝났어요.
        </p>
      )}

      <div className="space-y-2 rounded-card border border-sage-border bg-white p-5">
        <h1 className="text-lg font-extrabold tracking-tight text-ink">{program.title}</h1>
        <p className="text-xs text-meta">{program.org}</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-body">{program.description}</p>
      </div>

      <NoticeFacts program={program} forAdult />

      <div className="space-y-2 rounded-card border border-sage-border bg-white p-5">
        <h2 className="text-sm font-bold text-ink">신청 방법</h2>
        {program.apply_method && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-body">{program.apply_method}</p>
        )}
        {program.phone && <p className="text-sm text-body">문의: {program.phone}</p>}
        {program.link && (
          <a
            href={program.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-cta px-4 py-2 text-xs font-bold text-dark-surface transition hover:brightness-105"
          >
            {program.link_kind === "info" ? "기관 홈페이지 열기 ↗" : "공식 페이지 바로가기 ↗"}
          </a>
        )}
      </div>

      <p className="text-xs leading-relaxed text-meta">
        씨드온은 추천서를 받거나 대신 쓰지 않아요. 추천하는 방법은 공식 안내를 확인해주세요.
      </p>
    </div>
  );
}
