import Link from "next/link";
import { POLICY_CONTACT, POLICY_UPDATED, type PolicySection } from "@/lib/policy";

/**
 * 이용약관·개인정보처리방침을 같은 모양으로 보여준다.
 *
 * 청소년이 읽는 문서라 글씨를 작게 욱여넣지 않는다. 약관을 깨알같이 적어두면
 * 아무도 안 읽고, 안 읽고 누른 동의는 동의가 아니다.
 */
export default function PolicyDoc({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <Link href="/mypage" className="text-[13px] font-medium text-meta transition hover:text-ink">
          ← 뒤로
        </Link>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-body">{intro}</p>
        <p className="mt-3 text-xs text-meta">{POLICY_UPDATED}부터 적용돼요</p>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.heading} className="rounded-card border border-sage-border bg-white p-5">
            <h2 className="text-[15px] font-bold text-ink">{s.heading}</h2>
            <div className="mt-3 space-y-2.5">
              {s.body.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-body">
                  {/* **굵게** 표시만 지원한다. 문서에 필요한 강조는 그게 전부다. */}
                  {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <b key={j} className="font-bold text-ink">
                        {part.slice(2, -2)}
                      </b>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-card border border-primary/30 bg-mint p-5">
        <h2 className="text-sm font-bold text-primary-deep">물어볼 곳</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-body">
          궁금한 게 있거나 내 정보를 보고 싶으면 <b className="font-bold">{POLICY_CONTACT}</b> 로 알려주세요.
        </p>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-meta">
        씨드온은 아직 시범 운영 중이에요. 이 문서는 실제로 저장하는 항목을 기준으로 쓴 것이고,
        정식 서비스 전에 전문가 검토를 받을 예정이에요.
      </p>
    </div>
  );
}
