import PolicyDoc from "@/app/_components/PolicyDoc";
import { TERMS } from "@/lib/policy";

export const metadata = { title: "이용약관 | 씨드온" };

export default function TermsPage() {
  return (
    <PolicyDoc
      title="이용약관"
      intro="씨드온을 쓸 때 서로 지킬 것을 적어뒀어요. 어려운 말 없이 읽을 수 있게 썼으니 한 번 읽어봐 주세요."
      sections={TERMS}
    />
  );
}
