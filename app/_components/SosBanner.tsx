const CONTACTS = [
  { name: "청소년전화 1388", desc: "24시간 언제든, 전화·문자 다 돼요", href: "tel:1388" },
  { name: "정신건강 위기상담 1577-0199", desc: "마음이 힘들 때 24시간 상담", href: "tel:1577-0199" },
  { name: "여성긴급전화 1366", desc: "폭력·위험 상황에서 24시간 도움", href: "tel:1366" },
  { name: "학교폭력 신고 117", desc: "학교폭력·성폭력 관련 24시간 상담·신고", href: "tel:117" },
];

export default function SosBanner() {
  return (
    <div className="rounded-lg bg-warm-brown p-5 space-y-3">
      <div>
        <p className="font-semibold text-white">지금 많이 힘들다면, 여기로 먼저 연락해도 괜찮아요</p>
        <p className="text-xs text-white/60 mt-0.5">아래 번호는 전부 무료이고, 24시간 언제 걸어도 돼요.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CONTACTS.map((c) => (
          <a
            key={c.name}
            href={c.href}
            className="rounded-lg bg-white/10 border border-white/10 px-4 py-3 hover:bg-white/15 transition-colors"
          >
            <p className="text-sm font-medium text-white">{c.name}</p>
            <p className="text-xs text-white/50 mt-0.5">{c.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
