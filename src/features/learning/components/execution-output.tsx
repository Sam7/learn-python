import { CheckCircle2, CircleAlert, LoaderCircle, Terminal } from 'lucide-react'
import type { PythonRunResult } from '../../python/python-runner/types'
import type { ValidationResult } from '../../../curriculum/types'
import { ActivityFeedback } from './activity-feedback'

interface ExecutionOutputProps {
  execution: PythonRunResult | null
  isRunning: boolean
  feedback: ValidationResult | null
  expectedRuntimeError?: string
  expectedTimeout?: boolean
}

export function ExecutionOutput({ execution, isRunning, feedback, expectedRuntimeError, expectedTimeout }: ExecutionOutputProps) {
  const failed = execution?.status === 'error' || execution?.status === 'timeout' || execution?.status === 'cancelled'
  const expectedErrorObserved = Boolean(
    expectedRuntimeError
    && feedback?.passed
    && execution?.status === 'error'
    && execution.error?.split('\n').some((line) => line.trimStart().startsWith(`${expectedRuntimeError}:`)),
  )
  const expectedTimeoutObserved = Boolean(expectedTimeout && feedback?.passed && execution?.status === 'timeout')
  const expectedProblemObserved = expectedErrorObserved || expectedTimeoutObserved

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-line bg-white" aria-label="Python output" aria-live="polite">
      <div className="flex min-h-11 items-center justify-between border-b border-line/80 px-3.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
          <Terminal size={15} className="text-teal" aria-hidden="true" />
          Output
        </div>
        {isRunning ? <LoaderCircle size={16} className="animate-spin text-teal" aria-label="Python is running" /> : null}
        {!isRunning && (execution?.status === 'success' || expectedProblemObserved) ? <CheckCircle2 size={16} className="text-teal" aria-label={expectedProblemObserved ? 'Expected Python result observed' : 'Run succeeded'} /> : null}
        {!isRunning && failed && !expectedProblemObserved ? <CircleAlert size={16} className="text-coral" aria-label="Run failed" /> : null}
      </div>

      <div className="min-h-40 p-3.5 sm:min-h-48">
        {isRunning ? (
          <p className="text-sm text-muted">Running your Python…</p>
        ) : !execution ? (
          <p className="text-sm leading-6 text-muted">Run the task to see what Python says.</p>
        ) : (
          <>
            {execution.stdout ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-ink">{execution.stdout}</pre> : null}
            {failed ? (
              <div className={`mt-2 rounded-lg border p-3 ${expectedProblemObserved ? 'border-teal/25 bg-mist' : 'border-coral/20 bg-coral/5'}`}>
                <p className={`text-sm font-semibold ${expectedProblemObserved ? 'text-teal-dark' : 'text-coral'}`}>
                  {expectedErrorObserved
                    ? `Python raised ${expectedRuntimeError}, as expected.`
                    : expectedTimeoutObserved
                      ? 'Python stopped this program at the time limit, as expected.'
                      : friendlyError(execution)}
                </p>
                <pre className={`mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 ${expectedProblemObserved ? 'text-ink' : 'text-[#7e3e30]'}`}>{execution.error || execution.stderr || 'Python reported an unknown error.'}</pre>
              </div>
            ) : !execution.stdout ? (
              <p className="font-mono text-sm text-muted">(no output)</p>
            ) : null}
            {!failed ? <p className="mt-2 text-[11px] text-muted">Finished in {execution.durationMs} ms</p> : null}
          </>
        )}

        {feedback ? <div className="mt-3"><ActivityFeedback feedback={feedback} /></div> : null}
      </div>
    </section>
  )
}

function friendlyError(execution: PythonRunResult): string {
  if (execution.status === 'cancelled') return 'This run was cancelled.'
  if (execution.status === 'timeout' && execution.error?.includes('answer')) return 'Python waited too long for an answer. Run it again when you are ready.'
  if (execution.status === 'timeout') return 'This program took too long. It may contain an endless loop.'
  if (execution.error?.includes('EOF when reading a line')) return 'Python asked for another answer. Add another input line and run it again.'
  return 'Python couldn’t run this yet. Take a look at the error below.'
}
