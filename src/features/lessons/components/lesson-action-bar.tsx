import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface LessonActionBarProps {
  stepIndex: number
  totalSteps: number
  completedActivities: number
  requiredActivities: number
  canGoPrevious: boolean
  canGoNext: boolean
  nextLabel: string
  isBusy: boolean
  isLessonComplete: boolean
  runtimeStatus: 'loading' | 'ready' | 'error'
  onPrevious: () => void
  onNext: () => void
}

export function LessonActionBar({
  stepIndex,
  totalSteps,
  completedActivities,
  requiredActivities,
  canGoPrevious,
  canGoNext,
  nextLabel,
  isBusy,
  isLessonComplete,
  runtimeStatus,
  onPrevious,
  onNext,
}: LessonActionBarProps) {
  const stepNumber = Math.min(stepIndex + 1, Math.max(totalSteps, 1))
  const progressMaximum = Math.max(requiredActivities, 1)
  const completed = Math.min(completedActivities, progressMaximum)
  const percent = requiredActivities > 0 ? Math.round((completed / requiredActivities) * 100) : 0

  return (
    <footer className="sticky bottom-0 z-30 border-t border-line bg-paper/95 shadow-[0_-8px_24px_rgba(31,42,42,0.07)] backdrop-blur-md" data-testid="sticky-action-bar" aria-label="Lesson progress and navigation">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2.5 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-7 lg:px-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-ink sm:text-sm">
              {isLessonComplete ? 'Lesson complete' : runtimeStatus === 'loading' ? 'Preparing Python…' : isBusy ? 'Working on it…' : `Step ${stepNumber} of ${totalSteps}`}
            </p>
            <p className="text-[11px] text-muted sm:text-xs">{completedActivities} of {requiredActivities} tasks complete</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Required task progress" aria-valuemin={0} aria-valuemax={progressMaximum} aria-valuenow={completed}>
            <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button type="button" variant="secondary" className="min-h-11" onClick={onPrevious} disabled={!canGoPrevious || isBusy}>
            <ChevronLeft size={17} aria-hidden="true" /> <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button type="button" variant="primary" className="min-h-11 min-w-32" onClick={onNext} disabled={!canGoNext || isBusy}>
            {nextLabel} <span aria-hidden="true">{nextLabel === 'Course complete' ? '✓' : <ChevronRight size={17} />}</span>
          </Button>
        </div>
      </div>
    </footer>
  )
}
