import { describe, expect, it } from 'vitest'
import {
  allLessons,
  curriculum,
  getCompletedLessonIds,
  getLessonById,
  getLessonLocation,
  getNextCurriculumLesson,
  getNextLesson,
  getRequiredActivityIds,
  getStageProgress,
  orderCurriculum,
  readyLessons,
  validateCurriculum,
} from '../../curriculum/curriculum'
import type { CodeActivity, LearningActivity } from '../../curriculum/types'
import type { PythonRunResult } from '../python/python-runner/types'
import { getAdvanceTarget, getStepProgress } from '../learning/domain/progression'
import { assessActivity } from './validators/activity-validator'

const success = (
  stdout: string,
  inputTranscript: PythonRunResult['inputTranscript'] = [],
  traceFrames: PythonRunResult['traceFrames'] = undefined,
): PythonRunResult => ({ status: 'success', stdout, stderr: '', inputTranscript, traceFrames, durationMs: 4 })

const noRun = async () => success('')

describe('the canonical curriculum outline', () => {
  it('matches all twelve ordered stages and all 109 micro-lessons from the curriculum specification', () => {
    expect(validateCurriculum(curriculum)).toEqual([])
    expect(curriculum.stages.map((stage) => stage.order)).toEqual(Array.from({ length: 12 }, (_, index) => index))
    expect(curriculum.stages.map((stage) => stage.title)).toEqual([
      'The Computer Follows Instructions',
      'Values and Expressions',
      'Names, State, and Input',
      'Decisions',
      'Repetition and Time',
      'Collections',
      'Functions and Abstraction',
      'Reusable Algorithmic Patterns',
      'Representing Information',
      'Debugging and Correctness',
      'Designing Programs',
      'Connecting Programming to the Real World',
    ])
    expect(curriculum.stages.map((stage) => stage.lessons.length)).toEqual([6, 8, 10, 10, 10, 9, 10, 10, 8, 10, 10, 8])
    expect(allLessons).toHaveLength(109)
  })

  it('publishes only the fully authored Stage 0 lessons and leaves the rest as ordered future curriculum data', () => {
    expect(readyLessons.map((lesson) => lesson.title)).toEqual([
      'Make something happen',
      'Instructions happen in order',
      'One change → one consequence',
      'Computers are extremely literal',
      'Trace the execution pointer',
      'First tiny creation',
    ])
    expect(allLessons.filter((lesson) => lesson.status === 'coming-soon')).toHaveLength(103)
    expect(getLessonLocation('saying-something')?.stage.id).toBe('stage-0')
    expect(getLessonById('stage-11-lesson-8')?.title).toBe('Independent capstone')
    expect(getNextCurriculumLesson('first-tiny-creation')?.status).toBe('coming-soon')
    expect(getNextLesson('first-tiny-creation')).toBeUndefined()
  })

  it('derives navigation and ordering from stage and lesson order values', () => {
    const source = structuredClone(curriculum)
    source.stages.reverse()
    source.stages.find((stage) => stage.id === 'stage-0')!.lessons.reverse()
    const ordered = orderCurriculum(source)
    expect(ordered.stages.map((stage) => stage.order)).toEqual(Array.from({ length: 12 }, (_, index) => index))
    expect(ordered.stages[0].lessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(ordered.stages[0].lessons[0].id).toBe('saying-something')
  })

  it('rejects invalid stage numbering and ready lessons without required activities', () => {
    const broken = structuredClone(curriculum)
    broken.stages[1].order = 0
    broken.stages[0].lessons[0].steps[0].activity!.required = false
    expect(validateCurriculum(broken)).toContain('Duplicate stage order: 0.')
    expect(validateCurriculum(broken)).toContain('Ready lesson saying-something needs at least one required activity.')
  })

  it('derives stage completion and progression from required activity ids', () => {
    const stage = curriculum.stages[0]
    const firstLesson = stage.lessons[0]
    const [firstActivityId] = getRequiredActivityIds(firstLesson)
    expect(getCompletedLessonIds([firstActivityId])).toContain(firstLesson.id)
    expect(getStageProgress(stage, [firstLesson.id])).toMatchObject({
      completedCount: 1,
      availableCount: 6,
      totalCount: 6,
      isComplete: false,
    })
  })

  it('requires every task in a multi-activity lesson before moving to its next lesson', () => {
    const lesson = getLessonById('instructions-in-order')!
    const [predictionStep, arrangeStep] = lesson.steps
    const predictionId = predictionStep.activity!.id
    const arrangeId = arrangeStep.activity!.id

    expect(getStepProgress(lesson, predictionStep.id, []).canAdvance).toBe(false)
    expect(getAdvanceTarget(lesson, predictionStep.id, [predictionId])).toEqual({ kind: 'step', step: arrangeStep })
    expect(getStepProgress(lesson, arrangeStep.id, [predictionId]).canAdvance).toBe(false)
    expect(getAdvanceTarget(lesson, arrangeStep.id, [predictionId, arrangeId]).kind).toBe('lesson')
  })
})

describe('Stage 0 activity assessment', () => {
  it('accepts learner-created output instead of requiring one exact source or answer', async () => {
    const activity = getLessonById('saying-something')!.steps[0].activity!
    const result = await assessActivity(activity, {
      code: 'print("Good morning!")',
      execution: success('Good morning!\n'),
      runPython: noRun,
    })
    expect(result.passed).toBe(true)
  })

  it('reports output evidence when a learner prediction does not match real Python', async () => {
    const activity = getLessonById('instructions-in-order')!.steps[0].activity!
    expect(activity.kind).toBe('predict-output')
    if (activity.kind !== 'predict-output') throw new Error('Expected a prediction activity')
    const result = await assessActivity(activity, {
      response: 'Third\nSecond\nFirst',
      execution: success('First\nSecond\nThird\n'),
      runPython: noRun,
    })
    expect(result.passed).toBe(false)
    expect(result.evidence).toEqual({ expected: 'First\nSecond\nThird', actual: 'Third\nSecond\nFirst' })
  })

  it('checks line ordering as data and rejects malformed ordering definitions', async () => {
    const activity = getLessonById('instructions-in-order')!.steps[1].activity!
    expect(activity.kind).toBe('arrange-code')
    if (activity.kind !== 'arrange-code') throw new Error('Expected an arrange-code activity')
    expect((await assessActivity(activity, {
      response: activity.correctOrder,
      execution: success(''),
      runPython: noRun,
    })).passed).toBe(true)
    expect((await assessActivity(activity, {
      response: ['first', 'first', 'third'],
      execution: success(''),
      runPython: noRun,
    })).passed).toBe(false)
  })

  it('requires an observable experiment but accepts duplicate, deleted, reordered, and changed output', async () => {
    const activity = getLessonById('one-change-one-consequence')!.steps[0].activity!
    expect((await assessActivity(activity, {
      code: 'print("Ready")\nprint("Go!")',
      execution: success('Ready\nGo!\n'),
      runPython: noRun,
    })).passed).toBe(false)
    expect((await assessActivity(activity, {
      code: 'print("Ready")\nprint("Go!")\nprint("Go!")',
      execution: success('Ready\nGo!\nGo!\n'),
      runPython: noRun,
    })).passed).toBe(true)
    expect((await assessActivity(activity, {
      code: 'print("Go!")\nprint("Ready")',
      execution: success('Go!\nReady\n'),
      runPython: noRun,
    })).passed).toBe(true)
  })

  it('shows syntax errors as repair clues and passes once the learner fixes the code', async () => {
    const activity = getLessonById('computers-are-literal')!.steps[0].activity!
    const failed = await assessActivity(activity, {
      code: 'print("Hello)',
      execution: { ...success(''), status: 'error', error: 'SyntaxError: unterminated string literal' },
      runPython: noRun,
    })
    expect(failed.passed).toBe(false)
    expect(failed.message).toContain('Take a look at the error below')
    expect((await assessActivity(activity, {
      code: 'print("Hello")',
      execution: success('Hello\n'),
      runPython: noRun,
    })).passed).toBe(true)
  })

  it('treats blank rows as real output lines for the exact-three-line creation task', async () => {
    const activity = getLessonById('first-tiny-creation')!.steps[0].activity!
    expect((await assessActivity(activity, {
      code: 'print("A")\nprint()\nprint("C")',
      execution: success('A\n\nC\n'),
      runPython: noRun,
    })).passed).toBe(true)
    const tooShort = await assessActivity(activity, {
      code: 'print("A")\nprint("B")',
      execution: success('A\nB\n'),
      runPython: noRun,
    })
    expect(tooShort.passed).toBe(false)
    expect(tooShort.evidence?.expected).toBe('3 output lines')
  })

  it('uses the real worker trace contract for step-through activities', async () => {
    const activity = getLessonById('trace-the-execution-pointer')!.steps[0].activity!
    const result = await assessActivity(activity, {
      execution: success('A\nB\nC\n', [], [
        { line: 1, event: 'line', locals: {} },
        { line: 2, event: 'line', locals: {} },
        { line: 3, event: 'line', locals: {} },
      ]),
      runPython: noRun,
    })
    expect(result.passed).toBe(true)
  })

  it('supports behavior checks for multiple unseen input combinations', async () => {
    const activity: CodeActivity = {
      id: 'two-input-greeting',
      kind: 'code',
      title: 'Use two answers',
      prompt: 'Ask and use two answers.',
      required: true,
      starterCode: 'name = input()\nfood = input()\nprint(name, food)',
      assessment: {
        kind: 'behavior',
        cases: [
          { inputs: ['Ada', 'noodles'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
          { inputs: ['Grace', 'apples'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
        ],
      },
    }
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('Ada noodles\n'),
      runPython: async ({ input }) => {
        const lines = input?.lines ?? []
        return success(`${lines.join(' ')}\n`, lines.map((answer, inputIndex) => ({ inputIndex, prompt: '', answer })))
      },
    })
    expect(result.passed).toBe(true)
  })

  it('does not accept a program that skips one of the required answers', async () => {
    const activity: CodeActivity = {
      id: 'two-input-required',
      kind: 'code',
      title: 'Use two answers',
      prompt: 'Ask two questions.',
      required: true,
      starterCode: 'answer = input()\nprint(answer)',
      assessment: {
        kind: 'behavior',
        cases: [{ inputs: ['one', 'two'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] }],
      },
    }
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('one\n'),
      runPython: async ({ input }) => success(
        input?.lines?.[0] ?? '',
        [{ inputIndex: 0, prompt: '', answer: input?.lines?.[0] ?? '' }],
      ),
    })
    expect(result.passed).toBe(false)
    expect(result.message).toContain('Ask for all 2 answers')
  })

  it('checks state predictions from captured Python frames, not a TypeScript simulation', async () => {
    const activity: LearningActivity = {
      id: 'predict-score', kind: 'predict-state', title: 'Follow score', prompt: 'What is score?',
      required: true, code: 'score = 10\nscore = 20\nprint(score)', line: 2, variable: 'score', expectedValue: '20', choices: ['10', '20', '30'],
    }
    const result = await assessActivity(activity, {
      response: '20',
      execution: success('20\n', [], [
        { line: 1, event: 'line', locals: {} },
        { line: 2, event: 'line', locals: { score: 10 } },
        { line: 3, event: 'line', locals: { score: 20 } },
      ]),
      runPython: noRun,
    })
    expect(result.passed).toBe(true)
  })

  it('passes only the correct choice in a deterministic question', async () => {
    const activity: LearningActivity = {
      id: 'sequence-question', kind: 'choice', title: 'Sequence', prompt: 'What comes first?', required: true,
      options: [{ id: 'last', text: 'The last line' }, { id: 'first', text: 'The first line' }], correctOptionId: 'first',
    }
    expect((await assessActivity(activity, { response: 'first', execution: success(''), runPython: noRun })).passed).toBe(true)
    expect((await assessActivity(activity, { response: 'last', execution: success(''), runPython: noRun })).passed).toBe(false)
  })
})
