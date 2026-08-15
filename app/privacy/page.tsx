import PolicyDoc from "@/app/_components/PolicyDoc";
import { PRIVACY } from "@/lib/policy";

export const metadata = { title: "개인정보 처리방침 | 씨드온" };

export default function PrivacyPage() {
  return (
    <PolicyDoc
      title="개인정보 처리방침"
      intro="씨드온이 무엇을 받고, 왜 받고, 얼마나 갖고 있는지 적어뒀어요. 소득이나 급식카드 같은 건 묻지 않아요."
      sections={PRIVACY}
    />
  );
}
