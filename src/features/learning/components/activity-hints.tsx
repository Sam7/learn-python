import { Lightbulb } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface ActivityHintsProps {
  hints: string[]
  visibleCount: number
  onReveal: () => void
}

export function ActivityHints({ hints, visibleCount, onReveal }: ActivityHintsProps) {
  if (hints.length === 0) return null
  const visibleHints = hints.slice(0, visibleCount)

  return (
    <div className="mt-3 border-t border-line/70 pt-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Lightbulb size={14} className="text-[#a37a26]" aria-hidden="true" /> Need a hint?</span>
        {visibleHints.length > 0 ? (
          <span className="text-sm leading-5 text-muted">{visibleHints.at(-1)}</span>
        ) : null}
        {visibleCount < hints.length ? (
          <Button type="button" variant="quiet" size="sm" className="min-h-9 px-2" onClick={onReveal}>
            {visibleCount === 0 ? 'Show a hint' : 'Another hint'}
          </Button>
        ) : null}
      </div>
      {visibleHints.length > 1 ? (
        <ol className="mt-1 space-y-0.5 pl-5 text-xs leading-5 text-muted/80">
          {visibleHints.slice(0, -1).map((hint, index) => <li key={`${index}-${hint}`}>{hint}</li>)}
        </ol>
      ) : null}
    </div>
  )
}
