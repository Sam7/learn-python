import { Code2, RotateCcw } from 'lucide-react'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { ActivityRenderer } from './features/learning/components/activity-renderer'
import { ContentBlockView } from './features/learning/components/content-block'
import { useLearningSession } from './features/learning/use-learning-session'
import { CurriculumNavigator } from './features/lessons/components/curriculum-navigator'
import { LessonActionBar } from './features/lessons/components/lesson-action-bar'
import './App.css'

function App() {
  const session = useLearningSession()
  const { activeLesson, activeModule, activeStep, activity } = session
  const stepNumber = session.stepIndex + 1

  const handleResetProgress = () => {
    if (!window.confirm('Reset your lesson progress and saved work?')) return
    session.resetProgress()
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-ink text-mist shadow-sm" aria-hidden="true">
              <Code2 size={19} strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-[-0.02em]">Python Steps</p>
              <p className="hidden text-xs text-muted sm:block">Small steps. Real Python.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="max-w-[12rem] text-right sm:max-w-none">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-muted sm:text-xs sm:tracking-[0.13em]">
                Module {activeModule.order} · Lesson {activeLesson.order} of {activeModule.lessons.length}
              </p>
              <div className="ml-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-line sm:w-32" aria-label={`${session.moduleProgress.completedCount} of ${session.moduleProgress.availableCount} available lessons complete`}>
                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${session.moduleProgress.availableCount ? session.moduleProgress.completedCount / session.moduleProgress.availableCount * 100 : 0}%` }} />
              </div>
              <p className="mt-1 hidden text-[10px] leading-4 text-muted/60 sm:block">Nothing leaves this browser · progress saved on this device.</p>
            </div>
            <Button type="button" variant="quiet" size="sm" onClick={handleResetProgress} className="hidden min-h-10 sm:inline-flex">
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-0 lg:grid-cols-[auto_minmax(0,1fr)]">
        <CurriculumNavigator
          key={activeModule.id}
          curriculum={session.curriculum}
          currentLessonId={activeLesson.id}
          completedLessonIds={session.completedLessonIds}
          onSelect={session.selectLesson}
        />

        <section className="min-w-0 px-4 pb-8 pt-5 sm:px-7 sm:pt-7 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="mb-5 sm:mb-7">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <Badge>Lesson {activeLesson.order} · Step {stepNumber}</Badge>
                <span className="text-sm font-medium text-muted">{activeLesson.summary}</span>
              </div>
              <h1 className="font-display text-[clamp(2rem,5vw,3.35rem)] font-bold leading-[1.04] tracking-[-0.055em] text-ink">{activeLesson.title}</h1>
              {activeStep?.content.length === 0 ? <p className="mt-3 text-sm text-muted">{activeLesson.learningGoal}</p> : null}
            </div>

            <div className="space-y-4">
              {activeStep?.content.map((block, index) => <ContentBlockView key={`${activeStep.id}-${index}`} block={block} />)}

              {activity ? (
                <ActivityRenderer
                  key={activity.id}
                  activity={activity}
                  response={session.response}
                  onResponseChange={session.changeResponse}
                  onAssessResponse={session.assessResponse}
                  code={session.code}
                  onCodeChange={session.changeCode}
                  onResetCode={session.resetCode}
                  onRun={session.runActivity}
                  isRunning={session.isRunning}
                  runtimeReady={session.runtimeReady}
                  runtimeError={session.runtimeError}
                  execution={session.execution}
                  feedback={session.feedback}
                  hintsRevealed={session.hintsRevealed}
                  onRevealHint={session.revealHint}
                  onCompleteTrace={session.completeTrace}
                  input={session.inputInteraction}
                />
              ) : (
                <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">Take a moment to read this step, then continue when you are ready.</div>
              )}
            </div>
          </div>
        </section>
      </main>

      <LessonActionBar
        stepIndex={session.stepIndex}
        totalSteps={session.totalSteps}
        completedActivities={session.completedRequiredActivities}
        requiredActivities={session.requiredActivities}
        canGoPrevious={session.canGoPrevious}
        canGoNext={session.canGoNext}
        nextLabel={session.nextLabel}
        isBusy={session.isBusy}
        isLessonComplete={session.isLessonDone}
        runtimeStatus={session.runtimeStatus}
        onPrevious={session.goPrevious}
        onNext={session.goNext}
      />
    </div>
  )
}

export default App
