import { describe, expect, it } from 'vitest'
import { allLessons } from '../../curriculum/curriculum'
import { lessons } from '../lessons/lessons'
import { createInitialProgress, createProgressRepository, normalizeProgress } from './progress-store'

function fakeStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next },
    removeItem: (_key: string) => { value = null },
    read: () => value,
  }
}

describe('progress persistence', () => {
  it('starts with the first lesson', () => {
    expect(createInitialProgress(lessons[0].id)).toEqual({
      version: 1,
      currentLessonId: 'saying-something',
      completedLessonIds: [],
      lessonCode: {},
    })
  })

  it('recovers from malformed or outdated data', () => {
    expect(normalizeProgress('{not-json', lessons).currentLessonId).toBe('saying-something')
    expect(normalizeProgress({ version: 99 }, lessons).completedLessonIds).toEqual([])
    expect(normalizeProgress({ version: 1, currentLessonId: 'missing' }, lessons).currentLessonId).toBe('saying-something')
  })

  it('filters removed lessons while keeping valid code', () => {
    const progress = normalizeProgress({
      version: 1,
      currentLessonId: 'your-own-text',
      completedLessonIds: ['saying-something', 'removed'],
      lessonCode: { 'your-own-text': 'print("hello")', removed: 'bad' },
    }, lessons)

    expect(progress.completedLessonIds).toEqual(['saying-something'])
    expect(progress.lessonCode).toEqual({ 'your-own-text': 'print("hello")' })
  })

  it('does not restore a future lesson as the active lesson', () => {
    const progress = normalizeProgress({
      version: 1,
      currentLessonId: 'save-an-answer',
      completedLessonIds: ['save-an-answer', 'saying-something'],
      lessonCode: { 'save-an-answer': '# saved for later' },
    }, allLessons)

    expect(progress.currentLessonId).toBe('saying-something')
    expect(progress.completedLessonIds).toEqual(['saying-something'])
    expect(progress.lessonCode).toEqual({ 'save-an-answer': '# saved for later' })
  })

  it('saves, loads, and resets through the repository boundary', () => {
    const storage = fakeStorage()
    const repository = createProgressRepository(storage, lessons)
    const saved = { ...createInitialProgress(lessons[0].id), currentLessonId: 'your-own-text' }
    repository.save(saved)

    expect(storage.read()).not.toBeNull()
    expect(repository.load().currentLessonId).toBe('your-own-text')
    expect(repository.reset().currentLessonId).toBe('saying-something')
    expect(repository.load().currentLessonId).toBe('saying-something')
  })
})
