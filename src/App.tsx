import { useCallback, useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronRight, Code2, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { CodeEditor } from './features/lessons/components/code-editor'
import { CurriculumNavigator } from './features/lessons/components/curriculum-navigator'
import { HintPanel } from './features/lessons/components/hint-panel'
import { OutputPanel } from './features/lessons/components/output-panel'
import {
  allLessons,
  curriculum,
  getLessonById,
  getLessonLocation,
  getNextLesson,
  getPreviousLesson,
  getModuleProgress,
} from './curriculum/curriculum'
import type { Lesson } from './curriculum/types'
import { validateLesson } from './features/lessons/validators/lesson-validator'
import { usePythonRunner } from './features/python/python-runner/use-python-runner'
import type { PythonRunResult } from './features/python/python-runner/types'
import { createProgressRepository, type LearnerProgress } from './features/progress/progress-store'
import './App.css'

type WorkflowState = 'idle' | 'executing' | 'executionSucceeded' | 'executionFailed' | 'validating' | 'lessonPassed'

function App() {
  const repository = useMemo(
    () => createProgressRepository(window.localStorage, allLessons),
    [],
  )
  const initialProgress = useMemo(() => repository.load(), [repository])
  const [progress, setProgress] = useState<LearnerProgress>(initialProgress)
  const [code, setCode] = useState(() => {
    const initialLesson = getLessonById(initialProgress.currentLessonId) ?? allLessons[0]
    return initialProgress.lessonCode[initialLesson.id] ?? initialLesson.starterCode
  })
  const [execution, setExecution] = useState<PythonRunResult | null>(null)
  const [lastRunCode, setLastRunCode] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<{ passed: boolean; message: string } | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowState>('idle')
  const [visibleHints, setVisibleHints] = useState(0)
  const { run, runtimeStatus, runtimeError } = usePythonRunner()

  const activeLesson: Lesson = getLessonById(progress.currentLessonId) ?? allLessons[0]
  const activeLocation = getLessonLocation(activeLesson.id)
  const activeModule = activeLocation?.module ?? curriculum.modules[0]
  const moduleProgress = getModuleProgress(activeModule, progress.completedLessonIds)
  const nextLesson = getNextLesson(activeLesson.id)
  const isBusy = workflow === 'executing' || workflow === 'validating'
  const isCurrentCompleted = progress.completedLessonIds.includes(activeLesson.id)

  const updateProgress = useCallback((update: (current: LearnerProgress) => LearnerProgress) => {
    setProgress((current) => {
      const next = update(current)
      repository.save(next)
      return next
    })
  }, [repository])

  const selectLesson = useCallback((lessonId: string) => {
    const selected = getLessonById(lessonId)
    if (!selected || selected.status !== 'ready') return
    const previousLesson = getPreviousLesson(selected.id)
    const canOpen = !previousLesson || progress.completedLessonIds.includes(previousLesson.id)
    if (!canOpen) return
    setCode(progress.lessonCode[lessonId] ?? selected.starterCode)
    setExecution(null)
    setLastRunCode(null)
    setValidationMessage(null)
    setWorkflow('idle')
    setVisibleHints(0)
    updateProgress((current) => ({ ...current, currentLessonId: lessonId }))
  }, [progress.completedLessonIds, progress.lessonCode, updateProgress])

  const handleCodeChange = (value: string) => {
    setCode(value)
    updateProgress((current) => ({
      ...current,
      lessonCode: { ...current.lessonCode, [activeLesson.id]: value },
    }))
    setValidationMessage(null)
  }

  const handleRun = async () => {
    setWorkflow('executing')
    setValidationMessage(null)
    const result = await run({ code })
    setExecution(result)
    setLastRunCode(code)
    setWorkflow(result.status === 'success' ? 'executionSucceeded' : 'executionFailed')
  }

  const handleCheck = async () => {
    if (!execution || lastRunCode !== code) {
      setValidationMessage({ passed: false, message: 'Run this version of your code before checking it.' })
      return
    }
    setWorkflow('validating')
    const result = await validateLesson(activeLesson, {
      code,
      execution,
      runValidationCode: async (validationCode) => run({ code: validationCode }),
    })
    setValidationMessage(result)
    if (result.passed) {
      updateProgress((current) => ({
        ...current,
        completedLessonIds: current.completedLessonIds.includes(activeLesson.id)
          ? current.completedLessonIds
          : [...current.completedLessonIds, activeLesson.id],
      }))
      setWorkflow('lessonPassed')
    } else {
      setWorkflow(execution.status === 'success' ? 'executionSucceeded' : 'executionFailed')
    }
  }

  const handleResetCode = () => {
    setCode(activeLesson.starterCode)
    updateProgress((current) => {
      const nextCode = { ...current.lessonCode }
      delete nextCode[activeLesson.id]
      return { ...current, lessonCode: nextCode }
    })
    setExecution(null)
    setLastRunCode(null)
    setValidationMessage(null)
    setWorkflow('idle')
    setVisibleHints(0)
  }

  const handleResetProgress = () => {
    if (!window.confirm('Reset your lesson progress and saved code?')) return
    const next = repository.reset()
    setProgress(next)
    setCode(allLessons[0].starterCode)
    setExecution(null)
    setLastRunCode(null)
    setValidationMessage(null)
    setWorkflow('idle')
    setVisibleHints(0)
  }

  const handleNextLesson = () => {
    if (nextLesson) selectLesson(nextLesson.id)
  }

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] max-w-[1400px] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
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
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted">Module {activeModule.order} · Lesson {activeLesson.order} of {activeModule.lessons.length}</p>
              <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-line sm:w-32" aria-label={`${moduleProgress.completedCount} of ${moduleProgress.availableCount} available lessons complete`}>
                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(moduleProgress.completedCount / moduleProgress.availableCount) * 100}%` }} />
              </div>
            </div>
            <Button type="button" variant="quiet" size="sm" onClick={handleResetProgress} className="hidden sm:inline-flex">
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-7 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:py-10">
        <CurriculumNavigator
          curriculum={curriculum}
          currentLessonId={activeLesson.id}
          completedLessonIds={progress.completedLessonIds}
          onSelect={selectLesson}
        />

        <div className="min-w-0">
          <div className="mb-7 max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge>Step {activeLesson.order}</Badge>
              <span className="text-sm font-medium text-muted">{activeLesson.summary}</span>
            </div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.055em] text-ink">{activeLesson.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{activeLesson.explanation.lead}</p>
            {activeLesson.explanation.notes?.length ? (
              <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
                {activeLesson.explanation.notes.map((note) => <li key={note} className="before:mr-2 before:text-teal before:content-['•']">{note}</li>)}
              </ul>
            ) : null}
          </div>

          <div className="grid max-w-4xl gap-5">
            {activeLesson.exampleCode ? (
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-line/80 py-4">
                  <CardTitle className="text-sm uppercase tracking-[0.14em] text-muted">Example</CardTitle>
                  <span className="font-mono text-xs text-muted">Python</span>
                </CardHeader>
                <CardContent className="bg-[#f7faf8] py-4 sm:py-5">
                  <pre className="overflow-x-auto whitespace-pre font-mono text-sm leading-7 text-ink"><code>{activeLesson.exampleCode}</code></pre>
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-teal/20 shadow-[0_10px_35px_rgba(40,127,120,0.07)]">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal" aria-hidden="true"><Sparkles size={16} /></div>
                  <div>
                    <CardTitle>Try it yourself</CardTitle>
                    <p className="mt-1 text-sm leading-6 text-muted">{activeLesson.task}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <label htmlFor="python-editor" className="sr-only">Your Python code</label>
                <div id="python-editor">
                  <CodeEditor value={code} onChange={handleCodeChange} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button type="button" size="lg" onClick={handleRun} disabled={isBusy || runtimeStatus !== 'ready'}>
                    {workflow === 'executing' ? 'Running…' : 'Run code'} <ArrowRight size={17} aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="secondary" size="lg" onClick={handleCheck} disabled={isBusy || runtimeStatus !== 'ready'}>
                    <Check size={17} aria-hidden="true" /> Check answer
                  </Button>
                  <Button type="button" variant="quiet" size="lg" onClick={handleResetCode} disabled={isBusy}>Reset code</Button>
                  <span className="basis-full text-xs text-muted sm:basis-auto sm:ml-auto">
                    {runtimeStatus === 'loading' ? 'Preparing Python…' : runtimeStatus === 'error' ? 'Python could not start.' : 'Python runs in your browser.'}
                  </span>
                </div>
                {runtimeStatus === 'error' && runtimeError ? <p className="mt-3 text-sm text-coral" role="alert">{runtimeError}</p> : null}
                {validationMessage ? (
                  <div className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${validationMessage.passed ? 'border-teal/25 bg-mist text-teal-dark' : 'border-coral/25 bg-coral/5 text-coral'}`} role="status">
                    {validationMessage.message}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <OutputPanel execution={execution} isRunning={workflow === 'executing'} />

            <HintPanel hints={activeLesson.hints} visibleCount={visibleHints} onReveal={() => setVisibleHints((count) => Math.min(count + 1, activeLesson.hints.length))} />

            {workflow === 'lessonPassed' || isCurrentCompleted ? (
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-teal/25 bg-mist p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-teal-dark"><Check size={17} aria-hidden="true" /> Lesson complete</p>
                  <p className="mt-1 text-sm leading-6 text-muted">You can revisit this step any time.</p>
                </div>
                {nextLesson ? <Button type="button" size="lg" onClick={handleNextLesson}>Next lesson <ChevronRight size={18} aria-hidden="true" /></Button> : (
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-teal-dark">Chapter complete</p>
                    <p className="mt-1 text-xs leading-5 text-muted">You finished the available fundamentals lessons. More lessons are coming soon.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-[1400px] px-5 pb-8 pt-1 text-xs text-muted sm:px-8 lg:px-10">
        Nothing leaves this browser. Your progress is saved on this device.
      </footer>
    </div>
  )
}

export default App
