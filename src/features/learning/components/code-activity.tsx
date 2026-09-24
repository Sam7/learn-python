import { Play, RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { CodeActivity, ValidationResult } from '../../../curriculum/types'
import type { PythonInputRequest, PythonRunResult } from '../../python/python-runner/types'
import { InputPanel } from '../../python/components/input-panel'
import { CodeEditor } from '../../lessons/components/code-editor'
import { ActivityHints } from './activity-hints'
import { ExecutionOutput } from './execution-output'

export interface InputInteractionProps {
  interactive: boolean
  transcriptValue: string
  onTranscriptChange: (value: string) => void
  pendingRequest: PythonInputRequest | null
  answerValue: string
  onAnswerChange: (value: string) => void
  onSubmitAnswer: () => void
  onCancelRun: () => void
}

interface CodeActivityProps {
  activity: CodeActivity
  code: string
  onCodeChange: (code: string) => void
  onReset: () => void
  onRun: () => void
  isRunning: boolean
  runtimeReady: boolean
  runtimeError?: string
  execution: PythonRunResult | null
  feedback: ValidationResult | null
  hintsRevealed: number
  onRevealHint: () => void
  input: InputInteractionProps
}

export function CodeActivityView({
  activity,
  code,
  onCodeChange,
  onReset,
  onRun,
  isRunning,
  runtimeReady,
  runtimeError,
  execution,
  feedback,
  hintsRevealed,
  onRevealHint,
  input,
}: CodeActivityProps) {
  return (
    <section className="rounded-xl border border-teal/20 bg-white p-3.5 shadow-[0_8px_28px_rgba(40,127,120,0.05)] sm:p-4" aria-label={activity.title}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-ink">{activity.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="quiet" size="sm" className="min-h-10 shrink-0" onClick={onReset} disabled={isRunning}>
            <RotateCcw size={14} aria-hidden="true" /> Reset code
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-10 shrink-0 bg-teal px-4 text-white hover:bg-teal/90 focus-visible:ring-teal"
            onClick={onRun}
            disabled={isRunning || !runtimeReady}
          >
            {!isRunning ? <Play size={15} fill="currentColor" aria-hidden="true" /> : null}
            {isRunning ? 'Running…' : 'Run code'}
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)]">
        <div className="min-w-0 rounded-xl border border-line bg-[#142321] p-2">
          <label htmlFor="python-editor" className="sr-only">Your Python code</label>
          <div id="python-editor"><CodeEditor value={code} onChange={onCodeChange} /></div>
          {input.interactive ? null : (
            <div className="mt-2 rounded-lg bg-paper p-2 text-ink">
              <InputPanel {...input} />
            </div>
          )}
          {input.interactive && input.pendingRequest ? <InputPanel {...input} /> : null}
          {runtimeError ? <p className="mt-2 text-xs text-coral" role="alert">{runtimeError}</p> : null}
        </div>
        <ExecutionOutput
          execution={execution}
          isRunning={isRunning}
          feedback={feedback}
          expectedRuntimeError={activity.assessment.kind === 'runtime-error' ? activity.assessment.exceptionName : undefined}
          expectedTimeout={activity.assessment.kind === 'timeout'}
        />
      </div>

      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}
