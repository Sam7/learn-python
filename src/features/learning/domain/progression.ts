import {
  getNextLesson,
  getStepById,
  isLessonComplete,
} from '../../../curriculum/curriculum'
import type { Lesson, LessonStep } from '../../../curriculum/types'

export interface StepProgress {
  currentIndex: number
  totalSteps: number
  completedRequiredActivities: number
  requiredActivities: number
  isCurrentActivityComplete: boolean
  canAdvance: boolean
  nextStep?: LessonStep
}

export function getStepProgress(
  lesson: Lesson,
  stepId: string,
  completedActivityIds: string[],
): StepProgress {
  const step = getStepById(lesson, stepId) ?? lesson.steps[0]
  const currentIndex = Math.max(lesson.steps.findIndex((candidate) => candidate.id === step?.id), 0)
  const requiredActivities = lesson.steps.flatMap((candidate) =>
    candidate.activity?.required ? [candidate.activity.id] : [],
  )
  const completedRequiredActivities = requiredActivities.filter((id) => completedActivityIds.includes(id)).length
  const activity = step?.activity
  const isCurrentActivityComplete = !activity?.required || completedActivityIds.includes(activity.id)
  const nextStep = lesson.steps[currentIndex + 1]
  const canAdvance = isCurrentActivityComplete
    && (Boolean(nextStep) || isLessonComplete(lesson, completedActivityIds))

  return {
    currentIndex,
    totalSteps: lesson.steps.length,
    completedRequiredActivities,
    requiredActivities: requiredActivities.length,
    isCurrentActivityComplete,
    canAdvance,
    nextStep,
  }
}

export type AdvanceTarget =
  | { kind: 'step'; step: LessonStep }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'course-complete' }
  | { kind: 'blocked' }

export function getAdvanceTarget(
  lesson: Lesson,
  stepId: string,
  completedActivityIds: string[],
): AdvanceTarget {
  const progress = getStepProgress(lesson, stepId, completedActivityIds)
  if (!progress.canAdvance) return { kind: 'blocked' }
  if (progress.nextStep) return { kind: 'step', step: progress.nextStep }
  const nextLesson = getNextLesson(lesson.id)
  return nextLesson ? { kind: 'lesson', lesson: nextLesson } : { kind: 'course-complete' }
}

export function getPreviousStep(lesson: Lesson, stepId: string): LessonStep | undefined {
  const currentIndex = lesson.steps.findIndex((step) => step.id === stepId)
  return currentIndex > 0 ? lesson.steps[currentIndex - 1] : undefined
}

export function canOpenLesson(lesson: Lesson, lessons: Lesson[], completedActivityIds: string[]): boolean {
  if (lesson.status !== 'ready') return false
  const readyLessons = lessons.filter((item) => item.status === 'ready')
  const index = readyLessons.findIndex((item) => item.id === lesson.id)
  if (index <= 0) return index === 0
  return isLessonComplete(readyLessons[index - 1], completedActivityIds)
}
