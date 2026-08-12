const CONTACTS = [
  { name: "청소년전화 1388", desc: "24시간 언제든, 전화·문자 다 돼요", href: "tel:1388" },
  { name: "정신건강 위기상담 1577-0199", desc: "마음이 힘들 때 24시간 상담", href: "tel:1577-0199" },
  { name: "여성긴급전화 1366", desc: "폭력·위험 상황에서 24시간 도움", href: "tel:1366" },
  { name: "학교폭력 신고 117", desc: "학교폭력·성폭력 관련 24시간 상담·신고", href: "tel:117" },
];

export default function SosBanner() {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 space-y-3">
      <div>
        <p className="font-semibold text-rose-700">지금 많이 힘들다면, 여기로 먼저 연락해도 괜찮아요</p>
        <p className="text-xs text-rose-500 mt-0.5">아래 번호는 전부 무료이고, 24시간 언제 걸어도 돼요.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CONTACTS.map((c) => (
          <a
            key={c.name}
            href={c.href}
            className="rounded-xl bg-white border border-rose-100 px-4 py-3 hover:border-rose-300 transition-colors"
          >
            <p className="text-sm font-medium text-neutral-800">{c.name}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{c.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
