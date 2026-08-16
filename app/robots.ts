import type { MetadataRoute } from "next";

/**
 * 검색엔진에게 "어디는 봐도 되고 어디는 보면 안 되는지" 알려주는 파일.
 *
 * 관리자 화면과 로그인 흐름은 막는다. 관리자 화면에는 청소년의 이름·연락처가
 * 뜨고(서버 키가 있을 때), 로그인 중간 화면들은 검색에 걸려봤자 뜬금없는
 * 곳에 떨어뜨릴 뿐이다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/login/", "/api/"],
    },
    sitemap: "https://seedon.vercel.app/sitemap.xml",
  };
}
