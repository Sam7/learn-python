import { CornerDownLeft, Terminal, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { PythonInputRequest } from '../python-runner/types'

interface InputPanelProps {
  interactive: boolean
  transcriptValue: string
  onTranscriptChange: (value: string) => void
  pendingRequest: PythonInputRequest | null
  answerValue: string
  onAnswerChange: (value: string) => void
  onSubmitAnswer: () => void
  onCancelRun: () => void
}

export function InputPanel({
  interactive,
  transcriptValue,
  onTranscriptChange,
  pendingRequest,
  answerValue,
  onAnswerChange,
  onSubmitAnswer,
  onCancelRun,
}: InputPanelProps) {
  if (!interactive) {
    return (
      <section className="mb-4 rounded-xl border border-line bg-mist/60 p-3.5" aria-label="Program input">
        <label htmlFor="program-input" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
          <Terminal size={14} aria-hidden="true" /> Program input
        </label>
        <textarea
          id="program-input"
          aria-label="Program input"
          className="mt-2 min-h-20 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm leading-6 text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
          value={transcriptValue}
          onChange={(event) => onTranscriptChange(event.target.value)}
          placeholder="One answer per line"
          spellCheck={false}
        />
        <p className="mt-2 text-xs leading-5 text-muted">Each line answers the next input() or line-read call. Blank lines count as empty answers.</p>
      </section>
    )
  }

  if (!pendingRequest) return null

  return (
    <section className="mb-4 rounded-xl border border-teal/30 bg-mist p-4" aria-live="assertive" aria-label="Python is waiting for input">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal" aria-hidden="true">
          <Terminal size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-teal-dark">Python is asking for an answer</p>
          <p className="mt-1 break-words font-mono text-sm text-ink">{pendingRequest.prompt || 'Enter a value'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              autoFocus
              aria-label={`Answer ${pendingRequest.inputIndex + 1}`}
              className="min-w-[12rem] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
              value={answerValue}
              onChange={(event) => onAnswerChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSubmitAnswer()
              }}
            />
            <Button type="button" size="sm" onClick={onSubmitAnswer}>
              Send answer <CornerDownLeft size={15} aria-hidden="true" />
            </Button>
            <Button type="button" variant="quiet" size="sm" onClick={onCancelRun}>
              <X size={15} aria-hidden="true" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
