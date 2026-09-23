import type { Lesson } from '../lessons/types'

export const PROGRESS_VERSION = 1
export const PROGRESS_STORAGE_KEY = 'python-steps:progress'

export interface LearnerProgress {
  version: number
  currentLessonId: string
  completedLessonIds: string[]
  lessonCode: Record<string, string>
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createInitialProgress(firstLessonId: string): LearnerProgress {
  return {
    version: PROGRESS_VERSION,
    currentLessonId: firstLessonId,
    completedLessonIds: [],
    lessonCode: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeProgress(
  value: unknown,
  lessons: Lesson[],
): LearnerProgress {
  const firstLessonId = lessons[0]?.id ?? ''
  const validIds = new Set(lessons.map((lesson) => lesson.id))
  if (!isRecord(value) || value.version !== PROGRESS_VERSION) {
    return createInitialProgress(firstLessonId)
  }

  const currentLessonId = typeof value.currentLessonId === 'string' && validIds.has(value.currentLessonId)
    ? value.currentLessonId
    : firstLessonId
  const completedLessonIds = Array.isArray(value.completedLessonIds)
    ? value.completedLessonIds.filter((id): id is string => typeof id === 'string' && validIds.has(id))
    : []
  const lessonCode: Record<string, string> = {}
  if (isRecord(value.lessonCode)) {
    for (const [id, code] of Object.entries(value.lessonCode)) {
      if (validIds.has(id) && typeof code === 'string') {
        lessonCode[id] = code
      }
    }
  }

  return { version: PROGRESS_VERSION, currentLessonId, completedLessonIds, lessonCode }
}

export function createProgressRepository(storage: StorageLike, lessons: Lesson[]) {
  return {
    load(): LearnerProgress {
      try {
        const raw = storage.getItem(PROGRESS_STORAGE_KEY)
        return normalizeProgress(raw ? JSON.parse(raw) : null, lessons)
      } catch {
        return createInitialProgress(lessons[0]?.id ?? '')
      }
    },
    save(progress: LearnerProgress): void {
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
    },
    reset(): LearnerProgress {
      const next = createInitialProgress(lessons[0]?.id ?? '')
      storage.removeItem(PROGRESS_STORAGE_KEY)
      return next
    },
  }
}
