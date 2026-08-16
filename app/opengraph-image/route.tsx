import { ImageResponse } from "next/og";
import { ogCard, OG_SIZE } from "@/lib/og-card";

/**
 * 옛 그림 주소. 지금도 **최신 그림**을 내준다.
 *
 * 왜 남겨두나: 카톡은 페이지마다 "제목·설명·그림주소"를 한 벌로 기억한다.
 * 예전에 기억해간 기록은 이 주소를 가리키고 있는데, 이걸 404로 없앴더니
 * 카톡이 가져올 게 없어서 **자기가 갖고 있던 옛 그림을 계속 썼다**
 * (2026-08-16 로드: "계속 똑같잖아"). 주소를 없애는 게 오히려 옛 그림을
 * 굳혀버린 것이다.
 *
 * 그래서 이 주소를 살려두되 내용은 lib/og-card.tsx에서 그린다. 옛 기록으로
 * 들어와도 새 그림이 나가므로, 로드가 캐시 초기화를 안 해도 저절로 바뀐다.
 *
 * 새 카드가 가리키는 주소는 `/og/v3/card.png`다(app/og/[v]/card.png/route.tsx).
 * 그림 자체를 고칠 땐 거기 판 번호만 올리면 된다 — 이 파일은 손댈 일이 없다.
 *
 * ⚠️ 이건 Next 기본 규칙 파일(`app/opengraph-image.tsx`)이 아니라 그냥 주소다.
 * 규칙 파일로 되돌리면 og:image 태그를 자기가 덮어써서, 자기 openGraph를
 * 선언하지 않은 페이지가 이 주소로 되돌아간다. 폴더 형태를 유지할 것.
 */
export async function GET() {
  return new ImageResponse(ogCard(), {
    ...OG_SIZE,
    headers: {
      // 옛 기록으로 들어오는 곳이라 오래 물고 있으면 안 된다. 짧게 두고
      // 다시 물어보게 한다.
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
