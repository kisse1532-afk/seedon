"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { categories, type Program } from "@/lib/data";
import { fetchPublishedPrograms } from "@/lib/queries";
import { hasCrisisSignal } from "@/lib/crisis";

/**
 * 오른쪽 아래 둥근 버튼 — 자유롭게 물어보는 AI 도우미.
 *
 * 왜 (로드 2026.10.20 총괄 대화)
 * --------------------------------
 * "오른쪽 하단에 은행앱 같은 거, 누르면 챗봇 서비스 쓰는 거 같은 거를 만들어 놓자"
 * → 버튼 안 내용은 "자유롭게 쳐서 묻는 AI 챗봇"으로 로드가 골랐다.
 * 10/18의 "카드 밖 질문에는 답하지 않는다"를 바꾼 결정이다. 다만 그 결정의 뜻
 * (모르는 걸 지어내지 않는다)은 그대로 지킨다:
 *   - 답은 씨드온 카드에 적힌 내용으로만 한다. 카드에 없으면 "여기엔 아직 없어요"
 *     + 1388·주민센터 안내로 끝낸다
 *   - 받을 수 있는지 없는지 판정하지 않는다 (절대규칙 2)
 *   - 소득·급식카드 같은 민감한 걸 묻지 않는다 (절대규칙 2)
 *   - 낙인 문구·행정용어를 쓰지 않는다 (절대규칙 1·3). 기계로 한 번 더 거른다
 *   - 위기 말이 보이면 1388을 먼저 (제품 과업 2). AI와 상관없이 기계가 먼저 본다
 *
 * 저장하지 않는다
 * ---------------
 * 청소년이 적은 글은 Anthropic으로 보내 답을 받는 데만 쓰고, 씨드온 DB에는
 * 남기지 않는다. 처리방침(lib/policy.ts)에 Anthropic은 이미 적혀 있다.
 *
 * 돈
 * --
 * 키(ANTHROPIC_API_KEY)가 없거나 실패하면 AI를 부르지 않고 안내 문장을 돌려준다.
 * 월 상한은 콘솔에서 로드가 건다. 여기서는 한 번에 보내는 길이를 줄여 둔다:
 * 질문 300자, 앞 대화 6개까지, 답 최대 700토큰.
 */

export type ChatTurn = { role: "user" | "assistant"; text: string };
export type ChatCard = { id: string; title: string; org: string };
export type ChatReply = {
  text: string;
  cards: ChatCard[];
  crisis: boolean;
  /** AI가 못 돌아서 기본 안내를 돌려준 경우 */
  fallback?: boolean;
};

const ReplySchema = z.object({
  /** 청소년에게 그대로 보여줄 답. ~해요체, 짧게 */
  answer: z.string(),
  /** 답에서 소개한 카드 id. 0~3개 */
  card_ids: z.array(z.string()),
  /** 자해·자살·폭력·지낼 곳 없음 같은 위기 신호 */
  crisis: z.boolean(),
});

const CATEGORY_LABEL = Object.fromEntries(categories.map((c) => [c.slug, c.label]));

/* 같은 낙인·판정 말 거르기 (lib/recommend-ai.ts와 같은 목록 + 판정형 말) */
const BANNED =
  /저소득|지원\s*대상자|취약\s*계층|결손\s*가정|차상위|수급자|중위소득|소득인정액|분이시|해당[돼되]|받을 수 있어요|받을 수 없어요|자격이 [있없]/;

const FALLBACK_TEXT =
  "지금은 답을 만들기 어려워요. 위의 검색이나 '맞춤 추천'에서 찾아보세요. 바로 이야기하고 싶으면 1388(청소년전화, 24시간)에 전화하거나 문자해도 돼요.";

const CRISIS_TEXT =
  "힘든 이야기를 적어줘서 고마워요. 지금 바로 이야기할 사람이 필요하면 1388(청소년전화, 24시간)에 전화하거나 문자해 주세요. 위험한 상황이면 112도 돼요.";

const MAX_INPUT = 300;
const MAX_HISTORY = 6;

function cardSheet(programs: Program[]): string {
  return programs
    .map((p) => {
      const closed = p.reopen_note ? ` [이번 모집 끝: ${p.reopen_note}]` : "";
      const how = p.apply_method ? `\n  신청: ${p.apply_method}` : "";
      const when = p.enrollment_status ? `\n  접수: ${p.enrollment_status}` : p.apply_deadline ? `\n  마감: ${p.apply_deadline}` : "";
      const tel = p.phone ? `\n  전화: ${p.phone}` : "";
      return `- id: ${p.id} | ${CATEGORY_LABEL[p.category] ?? p.category} | ${p.title} (${p.org})${closed}\n  ${p.description ?? ""}${how}${when}${tel}`;
    })
    .join("\n");
}

const SYSTEM = `너는 "씨드온 도우미"다. 씨드온은 청소년 지원제도를 쉬운 말로 모아 둔 곳이고,
사용자는 만 14세 이상 청소년이다. 아래 카드 목록에 적힌 내용으로만 답한다.

말투
- ~해요체로만. 반말 금지. 중학생이 사전 없이 읽을 수 있는 말
- 답은 짧게. 3~5문장. 한 문장에 정보 하나

반드시 지킬 것
- 카드 목록에 없는 제도·금액·날짜·전화번호를 지어내지 마라. 카드에 없으면
  "씨드온에는 아직 그 정보가 없어요"라고 말하고, 1388(청소년전화)이나 주민센터에
  물어보라고 안내한다
- 받을 수 있는지 없는지 판정하지 마라. "해당돼요" "받을 수 있어요" "자격이 돼요" 금지.
  대신 "카드의 '신청 전 안내'를 보고, 우리 집이 되는지는 주민센터에 물어보는 게 제일 정확해요"
- 소득, 재산, 급식카드, 가족 형편 같은 걸 묻지 마라. 이름·연락처·학교도 묻지 마라
- 쓰면 안 되는 말: 저소득, 지원대상자, 취약계층, 결손가정, 차상위계층, 수급자,
  중위소득, 소득인정액, 연계, 이수, 산정, 선정, 가구원
- 씨드온과 지원제도 이야기가 아닌 질문(숙제, 게임 등)은 "여기서는 지원제도 찾는 걸
  도와줄 수 있어요"라고 부드럽게 돌린다
- 소개하는 카드의 id를 card_ids에 넣는다 (0~3개). 답 본문에는 id를 쓰지 않는다
- 자해·자살·폭력·지낼 곳이 없는 상황 같은 위기 신호가 보이면 crisis를 true로 하고,
  답 첫 문장에서 1388(24시간)을 먼저 안내한다`;

export async function askChat(history: ChatTurn[], question: string): Promise<ChatReply> {
  const q = question.trim().slice(0, MAX_INPUT);
  if (!q) return { text: "궁금한 걸 한 줄 적어 주세요.", cards: [], crisis: false };

  const crisisByRule = hasCrisisSignal(q);

  if (!process.env.ANTHROPIC_API_KEY) {
    return { text: crisisByRule ? CRISIS_TEXT : FALLBACK_TEXT, cards: [], crisis: crisisByRule, fallback: true };
  }

  const programs = await fetchPublishedPrograms();
  const byId = new Map(programs.map((p) => [p.id, p]));

  const past = history
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.text.slice(0, 600) }) as const);

  try {
    const client = new Anthropic({ timeout: 15_000, maxRetries: 0 });
    const response = await client.messages.parse({
      model: "claude-haiku-5-5",
      max_tokens: 700,
      output_config: { format: zodOutputFormat(ReplySchema) },
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: `카드 목록:\n${cardSheet(programs)}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [...past, { role: "user", content: q }],
    });

    const parsed = response.parsed_output;
    if (!parsed) throw new Error("no parsed output");

    const crisis = parsed.crisis || crisisByRule;
    let text = parsed.answer.trim();
    // 판정·낙인 말이 섞이면 그 답은 버리고 안전한 안내로 바꾼다
    if (!text || BANNED.test(text)) {
      text = "카드의 '신청 전 안내'를 열어 보세요. 우리 집이 되는지는 주민센터에 물어보는 게 제일 정확해요.";
    }
    if (crisis && !text.includes("1388")) text = `${CRISIS_TEXT}\n\n${text}`;

    const cards = parsed.card_ids
      .map((id) => byId.get(id))
      .filter((p): p is Program => Boolean(p))
      .slice(0, 3)
      .map((p) => ({ id: p.id, title: p.title, org: p.org }));

    return { text, cards, crisis };
  } catch (err) {
    // 실패 이유만 남긴다. 키 값과 청소년이 적은 글은 남기지 않는다
    const e = err as { status?: number; error?: { error?: { type?: string; message?: string } }; message?: string };
    console.error("[chat-ai] AI 호출 실패", {
      status: e?.status ?? null,
      type: e?.error?.error?.type ?? null,
      message: (e?.error?.error?.message ?? e?.message ?? "").slice(0, 300),
    });
    return { text: crisisByRule ? CRISIS_TEXT : FALLBACK_TEXT, cards: [], crisis: crisisByRule, fallback: true };
  }
}
