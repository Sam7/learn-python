import { CheckCircle2, CircleAlert, LoaderCircle, Terminal } from 'lucide-react'
import type { PythonRunResult } from '../../python/python-runner/types'
import { cn } from '../../../lib/utils'

interface OutputPanelProps {
  execution: PythonRunResult | null
  isRunning: boolean
}

export function OutputPanel({ execution, isRunning }: OutputPanelProps) {
  const hasOutput = Boolean(execution?.stdout || execution?.stderr || execution?.inputTranscript.length)
  const isError = execution?.status === 'error' || execution?.status === 'timeout' || execution?.status === 'cancelled'

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white" aria-live="polite" aria-label="Python output">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Terminal size={17} className="text-teal" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">Output</h2>
        </div>
        {execution?.status === 'success' && !isRunning ? <CheckCircle2 size={18} className="text-teal" aria-label="Run succeeded" /> : null}
        {isError && !isRunning ? <CircleAlert size={18} className="text-coral" aria-label="Run failed" /> : null}
        {isRunning ? <LoaderCircle size={18} className="animate-spin text-teal" aria-label="Running" /> : null}
      </div>
      <div className={cn('min-h-[112px] p-5', isError && 'bg-coral/[0.035]')}>
        {isRunning ? (
          <p className="text-sm text-muted">Running your Python…</p>
        ) : !execution ? (
          <p className="text-sm leading-6 text-muted">Run your code to see what Python says.</p>
        ) : isError ? (
          <div>
            <p className="mb-3 text-sm font-semibold text-coral">{friendlyError(execution)}</p>
            {execution.inputTranscript.length ? (
              <InputTranscript entries={execution.inputTranscript} />
            ) : null}
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#fff7f3] p-3 font-mono text-xs leading-5 text-[#7e3e30]">{execution.error || execution.stderr || 'Python reported an unknown error.'}</pre>
          </div>
        ) : hasOutput ? (
          <div>
            <InputTranscript entries={execution.inputTranscript} />
            {execution.stdout ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-7 text-ink">{execution.stdout}</pre> : null}
            <p className="mt-3 text-xs text-muted">Finished in {execution.durationMs} ms</p>
          </div>
        ) : (
          <p className="font-mono text-sm text-muted">(no output)</p>
        )}
      </div>
    </section>
  )
}

function friendlyError(execution: PythonRunResult): string {
  if (execution.status === 'cancelled') return 'The run was cancelled.'
  if (execution.error?.includes('EOF when reading a line')) {
    return 'Python asked for another answer. Add another line of input and run it again.'
  }
  if (execution.status === 'timeout' && execution.error?.includes('answer')) {
    return 'Python waited for an answer for too long. Run it again when you are ready.'
  }
  return 'Python couldn’t run this yet. Take a look at the error below.'
}

function InputTranscript({ entries }: { entries: PythonRunResult['inputTranscript'] }) {
  if (!entries.length) return null

  return (
    <div className="mb-3 rounded-xl bg-[#f7faf8] p-3 font-mono text-xs leading-6 text-muted">
      {entries.map((entry) => (
        <div key={entry.inputIndex}>
          <span className="text-teal-dark">{entry.prompt || 'Input'} </span>
          <span className="text-ink">{entry.answer}</span>
        </div>
      ))}
    </div>
  )
}
