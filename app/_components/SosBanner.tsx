import { emergencyContacts } from "@/lib/data";
import PhoneLink from "@/app/_components/PhoneLink";

/**
 * 심리상담 카테고리 맨 위에 붙는 긴급 연락 배너.
 *
 * 예전엔 짙은 갈색(warm-brown) 바탕에 흰 글씨였는데, 화면에서 이 블록만
 * 확 어두워서 "경고문" 같아 보였다(2026.08.15 로드 지적). 지금 힘든 청소년에게
 * 겁을 주는 톤이 아니라 말을 거는 톤이어야 하므로, 홈의 긴급 연락 블록과
 * 같은 따뜻한 색으로 맞췄다.
 *
 * 번호 목록은 lib/data.ts의 emergencyContacts 한 곳에서 가져온다 — 홈과 이
 * 화면이 각자 목록을 들고 있다가 홈에만 1366이 빠져 있었다.
 */
export default function SosBanner() {
  return (
    <div className="rounded-card border border-sos-line bg-sos-tile/45 px-4 py-5 sm:px-5 sm:py-6">
      <p className="text-[15px] font-extrabold tracking-tight text-sos-ink sm:text-[17px]">
        힘들 땐 전화해도 돼요
      </p>
      <p className="mt-1 mb-4 text-[12.5px] text-sos-sub sm:text-[13.5px]">
        전부 무료예요. 이름 안 밝혀도 되고, 24시간 언제 걸어도 돼요.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5">
        {emergencyContacts.map((c) => (
          <PhoneLink
            key={c.number}
            number={c.number}
            wrapperClassName="relative block w-full"
            className="flex h-full items-center gap-3 rounded-xl border border-sos-line bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-12px_rgba(194,112,42,0.6)]"
          >
            {/* 번호 칸 폭을 고정한다. 번호 길이가 제각각(117 ~ 1577-0199)이라
                그냥 두면 옆의 이름이 칸마다 다른 위치에서 시작해 줄이 어긋난다.
                번호는 통째로 한 크기로 그린다 — 예전엔 "-0199"만 작게 붙여서
                그 줄만 글씨가 다른 것처럼 보였다(2026.08.17 로드 지적). */}
            <span className="w-[100px] shrink-0 text-center text-[17px] font-extrabold leading-none tracking-tight text-sos-num tabular-nums">
              {c.number}
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[12.5px] font-bold leading-tight text-sos-ink">
                {c.name}
              </span>
              <span className="mt-0.5 block text-[11px] leading-tight text-sos-meta">
                {c.desc[0]} · {c.desc[1]}
              </span>
            </span>
          </PhoneLink>
        ))}
      </div>
    </div>
  );
}
