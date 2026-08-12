export default function EnrollmentBadge({ status }: { status?: string }) {
  if (!status) return null;

  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
      {status}
    </span>
  );
}
