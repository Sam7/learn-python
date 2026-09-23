import { describe, expect, it } from 'vitest'
import { getLessonById, getLessonByOrder, getNextLesson, lessons } from './lessons'
import { validateLesson } from './validators/lesson-validator'
import type { PythonRunResult } from '../python/python-runner/types'

const success = (stdout: string): PythonRunResult => ({
  status: 'success',
  stdout,
  stderr: '',
  durationMs: 4,
})

describe('lesson catalogue', () => {
  it('keeps lessons ordered and retrievable by id', () => {
    expect(lessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4])
    expect(getLessonById('your-own-text')?.order).toBe(2)
    expect(getLessonByOrder(3)?.id).toBe('numbers-and-maths')
    expect(getNextLesson('saying-something')?.id).toBe('your-own-text')
    expect(getNextLesson('variables')).toBeUndefined()
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
})
