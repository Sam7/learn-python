import { describe, expect, it } from 'vitest'
import {
  allLessons,
  curriculum,
  getLessonById,
  getLessonLocation,
  getModuleProgress,
  getNextLesson,
  modules,
  readyLessons,
} from '../../curriculum/curriculum'
import { validateLesson } from './validators/lesson-validator'
import type { PythonRunResult } from '../python/python-runner/types'

const success = (stdout: string): PythonRunResult => ({
  status: 'success',
  stdout,
  stderr: '',
  durationMs: 4,
})

describe('lesson catalogue', () => {
  it('keeps modules and lessons ordered and retrievable by id', () => {
    expect(modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(readyLessons.map((lesson) => lesson.id)).toEqual([
      'saying-something',
      'your-own-text',
      'numbers-and-maths',
      'variables',
      'values-in-sentences',
      'ask-a-question',
    ])
    expect(getLessonById('your-own-text')?.order).toBe(2)
    expect(getLessonLocation('numbers-and-maths')?.module.id).toBe('fundamentals')
    expect(getNextLesson('saying-something')?.id).toBe('your-own-text')
    expect(getNextLesson('variables')?.id).toBe('values-in-sentences')
    expect(getNextLesson('values-in-sentences')?.id).toBe('ask-a-question')
    expect(allLessons.find((lesson) => lesson.id === 'save-an-answer')?.status).toBe('coming-soon')
  })

  it('derives module progress from curriculum data', () => {
    const fundamentals = curriculum.modules[0]
    expect(getModuleProgress(fundamentals, ['saying-something', 'your-own-text'])).toEqual({
      completedCount: 2,
      availableCount: 5,
      totalCount: 5,
      upcomingCount: 0,
      isComplete: false,
    })
    expect(getModuleProgress(fundamentals, readyLessons.map((lesson) => lesson.id)).isComplete).toBe(true)
  })
})

describe('lesson validators', () => {
  it('accepts correct output without comparing source code', async () => {
    const lesson = getLessonById('saying-something')!
    const result = await validateLesson(lesson, {
      code: 'message = "Hello Python!"\nprint(message)',
      execution: success('Hello Python!\n'),
      runValidationCode: async () => success(''),
    })

    expect(result).toEqual({ passed: true, message: 'Great work — your output is correct.' })
  })

  it('requires two lines for the text lesson', async () => {
    const lesson = getLessonById('your-own-text')!
    const result = await validateLesson(lesson, {
      code: 'print("Sam")',
      execution: success('Sam\n'),
      runValidationCode: async () => success(''),
    })

    expect(result.passed).toBe(false)
  })

  it('uses Python AST validation for the variables lesson', async () => {
    const lesson = getLessonById('variables')!
    let inspectedCode = ''
    const result = await validateLesson(lesson, {
      code: 'favourite_food = "noodles"\nprint(favourite_food)',
      execution: success('noodles\n'),
      runValidationCode: async (code) => {
        inspectedCode = code
        return success('')
      },
    })

    expect(result.passed).toBe(true)
    expect(inspectedCode).toContain('ast.parse')
    expect(inspectedCode).toContain('exec(compile')
  })

  it('requires a variable inside a printed sentence for the next lesson', async () => {
    const lesson = getLessonById('values-in-sentences')!
    let inspectedCode = ''
    const result = await validateLesson(lesson, {
      code: 'food = "mango"\nprint(f"I like {food}")',
      execution: success('I like mango\n'),
      runValidationCode: async (code) => {
        inspectedCode = code
        return success('')
      },
    })

    expect(result).toEqual({ passed: true, message: 'Great work — you put a variable inside a sentence.' })
    expect(inspectedCode).toContain('has_variable_in_sentence')
  })

  it('accepts a printed sentence that passes the variable separately', async () => {
    const lesson = getLessonById('values-in-sentences')!
    const result = await validateLesson(lesson, {
      code: 'food = "mango"\nprint("I like", food)',
      execution: success('I like mango\n'),
      runValidationCode: async () => success(''),
    })

    expect(result.passed).toBe(true)
  })

  it('validates the first input lesson from its browser-provided answer', async () => {
    const lesson = getLessonById('ask-a-question')!
    const result = await validateLesson(lesson, {
      code: 'name = input("What is your name? ")\nprint("Hello", name)',
      execution: success('What is your name? Hello Alex\n'),
      runValidationCode: async () => success(''),
    })

    expect(result).toEqual({ passed: true, message: 'Great work — your program used the answer.' })
  })
})
