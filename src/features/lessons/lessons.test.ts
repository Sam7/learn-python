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

const success = (stdout: string, inputTranscript: PythonRunResult['inputTranscript'] = []): PythonRunResult => ({
  status: 'success',
  stdout,
  stderr: '',
  inputTranscript,
  durationMs: 4,
})

describe('lesson catalogue', () => {
  it('keeps modules and lessons ordered and retrievable by id', () => {
    expect(modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(readyLessons.map((lesson) => lesson.id)).toEqual([
      'saying-something',
      'your-own-text',
      'numbers-and-maths',
      'variables',
      'values-in-sentences',
      'ask-a-question',
      'ask-more-than-one-question',
      'reuse-an-answer',
      'get-to-know-you',
    ])
    expect(getLessonById('your-own-text')?.order).toBe(2)
    expect(getLessonLocation('numbers-and-maths')?.module.id).toBe('fundamentals')
    expect(getNextLesson('saying-something')?.id).toBe('your-own-text')
    expect(getNextLesson('variables')?.id).toBe('values-in-sentences')
    expect(getNextLesson('values-in-sentences')?.id).toBe('ask-a-question')
    expect(getNextLesson('ask-a-question')?.id).toBe('ask-more-than-one-question')
    expect(getNextLesson('reuse-an-answer')?.id).toBe('get-to-know-you')
    expect(getNextLesson('get-to-know-you')).toBeUndefined()
    expect(allLessons.find((lesson) => lesson.id === 'text-or-number')?.status).toBe('coming-soon')
    expect(modules[2].title).toBe('Types and numbers')
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

  it('validates the first input lesson with multiple hidden answers', async () => {
    const lesson = getLessonById('ask-a-question')!
    const result = await validateLesson(lesson, {
      code: 'name = input("What is your name? ")\nprint("Hello", name)',
      execution: success('What is your name? Hello Alex\n'),
      runValidationCode: async (_code, request) => {
        const answer = request?.input?.lines?.[0] ?? ''
        return success(`Hello ${answer}\n`, [{ inputIndex: 0, prompt: 'What is your name? ', answer }])
      },
    })

    expect(result).toEqual({ passed: true, message: 'Great work — your program used the answer.' })
  })

  it('does not pass input validation for hard-coded output', async () => {
    const lesson = getLessonById('ask-a-question')!
    const result = await validateLesson(lesson, {
      code: 'print("Hello")',
      execution: success('Hello\n'),
      runValidationCode: async () => success('Hello\n'),
    })

    expect(result.passed).toBe(false)
  })

  it('accepts multiple answers without requiring fixed prompts or variable names', async () => {
    const lesson = getLessonById('ask-more-than-one-question')!
    const result = await validateLesson(lesson, {
      code: 'first = input("Tell me something: ")\nsecond = input("Another thing: ")\nprint(first, second)',
      execution: success('one two\n'),
      runValidationCode: async (_code, request) => {
        const answers = request?.input?.lines ?? []
        return success(answers.join(' '), answers.map((answer, inputIndex) => ({
          inputIndex,
          prompt: `Question ${inputIndex + 1}: `,
          answer,
        })))
      },
    })

    expect(result.passed).toBe(true)
  })

  it('rejects a multiple-input solution that skips a required answer', async () => {
    const lesson = getLessonById('ask-more-than-one-question')!
    const result = await validateLesson(lesson, {
      code: 'answer = input("Tell me something: ")\nprint(answer)',
      execution: success('one\n'),
      runValidationCode: async (_code, request) => {
        const answer = request?.input?.lines?.[0] ?? ''
        return success(answer, [{ inputIndex: 0, prompt: 'Question: ', answer }])
      },
    })

    expect(result).toEqual({
      passed: false,
      message: 'Ask for all 2 answers before checking your program.',
    })
  })

  it('requires an input answer to be reused when the lesson teaches reuse', async () => {
    const lesson = getLessonById('reuse-an-answer')!
    const result = await validateLesson(lesson, {
      code: 'name = input("Name: ")\nprint(name)\nprint(name)',
      execution: success('Ada\n'),
      runValidationCode: async (_code, request) => {
        const answer = request?.input?.lines?.[0] ?? ''
        return success(`${answer}\n${answer}\n`, [{ inputIndex: 0, prompt: 'Name: ', answer }])
      },
    })

    expect(result.passed).toBe(true)
  })

  it('rejects a reuse solution that only prints the answer once', async () => {
    const lesson = getLessonById('reuse-an-answer')!
    const result = await validateLesson(lesson, {
      code: 'name = input("Name: ")\nprint(name)',
      execution: success('Ada\n'),
      runValidationCode: async (_code, request) => {
        const answer = request?.input?.lines?.[0] ?? ''
        return success(answer, [{ inputIndex: 0, prompt: 'Name: ', answer }])
      },
    })

    expect(result).toEqual({
      passed: false,
      message: 'Use the answer more than once in your program.',
    })
  })
})
