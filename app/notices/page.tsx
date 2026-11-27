import type { Metadata } from "next";
import NoticeTool from "./NoticeTool";

// 선생님·운영자용 도구다. 검색에 잡힐 이유가 없다.
export const metadata: Metadata = {
  title: "공문 올리기",
  robots: { index: false, follow: false },
};

export default function NoticesPage() {
  return <NoticeTool />;
}
