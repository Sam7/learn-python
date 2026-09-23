import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type {
  ArrangeCodeActivity,
  ChoiceActivity,
  LearningActivity,
  LearnerResponse,
  PredictOutputActivity,
  PredictStateActivity,
  ReflectionActivity,
  TraceActivity,
  ValidationResult,
} from '../../../curriculum/types'
import type { PythonRunResult } from '../../python/python-runner/types'
import { CodeActivityView, type InputInteractionProps } from './code-activity'
import { ActivityHints } from './activity-hints'
import { CompactCode } from './compact-code'
import { ExecutionOutput } from './execution-output'

export interface ActivityRendererProps {
  activity: LearningActivity
  response?: LearnerResponse
  onResponseChange: (response: LearnerResponse) => void
  onAssessResponse: (response: LearnerResponse) => void
  code: string
  onCodeChange: (code: string) => void
  onResetCode: () => void
  onRun: () => void
  isRunning: boolean
  runtimeReady: boolean
  runtimeError?: string
  execution: PythonRunResult | null
  feedback: ValidationResult | null
  hintsRevealed: number
  onRevealHint: () => void
  onCompleteTrace: () => void
  input: InputInteractionProps
}

export function ActivityRenderer(props: ActivityRendererProps) {
  const { activity, onResetCode, ...shared } = props
  switch (activity.kind) {
    case 'code':
      return <CodeActivityView {...shared} activity={activity} onReset={onResetCode} />
    case 'predict-output':
      return <PredictOutputView {...shared} activity={activity} />
    case 'predict-state':
      return <PredictStateView {...shared} activity={activity} />
    case 'choice':
      return <ChoiceView {...shared} activity={activity} />
    case 'arrange-code':
      return <ArrangeCodeView {...shared} activity={activity} />
    case 'trace':
      return <TraceView {...shared} activity={activity} />
    case 'reflection':
      return <ReflectionView {...shared} activity={activity} />
  }
}

type SharedActivityProps = Omit<ActivityRendererProps, 'activity' | 'onResetCode'>

function PredictOutputView({ activity, response, onResponseChange, onRun, isRunning, runtimeReady, execution, feedback, hintsRevealed, onRevealHint }: SharedActivityProps & { activity: PredictOutputActivity }) {
  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <div className="mb-3">
        <h2 className="text-base font-bold text-ink">{activity.title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.9fr)]">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">Program</p>
            <CompactCode code={activity.code} />
          </div>
          <label className="block text-sm font-semibold text-ink">
            What do you think it will print?
            <textarea
              aria-label="Your output prediction"
              className="mt-1.5 min-h-16 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm leading-5 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              value={typeof response === 'string' ? response : ''}
              onChange={(event) => onResponseChange(event.target.value)}
              spellCheck={false}
            />
          </label>
          <Button type="button" size="sm" className="min-h-10" disabled={isRunning || !runtimeReady || typeof response !== 'string' || !response.trim()} onClick={onRun}>
            {isRunning ? 'Running…' : 'Run and compare'}
          </Button>
        </div>
        <ExecutionOutput execution={execution} isRunning={isRunning} feedback={feedback} />
      </div>
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}

function PredictStateView({ activity, response, onResponseChange, onRun, isRunning, runtimeReady, execution, feedback, hintsRevealed, onRevealHint }: SharedActivityProps & { activity: PredictStateActivity }) {
  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <div className="mb-3">
        <h2 className="text-base font-bold text-ink">{activity.title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.9fr)]">
        <div className="space-y-3">
          <CompactCode code={activity.code} />
          <fieldset className="space-y-1.5">
            <legend className="mb-2 text-sm font-semibold text-ink">What value will {activity.variable} have after line {activity.line}?</legend>
            {activity.choices.map((choice) => (
              <label key={choice} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 text-sm text-ink hover:bg-mist/50">
                <input type="radio" name={`prediction-${activity.id}`} value={choice} checked={response === choice} onChange={() => onResponseChange(choice)} className="accent-teal" />
                <span className="font-mono">{choice}</span>
              </label>
            ))}
          </fieldset>
          <Button type="button" size="sm" className="min-h-10" disabled={isRunning || !runtimeReady || typeof response !== 'string'} onClick={onRun}>
            {isRunning ? 'Tracing…' : 'Run and compare'}
          </Button>
        </div>
        <ExecutionOutput execution={execution} isRunning={isRunning} feedback={feedback} />
      </div>
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}

function ChoiceView({ activity, response, onAssessResponse, hintsRevealed, onRevealHint }: SharedActivityProps & { activity: ChoiceActivity }) {
  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <h2 className="text-base font-bold text-ink">{activity.title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Choose an answer</legend>
        {activity.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={response === option.id}
            className={`min-h-12 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${response === option.id ? 'border-teal bg-mist text-ink' : 'border-line bg-white text-ink hover:bg-mist/50'}`}
            onClick={() => onAssessResponse(option.id)}
          >
            {option.text}
          </button>
        ))}
      </fieldset>
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}

function ArrangeCodeView({ activity, response, onAssessResponse, hintsRevealed, onRevealHint }: SharedActivityProps & { activity: ArrangeCodeActivity }) {
  const order = Array.isArray(response) ? response : activity.startingOrder
  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= order.length) return
    const next = [...order]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    onAssessResponse(next)
  }

  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <h2 className="text-base font-bold text-ink">{activity.title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      <ol className="mt-3 space-y-2" aria-label="Reorder these code lines">
        {order.map((id, index) => {
          const fragment = activity.fragments.find((item) => item.id === id)
          return (
            <li key={id} className="flex min-h-12 items-center gap-2 rounded-lg border border-line bg-[#f4f8f6] p-1.5">
              <span className="min-w-6 text-center text-xs text-muted">{index + 1}</span>
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre font-mono text-sm text-ink">{fragment?.code}</code>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="quiet" size="sm" className="size-10 px-0" aria-label={`Move line ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} aria-hidden="true" /></Button>
                <Button type="button" variant="quiet" size="sm" className="size-10 px-0" aria-label={`Move line ${index + 1} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} aria-hidden="true" /></Button>
              </div>
            </li>
          )
        })}
      </ol>
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}

function TraceView({ activity, onRun, isRunning, runtimeReady, execution, feedback, onCompleteTrace, hintsRevealed, onRevealHint }: SharedActivityProps & { activity: TraceActivity }) {
  const frames = execution?.traceFrames ?? []
  const [tracePosition, setTracePosition] = useState<{ execution: PythonRunResult | null; index: number }>({ execution: null, index: 0 })
  const frameIndex = tracePosition.execution === execution ? tracePosition.index : 0
  const setFrameIndex = (index: number) => setTracePosition({ execution, index })
  const frame = frames[frameIndex]
  const isLastFrame = frames.length > 0 && frameIndex === frames.length - 1

  const advance = () => {
    if (isLastFrame) {
      onCompleteTrace()
    } else {
      setFrameIndex(Math.min(frameIndex + 1, frames.length - 1))
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">{activity.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
        </div>
        <Button type="button" size="sm" className="min-h-10" disabled={isRunning || !runtimeReady} onClick={onRun}>
          {isRunning ? 'Running…' : 'Run and trace'}
        </Button>
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.9fr)]">
        <div className="min-w-0">
          <TraceCode code={activity.code} activeLine={frame?.line} />
          {frame ? (
            <div className="mt-2 rounded-lg border border-line bg-paper p-3" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted">Step {frameIndex + 1} of {frames.length} · line {frame.line}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="quiet" size="sm" className="size-10 px-0" aria-label="Previous execution step" disabled={frameIndex === 0} onClick={() => setFrameIndex(Math.max(frameIndex - 1, 0))}><ChevronLeft size={16} aria-hidden="true" /></Button>
                  <Button type="button" variant="quiet" size="sm" className="size-10 px-0" aria-label={isLastFrame ? 'Finish trace' : 'Next execution step'} onClick={advance}><ChevronRight size={16} aria-hidden="true" /></Button>
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-xs">
                {Object.entries(frame.locals).map(([name, value]) => (
                  <TraceLocal key={name} name={name} value={value} />
                ))}
                {Object.keys(frame.locals).length === 0 ? <dt className="col-span-2 text-muted">No named values yet.</dt> : null}
              </dl>
            </div>
          ) : null}
        </div>
        <ExecutionOutput execution={execution} isRunning={isRunning} feedback={feedback} />
      </div>
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}

function ReflectionView({ activity, response, onResponseChange }: SharedActivityProps & { activity: ReflectionActivity }) {
  return (
    <section className="rounded-xl border border-line bg-mist/50 p-3.5 sm:p-4" aria-label={activity.title}>
      <h2 className="text-base font-bold text-ink">{activity.title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      <label className="mt-3 block">
        <span className="sr-only">Your reflection</span>
        <textarea
          aria-label="Your reflection"
          className="min-h-20 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm leading-5 text-ink outline-none placeholder:text-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder={activity.placeholder ?? 'Write a thought, or leave this blank and continue.'}
          value={typeof response === 'string' ? response : ''}
          onChange={(event) => onResponseChange(event.target.value)}
        />
      </label>
      <p className="mt-1 text-xs text-muted">This is for your own thinking. It is not graded.</p>
    </section>
  )
}

function TraceCode({ code, activeLine }: { code: string; activeLine?: number }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-line bg-[#f4f8f6] p-3 font-mono text-sm leading-6 text-ink"><code>
      {code.split('\n').map((line, index) => (
        <span key={`${index}-${line}`} className={`block whitespace-pre ${activeLine === index + 1 ? 'rounded bg-teal/10 text-teal-dark' : ''}`}><span className="mr-3 inline-block w-5 select-none text-right text-muted/70">{index + 1}</span>{line || ' '}</span>
      ))}
    </code></pre>
  )
}

function TraceLocal({ name, value }: { name: string; value: unknown }) {
  return <>
    <dt className="text-muted">{name}</dt>
    <dd className="max-w-40 overflow-hidden text-ellipsis whitespace-nowrap text-ink">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
  </>
}
