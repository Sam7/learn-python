import { Lightbulb } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface HintPanelProps {
  hints: string[]
  visibleCount: number
  onReveal: () => void
}

export function HintPanel({ hints, visibleCount, onReveal }: HintPanelProps) {
  if (hints.length === 0) return null
  const canReveal = visibleCount < hints.length

  return (
    <section className="rounded-2xl border border-[#eadfbd] bg-[#fffaf0] p-5" aria-label="Hints">
      <div className="flex items-start gap-3">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-[#a37a26]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">Need a hint?</h2>
          {visibleCount > 0 ? (
            <ol className="mt-3 space-y-2 pl-4 text-sm leading-6 text-muted">
              {hints.slice(0, visibleCount).map((hint, index) => <li key={hint}>{index + 1}. {hint}</li>)}
            </ol>
          ) : <p className="mt-1 text-sm leading-6 text-muted">Try it yourself first. You can reveal a small nudge when you need one.</p>}
          {canReveal ? <Button type="button" variant="quiet" size="sm" className="mt-3 -ml-3" onClick={onReveal}>Show {visibleCount === 0 ? 'a hint' : 'the next hint'}</Button> : null}
        </div>
      </div>
    </section>
  )
}
