import type { ContentBlock } from '../../../curriculum/types'

export function ContentBlockView({ block }: { block: ContentBlock }) {
  if (block.type === 'paragraph') {
    return <p className="max-w-3xl text-base leading-7 text-muted">{block.text}</p>
  }

  if (block.type === 'list') {
    return (
      <ul className="max-w-3xl space-y-1.5 pl-5 text-sm leading-6 text-muted marker:text-teal">
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    )
  }

  if (block.type === 'callout') {
    const className = block.tone === 'tip'
      ? 'border-teal/20 bg-mist/75'
      : 'border-line bg-white/70'
    return <p className={`max-w-3xl rounded-lg border px-3.5 py-2.5 text-sm leading-6 text-muted ${className}`}>{block.text}</p>
  }

  if (block.type === 'evaluation') {
    return (
      <figure className="max-w-3xl rounded-xl border border-line bg-white px-4 py-3 sm:px-5">
        {block.caption ? <figcaption className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{block.caption}</figcaption> : null}
        <ol aria-label="Expression evaluation steps" className="space-y-1 font-mono text-sm leading-6 text-ink">
          {[block.expression, ...block.steps].map((step, index, steps) => (
            <li key={`${index}-${step}`} className={`flex min-w-0 gap-3 ${index === steps.length - 1 ? 'font-semibold text-teal-dark' : ''}`}>
              <span aria-hidden="true" className="w-5 shrink-0 text-right text-muted">{index === steps.length - 1 ? '=' : index === 0 ? '·' : '↓'}</span>
              <code className="min-w-0 overflow-x-auto whitespace-pre">{step}</code>
            </li>
          ))}
        </ol>
      </figure>
    )
  }

  return (
    <figure className="max-w-3xl overflow-hidden rounded-xl border border-line bg-white">
      {block.caption ? <figcaption className="border-b border-line/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{block.caption}</figcaption> : null}
      <pre className="overflow-x-auto bg-[#f4f8f6] px-4 py-3 font-mono text-sm leading-6 text-ink"><code>{block.code}</code></pre>
    </figure>
  )
}
