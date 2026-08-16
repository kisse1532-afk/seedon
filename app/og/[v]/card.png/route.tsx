import { ImageResponse } from "next/og";
import { ogCard, OG_SIZE } from "@/lib/og-card";

/**
 * 카톡이 실제로 가져가는 미리보기 그림 주소.
 *
 * 주소에 판 번호가 들어간다(`/og/v3/card.png`). 그림을 고치면 lib/og-card.tsx의
 * OG_VERSION을 올려서 **주소 자체가 바뀌게** 한다 — 카톡은 한 번 가져간 그림을
 * 주소 기준으로 오래 기억하고, Next가 붙여주는 `?해시`는 무시하는 것으로 보인다
 * (2026-08-16: 내용을 두 번 바꾸고 카카오 캐시 초기화까지 했는데 예전 그림이
 * 계속 떴다).
 *
 * 번호가 뭐든 같은 그림을 내준다. 번호는 오직 "카톡에게 새 그림임을 알리는"
 * 용도다. 그래서 예전 번호로 들어와도 깨지지 않는다.
 */
export async function GET() {
  return new ImageResponse(ogCard(), {
    ...OG_SIZE,
    headers: {
      // 판 번호가 곧 내용이므로 오래 캐시해도 안전하다.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
