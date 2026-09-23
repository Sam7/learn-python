import type { ValidationResult } from '../../../curriculum/types'

export function ActivityFeedback({ feedback }: { feedback: ValidationResult | null }) {
  if (!feedback) return null

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-sm leading-5 ${feedback.passed ? 'border-teal/25 bg-mist text-teal-dark' : 'border-coral/20 bg-coral/5 text-[#8f4638]'}`} role="status">
      <p>{feedback.message}</p>
      {feedback.evidence ? (
        <div className="mt-2 grid gap-x-3 gap-y-1 font-mono text-xs sm:grid-cols-[auto_1fr]">
          <span className="font-sans font-semibold">Expected</span><span className="whitespace-pre-wrap break-words">{feedback.evidence.expected}</span>
          <span className="font-sans font-semibold">Your answer</span><span className="whitespace-pre-wrap break-words">{feedback.evidence.actual}</span>
        </div>
      ) : null}
    </div>
  )
}
