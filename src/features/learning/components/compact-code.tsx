export function CompactCode({ code }: { code: string }) {
  return (
    <pre className="max-h-64 overflow-auto whitespace-pre rounded-lg border border-line bg-[#f4f8f6] p-3 font-mono text-sm leading-6 text-ink">
      <code>{code}</code>
    </pre>
  )
}
