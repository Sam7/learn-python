import type { ActivityProgress, LearnerResponse, Lesson } from '../../curriculum/types'
import { normalizeVirtualFiles } from '../../lib/virtual-files'

export const PROGRESS_VERSION = 3
export const PROGRESS_STORAGE_KEY = 'python-steps:progress'

export interface LearnerProgress {
  version: number
  currentLessonId: string
  currentStepByLesson: Record<string, string>
  completedActivityIds: string[]
  activityProgress: Record<string, ActivityProgress>
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function firstAvailableLesson(lessons: Lesson[]): Lesson | undefined {
  return lessons.find((lesson) => lesson.status === 'ready') ?? lessons[0]
}

export function createInitialProgress(lessons: Lesson[]): LearnerProgress {
  const firstLesson = firstAvailableLesson(lessons)
  return {
    version: PROGRESS_VERSION,
    currentLessonId: firstLesson?.id ?? '',
    currentStepByLesson: firstLesson?.steps[0]
      ? { [firstLesson.id]: firstLesson.steps[0].id }
      : {},
    completedActivityIds: [],
    activityProgress: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLearnerResponse(value: unknown): value is LearnerResponse {
  if (typeof value === 'string') return true
  if (Array.isArray(value)) return value.every((item) => typeof item === 'string')
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string')
}

function lessonById(lessons: Lesson[]): Map<string, Lesson> {
  return new Map(lessons.map((lesson) => [lesson.id, lesson]))
}

function isReadyLesson(lessonsById: Map<string, Lesson>, id: unknown): id is string {
  return typeof id === 'string' && lessonsById.get(id)?.status === 'ready'
}

function isUnlockedLesson(lessons: Lesson[], id: unknown, completedActivityIds: string[]): id is string {
  if (typeof id !== 'string') return false
  const readyLessons = lessons.filter((lesson) => lesson.status === 'ready')
  const index = readyLessons.findIndex((lesson) => lesson.id === id)
  if (index < 0) return false
  if (index === 0) return true
  const previous = readyLessons[index - 1]
  const required = previous.steps.flatMap((step) => step.activity?.required ? [step.activity.id] : [])
  return required.length > 0 && required.every((activityId) => completedActivityIds.includes(activityId))
}

function defaultStep(lesson: Lesson): string {
  return lesson.steps[0]?.id ?? ''
}

function migrateV1(value: Record<string, unknown>, lessons: Lesson[]): LearnerProgress {
  const initial = createInitialProgress(lessons)
  const lessonsById = lessonById(lessons)
  const completedIds = new Set(
    Array.isArray(value.completedLessonIds)
      ? value.completedLessonIds.filter((id): id is string => isReadyLesson(lessonsById, id))
      : [],
  )
  const completedActivityIds: string[] = []
  const activityProgress: Record<string, ActivityProgress> = {}
  const currentStepByLesson: Record<string, string> = {}

  for (const lesson of lessons) {
    const required = lesson.steps.flatMap((step) => step.activity?.required ? [step.activity.id] : [])
    if (completedIds.has(lesson.id)) completedActivityIds.push(...required)
    currentStepByLesson[lesson.id] = completedIds.has(lesson.id)
      ? lesson.steps.at(-1)?.id ?? defaultStep(lesson)
      : defaultStep(lesson)
  }

  const currentLessonId = isUnlockedLesson(lessons, value.currentLessonId, completedActivityIds)
    ? value.currentLessonId
    : initial.currentLessonId

  if (isRecord(value.lessonCode)) {
    for (const [lessonId, code] of Object.entries(value.lessonCode)) {
      if (typeof code !== 'string') continue
      const lesson = lessonsById.get(lessonId)
      const codeStep = lesson?.steps.find((step) => step.activity?.kind === 'code')
      if (!lesson || !codeStep?.activity || codeStep.activity.kind !== 'code') continue
      activityProgress[codeStep.activity.id] = { code }
      if (!completedIds.has(lesson.id) && lesson.id === currentLessonId) {
        currentStepByLesson[lesson.id] = codeStep.id
      }
    }
  }

  return {
    version: PROGRESS_VERSION,
    currentLessonId,
    currentStepByLesson: {
      ...initial.currentStepByLesson,
      ...currentStepByLesson,
    },
    completedActivityIds,
    activityProgress,
  }
}

export function normalizeProgress(value: unknown, lessons: Lesson[]): LearnerProgress {
  const initial = createInitialProgress(lessons)
  if (!isRecord(value)) return initial
  if (value.version === 1) return migrateV1(value, lessons)
  if (value.version !== 2 && value.version !== PROGRESS_VERSION) return initial

  const lessonsById = lessonById(lessons)
  const readyActivityIds = new Set<string>()
  const allActivities = new Map<string, NonNullable<Lesson['steps'][number]['activity']>>()
  for (const lesson of lessons) {
    if (lesson.status !== 'ready') continue
    for (const step of lesson.steps) {
      if (step.activity) {
        allActivities.set(step.activity.id, step.activity)
        if (step.activity.required) readyActivityIds.add(step.activity.id)
      }
    }
  }

  const completedActivityIds = Array.isArray(value.completedActivityIds)
    ? [...new Set(value.completedActivityIds.filter((id): id is string => typeof id === 'string' && readyActivityIds.has(id)))]
    : []
  const currentLessonId = isUnlockedLesson(lessons, value.currentLessonId, completedActivityIds)
    ? value.currentLessonId
    : initial.currentLessonId

  const activityProgress: Record<string, ActivityProgress> = {}
  if (isRecord(value.activityProgress)) {
    for (const [id, state] of Object.entries(value.activityProgress)) {
      const activity = allActivities.get(id)
      if (!activity || !isRecord(state)) continue
      const normalized: ActivityProgress = {}
      if (activity.kind === 'code' && typeof state.code === 'string') normalized.code = state.code
      if (activity.kind === 'file-workspace' && isRecord(state.files)) {
        normalized.files = normalizeVirtualFiles(state.files)
      }
      if (isLearnerResponse(state.response)) normalized.response = state.response
      if (typeof state.hintsRevealed === 'number' && Number.isInteger(state.hintsRevealed) && state.hintsRevealed >= 0) {
        normalized.hintsRevealed = Math.min(state.hintsRevealed, activity.hints?.length ?? 0)
      }
      if (Object.keys(normalized).length > 0) activityProgress[id] = normalized
    }
  }

  const currentStepByLesson: Record<string, string> = { ...initial.currentStepByLesson }
  if (isRecord(value.currentStepByLesson)) {
    for (const [lessonId, stepId] of Object.entries(value.currentStepByLesson)) {
      const lesson = lessonsById.get(lessonId)
      if (lesson?.status === 'ready' && typeof stepId === 'string' && lesson.steps.some((step) => step.id === stepId)) {
        currentStepByLesson[lessonId] = stepId
      }
    }
  }

  return { version: PROGRESS_VERSION, currentLessonId, currentStepByLesson, completedActivityIds, activityProgress }
}

export function createProgressRepository(storage: StorageLike, lessons: Lesson[]) {
  return {
    load(): LearnerProgress {
      try {
        const raw = storage.getItem(PROGRESS_STORAGE_KEY)
        const parsed: unknown = raw ? JSON.parse(raw) : null
        const normalized = normalizeProgress(parsed, lessons)
        if (isRecord(parsed) && parsed.version === 1) {
          try {
            storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalized))
          } catch {
            // Keep the in-memory migration if browser storage is unavailable.
          }
        }
        return normalized
      } catch {
        return createInitialProgress(lessons)
      }
    },
    save(progress: LearnerProgress): void {
      try {
        storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // In-memory progress remains usable if storage is unavailable or full.
      }
    },
    reset(): LearnerProgress {
      const next = createInitialProgress(lessons)
      try {
        storage.removeItem(PROGRESS_STORAGE_KEY)
      } catch {
        // A storage restriction must not prevent the learner from resetting in memory.
      }
      return next
    },
  }
}
