import { useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Circle, LockKeyhole, Menu, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import {
  getLessonLocation,
  getPreviousLesson,
  getModuleProgress,
} from '../../../curriculum/curriculum'
import type { Curriculum, Lesson, Module } from '../../../curriculum/types'

interface CurriculumNavigatorProps {
  curriculum: Curriculum
  currentLessonId: string
  completedLessonIds: string[]
  onSelect: (lessonId: string) => void
}

function lessonIsOpen(lesson: Lesson, completedLessonIds: string[]) {
  if (lesson.status !== 'ready') return false
  const previous = getPreviousLesson(lesson.id)
  return !previous || completedLessonIds.includes(previous.id)
}

interface ModuleSectionProps {
  module: Module
  currentLessonId: string
  completedLessonIds: string[]
  onSelect: (lessonId: string) => void
  onNavigate?: () => void
}

function ModuleSection({ module, currentLessonId, completedLessonIds, onSelect, onNavigate }: ModuleSectionProps) {
  const progress = getModuleProgress(module, completedLessonIds)
  const isCurrentModule = module.lessons.some((lesson) => lesson.id === currentLessonId)

  return (
    <section className={cn('rounded-2xl', isCurrentModule && 'bg-mist/65 p-2')} aria-labelledby={`module-${module.id}`}>
      <div className={cn('flex items-start gap-3', isCurrentModule ? 'px-2 pb-2' : 'px-2 py-2')}>
        <span className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
          isCurrentModule ? 'bg-teal text-white' : 'bg-white text-muted ring-1 ring-line',
        )} aria-hidden="true">
          {String(module.order).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 id={`module-${module.id}`} className="text-sm font-bold leading-5 text-ink">{module.title}</h2>
            {progress.isComplete ? <Check size={15} className="mt-0.5 shrink-0 text-teal" aria-label="Module complete" /> : null}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {progress.availableCount > 0 ? `${progress.completedCount}/${progress.availableCount} ready` : 'Coming soon'}
          </p>
        </div>
      </div>

      {isCurrentModule ? (
        <div className="space-y-1" role="list" aria-label={`${module.title} lessons`}>
          {module.lessons.map((lesson) => {
            const isCompleted = completedLessonIds.includes(lesson.id)
            const isCurrent = currentLessonId === lesson.id
            const isOpen = lessonIsOpen(lesson, completedLessonIds)
            const isFuture = lesson.status === 'coming-soon'

            return (
              <button
                key={lesson.id}
                type="button"
                role="listitem"
                disabled={!isOpen}
                onClick={() => {
                  if (isOpen) {
                    onSelect(lesson.id)
                    onNavigate?.()
                  }
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'group flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2',
                  isCurrent ? 'bg-white text-ink shadow-sm ring-1 ring-teal/20' : 'text-muted hover:bg-white/80 hover:text-ink',
                  !isOpen && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted',
                )}
              >
                <span className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs',
                  isCompleted ? 'border-teal bg-teal text-white' : isCurrent ? 'border-teal bg-white text-teal' : 'border-line bg-white text-muted',
                )} aria-hidden="true">
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : isFuture ? <LockKeyhole size={12} /> : isOpen ? <Circle size={9} fill="currentColor" /> : <LockKeyhole size={12} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-5">{lesson.shortTitle}</span>
                  {isFuture ? <span className="block text-[11px] leading-4 text-muted">Coming soon</span> : null}
                </span>
                {isCurrent ? <ChevronRight size={15} className="shrink-0 text-teal" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="px-2 pb-2 pl-[3.25rem] text-xs leading-5 text-muted">{module.description}</p>
      )}
    </section>
  )
}

interface NavigatorContentProps extends Omit<CurriculumNavigatorProps, 'curriculum'> {
  curriculum: Curriculum
  onNavigate?: () => void
}

function NavigatorContent({ curriculum, currentLessonId, completedLessonIds, onSelect, onNavigate }: NavigatorContentProps) {
  return (
    <div className="space-y-2">
      {curriculum.modules.map((module) => (
        <ModuleSection
          key={module.id}
          module={module}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIds}
          onSelect={onSelect}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

export function CurriculumNavigator({ curriculum, currentLessonId, completedLessonIds, onSelect }: CurriculumNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = getLessonLocation(currentLessonId)
  const currentModule = location?.module ?? curriculum.modules[0]
  const currentLesson = location?.lesson ?? currentModule.lessons[0]

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <aside className="hidden border-r border-line pr-7 lg:block" aria-label="Curriculum">
        <div className="mb-5 flex items-center gap-2 px-2">
          <Menu size={16} className="text-teal" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-muted">Curriculum</h2>
        </div>
        <NavigatorContent
          curriculum={curriculum}
          currentLessonId={currentLessonId}
          completedLessonIds={completedLessonIds}
          onSelect={onSelect}
        />
      </aside>

      <div className="lg:hidden">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full justify-between rounded-2xl bg-white px-4 text-left"
          aria-label="Open curriculum"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal text-xs font-bold text-white">{currentModule.order}</span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold uppercase tracking-[0.1em] text-muted">{currentModule.title}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink">Lesson {currentLesson.order}: {currentLesson.title}</span>
            </span>
          </span>
          <ChevronDown size={19} className="shrink-0 text-muted" aria-hidden="true" />
        </Button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Choose a lesson">
          <button type="button" className="absolute inset-0 bg-ink/35" aria-label="Close curriculum" onClick={() => setIsOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-line bg-paper p-5 pb-8 shadow-[0_-14px_45px_rgba(31,42,42,0.18)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal">Python Steps</p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-ink">Choose a lesson</h2>
              </div>
              <Button type="button" variant="quiet" size="sm" aria-label="Close curriculum" onClick={() => setIsOpen(false)}>
                <X size={19} aria-hidden="true" />
              </Button>
            </div>
            <NavigatorContent
              curriculum={curriculum}
              currentLessonId={currentLessonId}
              completedLessonIds={completedLessonIds}
              onSelect={onSelect}
              onNavigate={() => setIsOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
