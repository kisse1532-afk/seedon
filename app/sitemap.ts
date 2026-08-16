import type { MetadataRoute } from "next";
import { fetchPublishedPrograms } from "@/lib/queries";
import { categories } from "@/lib/data";

const SITE = "https://seedon.vercel.app";

/**
 * 검색엔진에게 "우리한테 이런 페이지들이 있어요"라고 알려주는 목록.
 *
 * 프로그램 카드를 하나하나 넣는 게 핵심이다. 홈만 알려주면 "학원비 지원" 같은
 * 걸 검색한 청소년이 우리한테 닿을 길이 없다. 카드마다 주소가 있어야 그
 * 프로그램 이름으로 검색했을 때 잡힌다.
 *
 * 리서치로 카드가 늘면 이 목록도 자동으로 늘어난다 — 손으로 관리하지 않는다.
 *
 * 로그인해야 보이는 화면(북마크·추천·커뮤니티)과 관리자 화면은 넣지 않는다.
 * 검색에서 눌러 들어와도 로그인 벽을 만나면 헛걸음이다.
 */
/* 빌드 시점에 한 번 만들어 고정하면 두 가지가 깨진다.
   ① 그때 DB를 못 읽으면 프로그램이 통째로 빠진 채 굳는다(실제로 그랬다)
   ② 리서치로 카드가 늘어도 다음 배포 전까지 검색엔진이 모른다
   크롤러만 가끔 읽는 주소라 매번 새로 그려도 부담이 없다. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: today, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/search`, lastModified: today, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/terms`, lastModified: today, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: today, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE}/category/${c.slug}`,
    lastModified: today,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // DB가 안 열려도 사이트맵 자체는 나가야 한다. 프로그램만 빠진다.
  const programs = await fetchPublishedPrograms().catch(() => []);
  const programPages: MetadataRoute.Sitemap = programs.map((p) => ({
    url: `${SITE}/apply/${p.id}`,
    // 마지막으로 사람이 확인한 날. 없으면 오늘로 두지 않는다 — 확인하지도 않은
    // 걸 오늘 확인한 것처럼 알리는 셈이 된다.
    lastModified: p.last_verified_at ? new Date(p.last_verified_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...programPages];
}
