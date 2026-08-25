import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { categories, type Program } from "@/lib/data";

/**
 * 맞춤 추천 — AI가 고르는 판.
 *
 * 왜 (로드 지시 2026.08.25): "맞춤추천은 로그인을 하고 우리가 찾아가지고
 * 줘야돼. AI 연결을 알아봐."
 *
 * 지금까지는 키워드 목록으로 걸었다("학원비"가 있으면 교육 칸). 이 방식의 한계는
 * 청소년이 쓰는 말을 우리가 미리 다 적어둘 수 없다는 것이다 — "야자 끝나고
 * 갈 데가 없어요"에는 키워드가 하나도 안 걸린다. AI는 말뜻으로 고른다.
 *
 * ⚠️ 켜는 조건: 환경변수 `ANTHROPIC_API_KEY`가 있어야 돈다.
 *    없으면 이 함수는 조용히 null을 돌려주고, 화면은 기존 키워드 방식
 *    그대로 돈다. 즉 키를 안 넣으면 아무것도 달라지지 않는다 —
 *    그래서 이 코드는 미리 올려둬도 안전하다(되돌리기 = 키 제거).
 *
 * 개인정보 (반드시 알 것)
 * ----------------------
 * 청소년이 적은 글이 Anthropic(클로드를 만드는 회사) 서버로 전송된다.
 * - Anthropic은 API로 온 내용을 모델 학습에 쓰지 않는다 (기본 설정)
 * - 개인정보 처리방침의 "서비스를 돌리기 위해 쓰는 곳"에 Anthropic을
 *   추가해야 한다. 키를 켜기 전에 반드시. (lib/policy.ts)
 * - 우리 쪽에서는 적은 글을 계정과 묶어 저장하지 않는다 — 지금도 안 한다
 *
 * 비용 (2026.08 기준, claude-opus-5: 입력 $5/1M · 출력 $25/1M 토큰)
 * ----------------------------------------------------------------
 * 한 번 부를 때 카드 목록 ~6천 토큰 + 답 ~500 토큰 ≈ 4~5센트(약 60원).
 * 카드 목록에 캐시를 걸어뒀으므로 5분 안에 다음 사람이 부르면 ~1센트(약 15원).
 * 하루 100번 불려도 몇천 원 수준. 지금 사용자 0명이라 사실상 0원이다.
 */

const PickSchema = z.object({
  /** 위기 신호(자해·자살·폭력·가출 직후 등)가 보이면 true — 화면이 1388을 맨 위로 올린다 */
  crisis: z.boolean(),
  /** 잘 맞는 순서대로. 억지로 채우지 말 것 — 정말 맞는 것만 */
  picks: z.array(
    z.object({
      id: z.string(),
      /** 청소년에게 그대로 보여줄 한 줄. ~해요체, 반말 금지 */
      reason: z.string(),
    })
  ),
});

export type AiPick = { id: string; reason: string };
export type AiResult = { crisis: boolean; picks: AiPick[] };

const CATEGORY_LABEL = Object.fromEntries(categories.map((c) => [c.slug, c.label]));

/** 카드 목록을 모델이 읽을 한 장으로 만든다. 요청마다 같아야 캐시가 걸린다. */
function cardSheet(programs: Program[]): string {
  return programs
    .map((p) => {
      const closed = p.enrollment_status?.includes("끝") || p.reopen_note ? " [지금은 닫힘]" : "";
      return `- id: ${p.id} | ${CATEGORY_LABEL[p.category] ?? p.category} | ${p.title}${closed}\n  ${p.description ?? ""}`;
    })
    .join("\n");
}

const SYSTEM = `너는 씨드온의 추천 담당이다. 씨드온은 청소년 지원제도 정보 플랫폼이고,
사용자는 만 14세 이상 청소년이다. 청소년이 자기 상황을 적으면, 아래 카드 목록에서
지금 도움이 될 것을 골라 순서대로 낸다.

지켜야 할 것:
- 정말 맞는 것만 골라라. 억지로 채우면 청소년이 눌렀다가 헛걸음한다. 0~6개가 보통이다
- [지금은 닫힘] 표시가 있는 카드는 정말 잘 맞을 때만, 뒤쪽에 둬라
- reason은 청소년에게 그대로 보여준다. 한 문장, ~해요체(반말 금지),
  "저소득" "취약계층" "대상자" 같은 낙인 표현 금지, 판정하는 말투 금지
  ("~한 분이시군요" 금지. "학원비 부담을 적어줘서 이걸 골랐어요"처럼 이유만)
- 자해·자살·심한 폭력·방금 집을 나온 상황 같은 위기 신호가 보이면 crisis를 true로 하라.
  그래도 picks는 채워라(심리상담·주거 카드 등)`;

/**
 * AI에게 골라달라고 한다. 키가 없거나 10초 안에 답이 없거나 실패하면 null —
 * 부른 쪽은 null이면 기존 키워드 방식으로 그대로 간다. 빈손 금지 원칙 유지.
 */
export async function aiRecommend(q: string, programs: Program[]): Promise<AiResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const text = q.trim();
  if (!text) return null;

  try {
    const client = new Anthropic({ timeout: 10_000, maxRetries: 0 });
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2000,
      // 고르기만 하는 짧은 일이라 깊게 생각할 필요가 없다. 낮춰서 싸고 빠르게
      output_config: { effort: "low", format: zodOutputFormat(PickSchema) },
      system: [
        { type: "text", text: SYSTEM },
        // 카드 목록은 요청마다 같으므로 캐시를 건다. 5분 안의 다음 요청은 ~10% 값
        { type: "text", text: `카드 목록:\n${cardSheet(programs)}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: text }],
    });

    const parsed = response.parsed_output;
    if (!parsed) return null;

    // 모델이 없는 id를 낼 수 있다 — 실제 카드에 있는 것만 남긴다
    const known = new Set(programs.map((p) => p.id));
    const picks = parsed.picks.filter((p) => known.has(p.id));
    return { crisis: parsed.crisis, picks };
  } catch {
    // 어떤 실패든 화면을 막지 않는다. 기존 방식이 받아준다
    return null;
  }
}
