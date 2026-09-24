import type { FormEvent } from 'react'
import { Button } from '../../../components/ui/button'
import type { LearnerResponse, PlanningActivity, ValidationResult } from '../../../curriculum/types'
import { ActivityFeedback } from './activity-feedback'
import { ActivityHints } from './activity-hints'

function responseRecord(response: LearnerResponse | undefined): Record<string, string> {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return {}
  return response
}

export function PlanningActivityView({
  activity,
  response,
  onResponseChange,
  onAssessResponse,
  feedback,
  hintsRevealed,
  onRevealHint,
}: {
  activity: PlanningActivity
  response?: LearnerResponse
  onResponseChange: (response: LearnerResponse) => void
  onAssessResponse: (response: LearnerResponse) => void
  feedback: ValidationResult | null
  hintsRevealed: number
  onRevealHint: () => void
}) {
  const values = responseRecord(response)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAssessResponse(values)
  }

  return (
    <section className="rounded-xl border border-line bg-white p-3.5 sm:p-4" aria-label={activity.title}>
      <div className="mb-3">
        <h2 className="text-base font-bold text-ink">{activity.title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
      </div>
      <form onSubmit={submit}>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {activity.fields.map((field) => {
            const inputId = `${activity.id}-${field.id}`
            return (
              <label key={field.id} htmlFor={inputId} className="block min-w-0">
                <span className="text-sm font-semibold text-ink">
                  {field.label}
                  <span className="ml-1 text-xs font-normal text-muted">{field.required ? '(required)' : '(optional)'}</span>
                </span>
                {field.prompt ? <span className="mt-0.5 block text-xs leading-5 text-muted">{field.prompt}</span> : null}
                <textarea
                  id={inputId}
                  aria-required={field.required}
                  className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm leading-5 text-ink outline-none placeholder:text-muted/70 focus:border-teal focus:ring-2 focus:ring-teal/20"
                  placeholder={field.placeholder ?? 'Write your idea here…'}
                  rows={field.rows ?? 3}
                  value={values[field.id] ?? ''}
                  onChange={(event) => onResponseChange({ ...values, [field.id]: event.target.value })}
                />
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">Your ideas are not graded. Fill each required section to save your plan.</p>
        <Button type="submit" size="sm" className="mt-3 min-h-10">{activity.submitLabel ?? 'Save plan'}</Button>
      </form>
      {feedback ? <div className="mt-3"><ActivityFeedback feedback={feedback} /></div> : null}
      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}
