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

  it('preserves compatible version 1 progress and filters lessons removed from the new curriculum', () => {
    const first = getLessonById('saying-something')!
    const firstActivity = first.steps[0].activity!
    const migrated = normalizeProgress({
      version: 1,
      currentLessonId: 'saying-something',
      completedLessonIds: ['saying-something', 'your-own-text', 'not-in-curriculum'],
      lessonCode: {
        'saying-something': 'print("Hello Python!")',
        'your-own-text': 'print("My name is Sam")\nprint("I like tea")',
        'not-in-curriculum': 'print("ignore")',
      },
    }, allLessons)

    expect(migrated.currentLessonId).toBe('saying-something')
    expect(migrated.completedActivityIds).toContain(firstActivity.id)
    expect(migrated.completedActivityIds).not.toContain('write-your-own-lines')
    expect(migrated.activityProgress[firstActivity.id]?.code).toBe('print("Hello Python!")')
    expect(migrated.currentStepByLesson['saying-something']).toBe('make-python-speak')
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

  it('migrates version 2 progress and keeps only safe files for a workspace activity', () => {
    const activity = {
      id: 'saved-workspace',
      kind: 'file-workspace' as const,
      title: 'Project files',
      prompt: 'Edit the files.',
      required: true,
      entryFile: 'main.py',
      starterFiles: { 'main.py': '' },
      assessment: { kind: 'successful-run' as const },
    }
    const lesson = {
      id: 'workspace-lesson', order: 1, title: 'Workspace', shortTitle: 'Workspace', summary: 'Workspace test.',
      status: 'ready' as const,
      steps: [{ id: 'workspace-step', content: [], activity }],
    }
    const migrated = normalizeProgress({
      version: 2,
      currentLessonId: lesson.id,
      completedActivityIds: [],
      activityProgress: {
        [activity.id]: { files: { 'main.py': 'print("saved")', 'score.txt': '12', '../outside.py': 'hidden' } },
      },
    }, [lesson])

    expect(migrated.version).toBe(PROGRESS_VERSION)
    expect(migrated.activityProgress[activity.id]?.files).toEqual({ 'main.py': 'print("saved")', 'score.txt': '12' })
  })

  it('restores learner-entered trace-table cells as activity responses', () => {
    const activity = getLessonById('stage-2-lesson-6')!.steps[0].activity!
    const response = { 'after-coins-start:coins': '5', 'after-coins-start:stars': '—' }
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: readyLessons[0].id,
      completedActivityIds: [],
      activityProgress: { [activity.id]: { response } },
    }, allLessons)

    expect(progress.activityProgress[activity.id]?.response).toEqual(response)
  })

  it('restores learner-authored planning fields without changing the progress schema', () => {
    const activity = getLessonById('stage-10-lesson-2')!.steps[0].activity!
    const response = {
      input: 'the order amount',
      process: 'compare with 50',
      output: 'the delivery price',
    }
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: readyLessons[0].id,
      completedActivityIds: [],
      activityProgress: { [activity.id]: { response } },
    }, allLessons)

    expect(progress.version).toBe(PROGRESS_VERSION)
    expect(progress.activityProgress[activity.id]?.response).toEqual(response)
  })

  it('does not restore a coming-soon lesson as the active lesson', () => {
    const lastStageLesson = allLessons.find((lesson) => lesson.id === 'stage-11-lesson-8')!
    const future = { ...lastStageLesson, status: 'coming-soon' as const }
    const lessons = allLessons.map((lesson) => lesson.id === future.id ? future : lesson)
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: future.id,
      completedActivityIds: ['not-a-ready-activity'],
      activityProgress: {},
    }, lessons)

    expect(progress.currentLessonId).toBe(readyLessons[0].id)
    expect(progress.completedActivityIds).toEqual([])
  })

  it('does not restore a ready lesson whose prerequisite is still locked', () => {
    const progress = normalizeProgress({
      version: PROGRESS_VERSION,
      currentLessonId: 'instructions-in-order',
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
