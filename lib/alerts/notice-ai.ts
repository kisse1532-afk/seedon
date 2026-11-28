import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { categories, type Category } from "@/lib/data";
import { GRADE_VALUES, type Grade } from "@/lib/alerts/options";
import { NOTICE_SYSTEM_PROMPT, noticeContent } from "@/lib/alerts/notice-prompt";
import { cleanDraft, isRealDate, type NoticeDraft } from "@/lib/alerts/notice";

/**
 * 공문·공고를 AI로 「쉬운 안내」 초안으로 바꾼다.
 *
 * 설정은 맞춤 추천(lib/recommend-ai.ts)과 같다 — 모델 claude-haiku-5-5, 키는
 * 환경변수 ANTHROPIC_API_KEY, 월 상한은 Claude 콘솔에서 건다(1만 원, 10/18 결정).
 * 키가 없거나 실패하면 null을 돌려주고, 화면은 사람이 직접 쓰는 칸으로 남는다.
 */

const CATEGORY_VALUES = categories.map((c) => c.slug) as [Category, ...Category[]];

const DraftSchema = z.object({
  title: z.string(),
  org: z.string(),
  description: z.string(),
  who: z.string(),
  applyMethod: z.string(),
  deadline: z.string(),
  enrollment: z.string(),
  link: z.string(),
  linkKind: z.enum(["apply", "info"]),
  phone: z.string(),
  category: z.enum(CATEGORY_VALUES),
  grades: z.array(z.enum(GRADE_VALUES as [Grade, ...Grade[]])),
  regions: z.array(z.string()),
  interests: z.array(z.enum(CATEGORY_VALUES)),
  eduBenefitPriority: z.boolean(),
  needsRecommendation: z.boolean(),
  checkNotes: z.array(z.string()),
});

export type AiDraft = { draft: NoticeDraft; notes: string[] };

export async function draftFromNotice(input: {
  text: string;
  pdfBase64: string | null;
  today: string;
}): Promise<AiDraft | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const content = noticeContent(input);

  try {
    const client = new Anthropic({ timeout: 50_000, maxRetries: 0 });
    const response = await client.messages.parse({
      model: "claude-haiku-5-5",
      // 생각하는 토큰까지 이 안에 들어간다. 좁게 잡으면 답이 중간에 잘린다.
      max_tokens: 8000,
      output_config: { format: zodOutputFormat(DraftSchema) },
      system: NOTICE_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
    const parsed = response.parsed_output;
    if (!parsed) return null;

    const draft = cleanDraft(parsed);
    const notes = parsed.checkNotes.slice(0, 10);

    if (draft.deadline && !isRealDate(draft.deadline)) {
      draft.deadline = "";
      notes.push("마감일을 날짜로 못 읽었어요. 원문을 보고 적어주세요.");
    }
    /* 지어낸 주소·번호는 게시되면 학생이 엉뚱한 데로 간다. 붙여넣은 글이면
       원문에 그대로 있는지 기계로 맞춰 보고, 없으면 비운다. PDF만 올린 경우는
       맞춰 볼 글이 없어서 사람이 확인하라고 알린다. */
    const compact = (s: string) => s.replace(/\s+/g, "");
    if (input.pdfBase64) {
      if (draft.link || draft.phone) notes.push("링크와 전화번호는 원문과 한 글자씩 맞춰 보세요.");
    } else {
      if (draft.link && !compact(input.text).includes(compact(draft.link))) {
        draft.link = "";
        notes.push("원문에 없는 링크가 나와서 비웠어요. 공식 링크를 적어주세요.");
      }
      if (draft.phone && !compact(input.text).includes(compact(draft.phone))) {
        draft.phone = "";
        notes.push("원문에 없는 전화번호가 나와서 비웠어요.");
      }
    }
    return { draft, notes };
  } catch (error) {
    // 원문은 기록에 남기지 않는다. 이유만 남긴다.
    console.error("notice draft failed:", error instanceof Error ? `${error.name} ${error.message}` : "unknown");
    return null;
  }
}
