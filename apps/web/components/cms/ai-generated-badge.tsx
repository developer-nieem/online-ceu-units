export function AiGeneratedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-violet-100 font-medium text-violet-900 ${
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
      }`}
      title="AI-generated draft — requires instructor review before publish"
    >
      AI draft
    </span>
  );
}
