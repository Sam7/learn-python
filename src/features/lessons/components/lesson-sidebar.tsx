import { Check, Circle, LockKeyhole } from 'lucide-react'
import { cn } from '../../../lib/utils'
import type { Lesson } from '../types'

interface LessonSidebarProps {
  lessons: Lesson[]
  currentLessonId: string
  completedLessonIds: string[]
  onSelect: (lessonId: string) => void
}

export function LessonSidebar({ lessons, currentLessonId, completedLessonIds, onSelect }: LessonSidebarProps) {
  return (
    <aside className="border-b border-line pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7" aria-label="Lessons">
      <div className="mb-3 flex items-baseline justify-between lg:mb-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted">Lessons</h2>
        <span className="text-xs text-muted lg:hidden">Swipe to explore</span>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible" aria-label="Lesson navigation">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessonIds.includes(lesson.id)
          const isCurrent = currentLessonId === lesson.id
          const isAvailable = index === 0 || completedLessonIds.includes(lessons[index - 1].id)

          return (
            <button
              key={lesson.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(lesson.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'group flex min-w-[156px] shrink-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 lg:w-full',
                isCurrent
                  ? 'border-teal/30 bg-mist text-ink'
                  : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-white',
                !isAvailable && 'cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  isCompleted
                    ? 'border-teal bg-teal text-white'
                    : isCurrent
                      ? 'border-teal bg-white text-teal'
                      : 'border-line bg-white text-muted',
                )}
                aria-hidden="true"
              >
                {isCompleted ? <Check size={15} strokeWidth={2.5} /> : isAvailable ? <Circle size={11} fill="currentColor" /> : <LockKeyhole size={13} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{lesson.shortTitle}</span>
                <span className="mt-0.5 block text-xs text-muted">Step {lesson.order}</span>
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
