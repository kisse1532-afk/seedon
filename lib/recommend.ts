import type { Category } from "@/lib/data";

// AI 모델을 호출하지 않는 1단계 버전: 카테고리별 키워드에 걸리는 개수로
// 가장 관련 있어 보이는 카테고리를 고른다. 비용 발생 없음.
const KEYWORDS: Record<Category, string[]> = {
  education: ["학원", "공부", "성적", "학교", "교육", "학용품", "체험학습", "과외", "학비"],
  counseling: [
    "심리",
    "상담",
    "우울",
    "힘들",
    "불안",
    "스트레스",
    "고민",
    "자해",
    "폭력",
    "왕따",
    "괴롭힘",
    "외로",
  ],
  housing: ["집", "주거", "갈곳", "쉼터", "가출", "나갈", "살곳", "독립", "자립"],
  living: ["생활비", "밥", "끼니", "돈", "용돈", "형편", "가난", "경제적"],
  career: ["진로", "취업", "직업", "꿈", "미래", "알바", "일자리"],
  culture: ["문화", "영화", "공연", "여행", "체험", "취미", "놀이"],
  contest: [
    "공모전",
    "대회",
    "경진",
    "콘테스트",
    "출품",
    "응모",
    "수상",
    "상금",
    "도전",
    "참가",
  ],
};

export function matchCategory(text: string): Category | null {
  const scores: Partial<Record<Category, number>> = {};
  for (const [category, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const score = words.filter((w) => text.includes(w)).length;
    if (score > 0) scores[category] = score;
  }

  const entries = Object.entries(scores) as [Category, number][];
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}
