import type { LearnerResponse, PlanningActivity, ValidationResult } from '../../../curriculum/types'

function responseRecord(response: LearnerResponse | undefined): Record<string, string> {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return {}
  return response
}

export function validatePlanningActivity(activity: PlanningActivity, response: LearnerResponse | undefined): ValidationResult {
  const requiredFields = activity.fields.filter((field) => field.required)
  if (requiredFields.length === 0) {
    return { passed: false, message: 'This planning activity needs at least one required section.' }
  }

  const answers = responseRecord(response)
  const missingField = requiredFields.find((field) => !answers[field.id]?.trim())
  if (missingField) {
    return { passed: false, message: `Add a note for “${missingField.label}” before saving your plan.` }
  }

  return {
    passed: true,
    message: 'Plan saved. These are your ideas; there is no single correct way to plan.',
  }
}
