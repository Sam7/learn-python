import { describe, expect, it } from 'vitest'
import {
  allLessons,
  curriculum,
  getCompletedLessonIds,
  getLessonById,
  getLessonLocation,
  getModuleProgress,
  getNextLesson,
  getRequiredActivityIds,
  orderCurriculum,
  readyLessons,
  validateCurriculum,
} from '../../curriculum/curriculum'
import type { LearningActivity } from '../../curriculum/types'
import type { PythonRunResult } from '../python/python-runner/types'
import { assessActivity } from './validators/activity-validator'
import { canOpenLesson, getAdvanceTarget, getStepProgress } from '../learning/domain/progression'

const success = (
  stdout: string,
  inputTranscript: PythonRunResult['inputTranscript'] = [],
  traceFrames: PythonRunResult['traceFrames'] = undefined,
): PythonRunResult => ({ status: 'success', stdout, stderr: '', inputTranscript, traceFrames, durationMs: 4 })

const noRun = async () => success('')

describe('curriculum integrity and progression', () => {
  it('has unique, ordered modules and lessons and retrieves lessons by stable id', () => {
    expect(validateCurriculum(curriculum)).toEqual([])
    expect(curriculum.modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
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
    expect(getNextLesson('get-to-know-you')).toBeUndefined()
    expect(allLessons.find((lesson) => lesson.id === 'text-or-number')?.status).toBe('coming-soon')
  })

  it('derives navigation order from curriculum order values, not file placement', () => {
    const source = structuredClone(curriculum)
    source.modules.reverse()
    source.modules.find((module) => module.id === 'fundamentals')!.lessons.reverse()
    const ordered = orderCurriculum(source)
    expect(ordered.modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(ordered.modules[0].lessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('rejects a published lesson without a required activity', () => {
    const broken = structuredClone(curriculum)
    broken.modules[0].lessons[0].steps[0].activity!.required = false
    expect(validateCurriculum(broken)).toContain('Ready lesson saying-something needs at least one required activity.')
  })

  it('derives lesson completion and module progress from required activity ids', () => {
    const hello = getLessonById('saying-something')!
    const firstTaskId = getRequiredActivityIds(hello)[0]
    expect(getCompletedLessonIds([firstTaskId])).toContain(hello.id)
    expect(getModuleProgress(curriculum.modules[0], [hello.id])).toMatchObject({
      completedCount: 1,
      availableCount: 5,
      isComplete: false,
    })
  })

  it('requires both math activities, in order, before leaving the lesson', () => {
    const lesson = getLessonById('numbers-and-maths')!
    const [predictionStep, codeStep] = lesson.steps
    const predictionId = predictionStep.activity!.id
    const codeId = codeStep.activity!.id

    expect(getStepProgress(lesson, predictionStep.id, []).canAdvance).toBe(false)
    expect(getAdvanceTarget(lesson, predictionStep.id, []).kind).toBe('blocked')
    expect(getAdvanceTarget(lesson, predictionStep.id, [predictionId])).toEqual({ kind: 'step', step: codeStep })
    expect(getAdvanceTarget(lesson, codeStep.id, [predictionId]).kind).toBe('blocked')
    expect(getAdvanceTarget(lesson, codeStep.id, [predictionId, codeId]).kind).toEqual('lesson')
  })

  it('unlocks only the next lesson after all required work is complete', () => {
    const first = getLessonById('saying-something')!
    const next = getLessonById('your-own-text')!
    expect(canOpenLesson(next, allLessons, [])).toBe(false)
    expect(canOpenLesson(next, allLessons, getRequiredActivityIds(first))).toBe(true)
  })

  it('does not gate navigation on an optional activity', () => {
    const lesson = getLessonById('saying-something')!
    const step = lesson.steps[0]
    const activity = { ...step.activity!, required: false } as LearningActivity
    const optionalLesson = {
      ...lesson,
      steps: [
        { ...step, activity },
        { id: 'continue-reading', content: [{ type: 'paragraph' as const, text: 'Continue.' }] },
      ],
    }
    expect(getStepProgress(optionalLesson, step.id, []).canAdvance).toBe(true)
  })
})

describe('activity assessors', () => {
  it('accepts different code that has the expected output', async () => {
    const activity = getLessonById('saying-something')!.steps[0].activity!
    const result = await assessActivity(activity, {
      code: 'message = "Hello Python!"\nprint(message)',
      execution: success('Hello Python!\n'),
      runPython: noRun,
    })
    expect(result.passed).toBe(true)
  })

  it('reports actual and expected evidence after a successful but incorrect run', async () => {
    const activity = getLessonById('saying-something')!.steps[0].activity!
    const result = await assessActivity(activity, {
      code: 'print("hello")', execution: success('hello\n'), runPython: noRun,
    })
    expect(result.passed).toBe(false)
    expect(result.evidence).toEqual({ expected: 'Hello Python!', actual: 'hello' })
  })

  it('assesses text variables with Python AST rather than source matching', async () => {
    const activity = getLessonById('variables')!.steps.find((step) => step.activity?.id === 'create-a-text-variable')!.activity!
    let inspectedCode = ''
    const result = await assessActivity(activity, {
      code: 'favourite_food = "noodles"\nprint(favourite_food)',
      execution: success('noodles\n'),
      runPython: async (request) => { inspectedCode = request.code; return success('') },
    })
    expect(result.passed).toBe(true)
    expect(inspectedCode).toContain('ast.parse')
  })

  it('checks input behavior with several unseen answers, independent of prompts and variable names', async () => {
    const activity = getLessonById('ask-more-than-one-question')!.steps[0].activity!
    const result = await assessActivity(activity, {
      code: 'first = input("Tell me something: ")\nsecond = input("Another thing: ")\nprint(first, second)',
      execution: success('one two\n'),
      runPython: async (request) => {
        const inputs = request.input?.lines ?? []
        return success(inputs.join(' '), inputs.map((answer, inputIndex) => ({ inputIndex, prompt: '', answer })))
      },
    })
    expect(result.passed).toBe(true)
  })

  it('does not accept code that skips a required input answer', async () => {
    const activity = getLessonById('ask-more-than-one-question')!.steps[0].activity!
    const result = await assessActivity(activity, {
      code: 'answer = input("Tell me something: ")\nprint(answer)',
      execution: success('one\n'),
      runPython: async (request) => success(
        request.input?.lines?.[0] ?? '',
        [{ inputIndex: 0, prompt: '', answer: request.input?.lines?.[0] ?? '' }],
      ),
    })
    expect(result.passed).toBe(false)
  })

  it('compares a prediction with the real Python result', async () => {
    const activity = getLessonById('numbers-and-maths')!.steps[0].activity!
    expect(activity.kind).toBe('predict-output')
    if (activity.kind !== 'predict-output') throw new Error('Expected prediction activity')
    const result = await assessActivity(activity, {
      response: '5', execution: success('5\n'), runPython: noRun,
    })
    expect(result.passed).toBe(true)
    const wrong = await assessActivity(activity, {
      response: '6', execution: success('5\n'), runPython: noRun,
    })
    expect(wrong.passed).toBe(false)
  })

  it('uses traced local values to check a state prediction', async () => {
    const activity: LearningActivity = {
      id: 'predict-total', kind: 'predict-state', title: 'Predict the total', prompt: 'What is total after line 1?',
      required: true, code: 'total = 4\nprint(total)', line: 1, variable: 'total', expectedValue: '4', choices: ['3', '4', '5'],
    }
    const result = await assessActivity(activity, {
      response: '4',
      execution: success('', [], [
        { line: 1, event: 'line', locals: {} },
        { line: 2, event: 'line', locals: { total: 4 } },
      ]),
      runPython: noRun,
    })
    expect(result.passed).toBe(true)
    const inconsistent = await assessActivity({ ...activity, expectedValue: '5' }, {
      response: '4',
      execution: success('', [], [
        { line: 1, event: 'line', locals: {} },
        { line: 2, event: 'line', locals: { total: 4 } },
      ]),
      runPython: noRun,
    })
    expect(inconsistent.passed).toBe(false)
    expect(inconsistent.message).toContain('content review')
  })

  it('checks choices and accessible code ordering deterministically', async () => {
    const choice: LearningActivity = {
      id: 'why', kind: 'choice', title: 'Why?', prompt: 'Pick one.', required: true,
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'b',
    }
    const ordered: LearningActivity = {
      id: 'order', kind: 'arrange-code', title: 'Order it', prompt: 'Put these lines in order.', required: true,
      fragments: [{ id: 'print', code: 'print(name)' }, { id: 'assign', code: 'name = "Ada"' }],
      startingOrder: ['print', 'assign'], correctOrder: ['assign', 'print'],
    }
    expect((await assessActivity(choice, { response: 'b', execution: success(''), runPython: noRun })).passed).toBe(true)
    expect((await assessActivity(ordered, { response: ['assign', 'print'], execution: success(''), runPython: noRun })).passed).toBe(true)
  })
})
