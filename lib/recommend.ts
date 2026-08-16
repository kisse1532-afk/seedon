import { categories, type Category, type Program } from "@/lib/data";

const CATEGORY_LABEL = Object.fromEntries(categories.map((c) => [c.slug, c.label])) as Record<
  Category,
  string
>;

/**
 * 맞춤 추천 — AI 모델을 부르지 않는 판(키 없이 오늘 동작하는 것).
 *
 * 예전 판은 카테고리 하나만 고르고 그 안의 프로그램을 등록순 그대로 쏟아냈다.
 * 그건 추천이 아니라 카테고리 화면을 한 단계 돌아서 보여준 것이고, 무엇보다
 * 키워드가 하나도 안 걸리면 "못 찾았어요"로 끝났다. 자기 사정을 적은 청소년이
 * 빈손으로 돌아가는 건 정보 비대칭을 없애는 게 아니라 한 번 더 만드는 것이다.
 *
 * 그래서 두 가지를 바꾼다.
 *  1. 프로그램 하나하나에 점수를 매겨 순서를 만든다 (카테고리 + 글자 겹침 + 지금 신청 가능한지)
 *  2. 무슨 일이 있어도 빈손으로 끝내지 않는다. 못 알아들었으면 "지금 신청할 수 있는 것"을 보여준다
 *
 * 절대규칙 3: 청소년이 쓴 말 그대로 걸리게 한다. "소득인정액" 같은 행정용어가
 * 아니라 "돈이 없어", "학원비", "집 나왔어" 같은 말이 들어와야 한다.
 */

const KEYWORDS: Record<Category, string[]> = {
  education: [
    "학원", "공부", "성적", "학교", "교육", "학용품", "체험학습", "과외", "학비",
    "교재", "인강", "문제집", "시험", "수능", "내신", "등록금", "장학",
  ],
  counseling: [
    "심리", "상담", "우울", "힘들", "불안", "스트레스", "고민", "자해",
    "폭력", "왕따", "괴롭힘", "외로", "죽고", "무기력", "잠이", "화가",
    "가족", "부모님이", "싸워",
  ],
  housing: [
    "집", "주거", "갈곳", "갈 곳", "쉼터", "가출", "나갈", "살곳", "살 곳",
    "독립", "자립", "월세", "보증금", "잘데", "잘 데",
  ],
  living: [
    "생활비", "밥", "끼니", "돈", "용돈", "형편", "가난", "경제적",
    "굶", "먹을", "교통비", "통신비", "핸드폰 요금", "생계",
  ],
  career: [
    "진로", "취업", "직업", "꿈", "미래", "알바", "일자리",
    "자격증", "면접", "이력서", "적성", "뭐하고 살", "뭘 해야",
  ],
  culture: [
    "문화", "영화", "공연", "여행", "체험", "취미", "놀이",
    "동아리", "악기", "운동", "캠프", "전시",
  ],
  contest: [
    "공모전", "대회", "경진", "콘테스트", "출품", "응모", "수상", "상금",
    "도전", "참가",
  ],
};

/** 어떤 카테고리에 얼마나 걸리는지. 안 걸리면 빈 객체. */
function scoreCategories(text: string): Partial<Record<Category, number>> {
  const scores: Partial<Record<Category, number>> = {};
  for (const [category, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const hits = words.filter((w) => text.includes(w));
    if (hits.length > 0) scores[category] = hits.length;
  }
  return scores;
}

/**
 * 가장 관련 있어 보이는 카테고리 하나. 예전부터 쓰던 함수라 검색 화면(/search)이
 * 아직 쓰고 있어서 남겨둔다.
 */
export function matchCategory(text: string): Category | null {
  const entries = Object.entries(scoreCategories(text)) as [Category, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/**
 * 받침이 있는지에 따라 조사를 골라 붙인다.
 *
 * 이게 없으면 "'학원'와 관련 있어요"처럼 어색한 문장이 나간다. 청소년이 읽는
 * 화면이라 이런 게 하나만 있어도 대충 만든 티가 난다(절대규칙 3).
 */
export function withParticle(word: string, kind: "과" | "이라고"): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  // 한글이 아니면(영문·숫자로 끝나면) 받침 있는 쪽으로 붙이는 게 덜 어색하다
  const hasFinal = isHangul ? (last - 0xac00) % 28 !== 0 : true;

  if (kind === "과") return word + (hasFinal ? "과" : "와");
  return word + (hasFinal ? "이라고" : "라고");
}

/**
 * 걸리기는 잘 걸리지만 화면에 그대로 쓰면 어색한 것들.
 *
 * "힘들"은 '힘들다/힘들어요'를 다 잡으려고 어간만 넣은 것이라 매칭에는 좋은데,
 * "힘들과 관련 있어요"라고 나가면 말이 안 된다. 걸리는 데는 계속 쓰고
 * 보여주는 데서만 뺀다.
 */
const STEM_ONLY = new Set([
  "힘들", "죽고", "먹을", "굶", "싸워", "부모님이", "잘데", "잘 데",
  "갈곳", "갈 곳", "살곳", "살 곳", "나갈", "잠이", "화가", "무기력",
  "뭐하고 살", "뭘 해야", "핸드폰 요금", "이미", "적성",
]);

/** 청소년이 쓴 말 중 실제로 걸린 단어들. 매칭 계산에 쓴다. */
export function matchedWords(text: string): string[] {
  const all = Object.values(KEYWORDS).flat();
  const hits = all.filter((w) => text.includes(w));
  // 긴 단어가 더 구체적이라 먼저 본다 ("돈"보다 "학원비")
  return [...new Set(hits)].sort((a, b) => b.length - a.length).slice(0, 5);
}

/** 그중 화면에 그대로 써도 되는 말만. 없으면 null. */
function displayableWord(words: string[]): string | null {
  return words.find((w) => w.length >= 2 && !STEM_ONLY.has(w)) ?? null;
}

export type Ranked = {
  program: Program;
  score: number;
  /** 왜 위로 올라왔는지. 화면에 그대로 보여줘도 되는 문장. */
  reason: string | null;
};

export type RankOptions = {
  /** 로그인한 사람이 저장해둔 프로그램의 카테고리. 비슷한 걸 위로 올린다. */
  likedCategories?: Category[];
  today?: string;
  limit?: number;
};

/**
 * 프로그램에 점수를 매겨 순서를 만든다.
 *
 * 점수는 "지금 이 청소년에게 얼마나 쓸모 있나"를 뜻한다. 마감이 지난 것은
 * 아무리 잘 맞아도 위로 올리지 않는다 — 맞는 걸 보여주고 신청은 못 하게 하는 게
 * 제일 나쁘다.
 */
export function rankPrograms(
  text: string,
  programs: Program[],
  { likedCategories = [], today = new Date().toISOString().slice(0, 10), limit = 12 }: RankOptions = {}
): { items: Ranked[]; understood: boolean } {
  const normalized = text.toLowerCase();
  const catScores = scoreCategories(normalized);
  const hits = Object.values(catScores);
  const topScore = hits.length > 0 ? Math.max(...hits) : 0;
  const understood = topScore > 0;
  const words = matchedWords(normalized);

  const ranked: Ranked[] = programs.map((p) => {
    let score = 0;
    let reason: string | null = null;

    // 1. 적어준 내용이 이 카테고리를 가리키나
    const catScore = catScores[p.category] ?? 0;
    if (catScore > 0) {
      score += catScore === topScore ? 12 : 6;
      // 보여줄 만한 말이 없으면 카테고리 이름으로 설명한다. 어간을 그대로 쓰느니
      // "심리상담 쪽에서 찾았어요"가 낫다.
      const shown = displayableWord(words);
      reason = shown
        ? `${withParticle(shown, "이라고")} 적어주셔서 골랐어요`
        : `${CATEGORY_LABEL[p.category]} 쪽에서 찾았어요`;
    }

    // 2. 적어준 말이 프로그램 설명에 그대로 들어 있나. 카테고리보다 확실한 신호다.
    //
    // 다만 한 글자 단어("집", "돈", "밥")는 아무 데나 걸린다. 교육급여 설명의
    // "4명이 사는 집이면"이 주거 검색에 잡혀서 "'집'과 관련 있어요"가 붙는 식이다.
    // 사실도 아니고 청소년을 엉뚱한 데로 보낸다. 그래서 점수는 조금만 주고
    // 고른 이유로는 쓰지 않는다.
    const haystack = `${p.title} ${p.description} ${(p.tags || []).join(" ")}`.toLowerCase();
    const direct = words.filter((w) => haystack.includes(w));
    const solid = direct.filter((w) => w.length >= 2);
    score += 5 * solid.length + 2 * (direct.length - solid.length);
    const shownDirect = displayableWord(solid);
    if (shownDirect) {
      reason = `${withParticle(shownDirect, "과")} 관련 있어요`;
    }

    // 3. 저장해둔 것과 같은 갈래면 조금 올린다. 로그인한 사람에게만 해당.
    if (likedCategories.includes(p.category)) {
      score += 4;
      if (!reason) reason = "저장해둔 것과 비슷해요";
    }

    // 4. 지금 신청할 수 있나. 마감이 지났으면 아예 뺀다.
    if (p.apply_deadline) {
      if (p.apply_deadline < today) return { program: p, score: -1, reason: null };
      const daysLeft = Math.ceil(
        (new Date(p.apply_deadline).getTime() - new Date(today).getTime()) / 86_400_000
      );
      // 마감이 가까우면 지금 알려주는 게 의미가 크다. 너무 촉박한 건 덜 올린다.
      score += daysLeft <= 30 ? 3 : 1;
    } else {
      score += 2; // 아무 때나 신청 가능
    }
    if (p.reopen_note) score -= 5; // 이번 회차는 끝난 것

    return { program: p, score, reason };
  });

  return {
    items: ranked
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit),
    understood,
  };
}
