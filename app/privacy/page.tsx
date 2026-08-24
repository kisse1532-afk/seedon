import PolicyDoc from "@/app/_components/PolicyDoc";
import { PRIVACY } from "@/lib/policy";

export const metadata = { title: "개인정보 처리방침 | 씨드온" };

export default function PrivacyPage() {
  return (
    <PolicyDoc
      title="개인정보 처리방침"
      intro="씨드온이 무엇을 받고, 왜 받고, 얼마나 갖고 있는지 적어뒀어요. 소득이나 급식카드 같은 건 묻지 않아요."
      summary={[
        "소득이나 급식카드는 안 물어봐요.",
        "이름·연락처는 관심 등록하거나 도움을 요청할 때만 받아요.",
        "마이페이지에서 내 정보를 직접 보고 지울 수 있어요.",
      ]}
      sections={PRIVACY}
    />
  );
}
