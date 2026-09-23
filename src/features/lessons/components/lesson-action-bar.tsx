import { ArrowRight, Check, ChevronRight, LoaderCircle } from 'lucide-react'
import { Button } from '../../../components/ui/button'

type ActionBarStatus = 'ready' | 'busy' | 'complete'

interface LessonActionBarProps {
  status: ActionBarStatus
  runtimeStatus: 'loading' | 'ready' | 'error'
  isBusy: boolean
  hasNextLesson: boolean
  nextActionLabel: string
  nextModuleTitle?: string
  onRun: () => void
  onCheck: () => void
  onNext: () => void
}

export function LessonActionBar({
  status,
  runtimeStatus,
  isBusy,
  hasNextLesson,
  nextActionLabel,
  nextModuleTitle,
  onRun,
  onCheck,
  onNext,
}: LessonActionBarProps) {
  const runtimeReady = runtimeStatus === 'ready'

  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-paper/95 shadow-[0_-10px_30px_rgba(31,42,42,0.08)] backdrop-blur-md" data-testid="sticky-action-bar" aria-label="Lesson actions">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-10 lg:py-3.5">
        <div className="min-w-0 lg:w-[17rem]">
          <p className="text-sm font-bold text-ink">
            {status === 'complete' ? hasNextLesson ? 'Lesson complete' : 'Chapter complete' : status === 'busy' ? 'Working on it…' : 'Ready to try it?'}
          </p>
          <p className="mt-0.5 truncate text-xs leading-5 text-muted">
            {status === 'complete'
              ? hasNextLesson
                ? 'Your answer passed. Continue when you are ready.'
                : nextModuleTitle ? `${nextModuleTitle} is the next chapter.` : 'This chapter is complete.'
              : runtimeStatus === 'loading'
                ? 'Preparing Python…'
                : runtimeStatus === 'error'
                  ? 'Python could not start.'
              : 'Run your code, check your answer, or move to the next lesson.'}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" size="lg" onClick={onRun} disabled={isBusy || !runtimeReady}>
            {status === 'busy' ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
            {status === 'busy' ? 'Running…' : 'Run code'}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={onCheck} disabled={isBusy || !runtimeReady}>
            <Check size={17} aria-hidden="true" /> Check answer
          </Button>
          <Button type="button" variant="primary" size="lg" onClick={onNext} disabled={isBusy || !hasNextLesson}>
            {nextActionLabel} <ChevronRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
