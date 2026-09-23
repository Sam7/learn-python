import { describe, expect, it } from 'vitest'
import { allLessons, getLessonById, readyLessons } from '../../curriculum/curriculum'
import {
  createInitialProgress,
  createProgressRepository,
  normalizeProgress,
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
} from './progress-store'

function fakeStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: (key: string) => key === PROGRESS_STORAGE_KEY ? value : null,
    setItem: (key: string, next: string) => { if (key === PROGRESS_STORAGE_KEY) value = next },
    removeItem: (key: string) => { if (key === PROGRESS_STORAGE_KEY) value = null },
    read: () => value,
  }
}

describe('progress persistence', () => {
  it('starts on the first ready lesson and its first step', () => {
    const first = readyLessons[0]
    expect(createInitialProgress(allLessons)).toEqual({
      version: PROGRESS_VERSION,
      currentLessonId: first.id,
      currentStepByLesson: { [first.id]: first.steps[0].id },
      completedActivityIds: [],
      activityProgress: {},
    })
  })

  it('recovers from malformed, outdated, and unknown data', () => {
    expect(normalizeProgress('{not-json', allLessons).currentLessonId).toBe(readyLessons[0].id)
    expect(normalizeProgress({ version: 99 }, allLessons).completedActivityIds).toEqual([])
    expect(normalizeProgress({ version: PROGRESS_VERSION, currentLessonId: 'missing' }, allLessons).currentLessonId)
      .toBe(readyLessons[0].id)
  })

  it('migrates version 1 lesson completion and saved code into activity progress', () => {
    const first = getLessonById('saying-something')!
    const firstActivity = first.steps[0].activity!
    const migrated = normalizeProgress({
      version: 1,
      currentLessonId: 'your-own-text',
      completedLessonIds: ['saying-something', 'not-in-curriculum'],
      lessonCode: {
        'your-own-text': 'print("My name is Sam")\nprint("I like tea")',
        'not-in-curriculum': 'print("ignore")',
      },
    }, allLessons)

    expect(migrated.currentLessonId).toBe('your-own-text')
    expect(migrated.completedActivityIds).toContain(firstActivity.id)
    expect(migrated.activityProgress['write-your-own-lines']?.code).toBe('print("My name is Sam")\nprint("I like tea")')
    expect(migrated.currentStepByLesson['your-own-text']).toBe('print-two-lines')
  })

  it('keeps only valid activities, steps, responses, and completion IDs', () => {
    const first = readyLessons[0]
    const activity = first.steps[0].activity!
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: first.id,
      currentStepByLesson: { [first.id]: 'missing-step', 'removed-lesson': 'x' },
      completedActivityIds: [activity.id, 'unknown-activity'],
      activityProgress: {
        [activity.id]: { code: 'print("saved")', response: { answer: 'ok' }, hintsRevealed: 100 },
        'unknown-activity': { code: 'discard me' },
      },
    }, allLessons)

    expect(progress.currentStepByLesson[first.id]).toBe(first.steps[0].id)
    expect(progress.completedActivityIds).toEqual([activity.id])
    expect(progress.activityProgress[activity.id]).toEqual({ code: 'print("saved")', response: { answer: 'ok' }, hintsRevealed: 2 })
    expect(progress.activityProgress['unknown-activity']).toBeUndefined()
  })

  it('does not restore a coming-soon lesson as the active lesson', () => {
    const future = allLessons.find((lesson) => lesson.status === 'coming-soon')!
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: future.id,
      completedActivityIds: ['not-a-ready-activity'],
      activityProgress: {},
    }, allLessons)

    expect(progress.currentLessonId).toBe(readyLessons[0].id)
    expect(progress.completedActivityIds).toEqual([])
  })

  it('does not restore a ready lesson whose prerequisite is still locked', () => {
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: 'variables',
      completedActivityIds: [],
      activityProgress: {},
    }, allLessons)

    expect(progress.currentLessonId).toBe(readyLessons[0].id)
  })

  it('saves, loads, and resets through the repository boundary', () => {
    const storage = fakeStorage()
    const repository = createProgressRepository(storage, allLessons)
    const first = readyLessons[0]
    const saved = {
      ...createInitialProgress(allLessons),
      currentLessonId: readyLessons[1].id,
      completedActivityIds: [first.steps[0].activity!.id],
      currentStepByLesson: { ...createInitialProgress(allLessons).currentStepByLesson, [first.id]: first.steps[0].id },
    }
    repository.save(saved)

    expect(storage.read()).not.toBeNull()
    expect(repository.load().currentLessonId).toBe(readyLessons[1].id)
    expect(repository.reset().currentLessonId).toBe(first.id)
    expect(repository.load().currentLessonId).toBe(first.id)
  })

  it('safely continues in memory when browser storage throws', () => {
    const unavailableStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    const repository = createProgressRepository(unavailableStorage, allLessons)
    expect(repository.load().currentLessonId).toBe(readyLessons[0].id)
    expect(() => repository.save(createInitialProgress(allLessons))).not.toThrow()
    expect(() => repository.reset()).not.toThrow()
  })
})
