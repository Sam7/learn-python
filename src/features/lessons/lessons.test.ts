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
import type { AstRequirement, CodeActivity, LearningActivity } from '../../curriculum/types'
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

  it('publishes the fully authored first ten stages and leaves later curriculum unavailable', () => {
    expect(readyLessons.map((lesson) => lesson.title)).toEqual([
      'Make something happen',
      'Instructions happen in order',
      'One change → one consequence',
      'Computers are extremely literal',
      'Trace the execution pointer',
      'First tiny creation',
      'Values',
      'The computer can calculate',
      'Expressions collapse into values',
      'Expressions can contain expressions',
      'Text can be manipulated too',
      'Different values allow different operations',
      'Functions as black boxes',
      'Expression mini-challenge',
      'Giving a value a name',
      'The right side happens first',
      'Names make programs meaningful',
      'Values can change over time',
      'The famous x = x + 1',
      'Trace multiple pieces of state',
      'Programs can receive information',
      'Input is text',
      'Converting representations',
      'Build: the future machine',
      'Questions the computer can answer',
      'Boolean values',
      'One-way decision',
      'Two possible paths',
      'Boundaries matter',
      'More than two paths',
      'Combining conditions',
      'Either condition can be enough',
      'Negation',
      'Decision challenge',
      'Discover the repetition problem',
      'Repeat something a fixed number of times',
      'The loop variable changes',
      'Use the changing value',
      'State can survive between iterations',
      'Decisions inside repetition',
      'Repeat while something remains true',
      'The infinite loop',
      'Repeat until the user succeeds',
      'Build: launch sequence',
      'One name, many values',
      'Items have positions',
      'Boundaries again',
      'Do something for every item',
      'Combine collections with decisions',
      'Ask questions about collections',
      'Collections can change',
      'Strings are collections too',
      'Build: analyse some scores',
      'You have been using functions all along',
      'Give an action a name',
      'Give a function information',
      'Multiple inputs',
      'Producing a value',
      'return is not print',
      'Functions can be combined',
      'Local state',
      'Functions as contracts',
      'Build: mini maths toolkit',
      'Total / accumulate',
      'Count',
      'Average combines patterns',
      'Search',
      'Best so far',
      'Transform',
      'Filter',
      'Validate / repeat until acceptable',
      'Recognise the pattern',
      'Pattern transfer',
      'The problem with parallel variables',
      'A record with named fields',
      'Update a record',
      'Many structured things',
      'Query structured data',
      'Nested information',
      'Choose the representation',
      'Build: leaderboard',
      'Three fundamentally different failures',
      'Read the error message',
      'Expected versus actual',
      'Trace before changing',
      'Form a hypothesis',
      'Make the problem smaller',
      'Assertions',
      'Edge cases',
      'Fix one thing, test everything',
      'Refactor without changing behaviour',
    ])
    expect(allLessons.filter((lesson) => lesson.status === 'coming-soon')).toHaveLength(18)
    expect(readyLessons).toHaveLength(91)
    expect(getLessonLocation('saying-something')?.stage.id).toBe('stage-0')
    expect(getLessonById('stage-11-lesson-8')?.title).toBe('Independent capstone')
    expect(getNextCurriculumLesson('first-tiny-creation')?.title).toBe('Values')
    expect(getNextLesson('first-tiny-creation')?.title).toBe('Values')
    expect(getNextCurriculumLesson('stage-1-lesson-8')?.title).toBe('Giving a value a name')
    expect(getNextLesson('stage-1-lesson-8')?.title).toBe('Giving a value a name')
    expect(getNextCurriculumLesson('stage-2-lesson-10')?.title).toBe('Questions the computer can answer')
    expect(getNextLesson('stage-2-lesson-10')?.title).toBe('Questions the computer can answer')
    expect(getNextLesson('stage-3-lesson-10')?.title).toBe('Discover the repetition problem')
    expect(getNextCurriculumLesson('stage-4-lesson-10')?.title).toBe('One name, many values')
    expect(getNextLesson('stage-4-lesson-10')?.title).toBe('One name, many values')
    expect(getNextCurriculumLesson('stage-5-lesson-9')?.title).toBe('You have been using functions all along')
    expect(getNextLesson('stage-5-lesson-9')?.title).toBe('You have been using functions all along')
    expect(getNextCurriculumLesson('stage-6-lesson-10')?.title).toBe('Total / accumulate')
    expect(getNextLesson('stage-6-lesson-10')?.title).toBe('Total / accumulate')
    expect(getNextCurriculumLesson('stage-7-lesson-10')?.title).toBe('The problem with parallel variables')
    expect(getNextLesson('stage-7-lesson-10')?.title).toBe('The problem with parallel variables')
    expect(getNextCurriculumLesson('stage-8-lesson-8')?.title).toBe('Three fundamentally different failures')
    expect(getNextLesson('stage-8-lesson-8')?.title).toBe('Three fundamentally different failures')
    expect(getNextCurriculumLesson('stage-9-lesson-10')?.status).toBe('coming-soon')
    expect(getNextLesson('stage-9-lesson-10')).toBeUndefined()
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

  it('checks that branch-trace data defines distinct, valid paths', () => {
    const broken = structuredClone(curriculum)
    const activity = broken.stages.find((stage) => stage.id === 'stage-3')!
      .lessons[2].steps[0].activity!
    if (activity.kind !== 'branch-trace') throw new Error('Expected a branch-trace activity')
    activity.paths[0].lines = [3]
    activity.paths[1].lines = [3]
    activity.paths[1].otherwise = true

    const issues = validateCurriculum(broken)
    expect(issues).toContain(`Branch trace ${activity.id} cannot assign a line to multiple paths.`)
    expect(issues).toContain(`The otherwise path in branch trace ${activity.id} must not list exclusive lines.`)
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

describe('Stage 1 activity assessment', () => {
  it('publishes all eight lessons as complete, required learning journeys', () => {
    const stage = curriculum.stages.find((item) => item.id === 'stage-1')!
    expect(stage.lessons).toHaveLength(8)
    expect(stage.lessons.every((lesson) => lesson.status === 'ready' && lesson.steps.length > 0)).toBe(true)
    expect(stage.lessons.every((lesson) => lesson.steps.some((step) => step.activity?.required))).toBe(true)
    expect(stage.lessons.flatMap((lesson) => lesson.steps).flatMap((step) => step.content).some((block) => block.type === 'evaluation')).toBe(true)
  })

  it('treats only the expected runtime error as a successful observation', async () => {
    const activity = getLessonById('stage-1-lesson-6')!.steps[0].activity!
    expect(activity.kind).toBe('code')
    if (activity.kind !== 'code') throw new Error('Expected a code activity')
    const expected = await assessActivity(activity, {
      code: activity.starterCode,
      execution: { ...success(''), status: 'error', error: "TypeError: can only concatenate str (not \"int\") to str" },
      runPython: noRun,
    })
    expect(expected).toMatchObject({ passed: true })

    const unrelated = await assessActivity(activity, {
      code: activity.starterCode,
      execution: { ...success(''), status: 'error', error: 'ValueError: invalid value' },
      runPython: noRun,
    })
    expect(unrelated).toMatchObject({ passed: false, evidence: { expected: 'TypeError' } })

    const successful = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('7\n'),
      runPython: noRun,
    })
    expect(successful).toMatchObject({ passed: false, evidence: { actual: 'The program ran successfully.' } })
  })

  it('accepts changed parentheses only when both output lines are different and non-empty', async () => {
    const activity = getLessonById('stage-1-lesson-4')!.steps[1].activity!
    expect((await assessActivity(activity, {
      code: 'print((10 + 2) * 3)\nprint(10 + (2 * 3))',
      execution: success('36\n16\n'),
      runPython: noRun,
    })).passed).toBe(true)
    expect((await assessActivity(activity, {
      code: activity.kind === 'code' ? activity.starterCode : '',
      execution: success('36\n36\n'),
      runPython: noRun,
    })).passed).toBe(false)
    expect((await assessActivity(activity, {
      code: 'print((10 + 2) * 3)\nprint()',
      execution: success('36\n\n'),
      runPython: noRun,
    })).passed).toBe(false)
  })

  it('requires expressions to produce the requested seconds at every mini-challenge step', async () => {
    const lesson = getLessonById('stage-1-lesson-8')!
    const outputs = ['180', '7200', '8100']
    for (const [index, output] of outputs.entries()) {
      const activity = lesson.steps[index].activity!
      expect(activity.kind).toBe('code')
      const result = await assessActivity(activity, {
        code: `print(${output})`,
        execution: success(`${output}\n`),
        runPython: noRun,
      })
      expect(result.passed).toBe(true)
    }
  })
})

describe('Stage 2 activity assessment', () => {
  it('supports input that is transformed rather than echoed into output', async () => {
    const activity: CodeActivity = {
      id: 'convert-input-age',
      kind: 'code',
      title: 'Convert the age',
      prompt: 'Print the next age.',
      required: true,
      starterCode: 'age = int(input())\nprint(age + 1)',
      assessment: {
        kind: 'behavior',
        cases: [
          { inputs: ['12'], output: { mode: 'exact', lines: ['13'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
          { inputs: ['7'], output: { mode: 'exact', lines: ['8'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
        ],
      },
    }
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('13\n'),
      runPython: async ({ input }) => {
        const answer = input?.lines?.[0] ?? ''
        const numericAnswer = Number(answer)
        return success(`${numericAnswer + 1}\n`, [{ inputIndex: 0, prompt: '', answer }])
      },
    })
    expect(result.passed).toBe(true)
  })

  it('checks multiple learner-filled state cells against actual execution frames', async () => {
    const candidate = getLessonById('stage-2-lesson-6')!.steps[0].activity!
    expect(candidate.kind).toBe('trace-table')
    if (candidate.kind !== 'trace-table') throw new Error('Expected a trace-table activity')
    const execution = success('6 3\n', [], [
      { line: 1, event: 'line', locals: {} },
      { line: 2, event: 'line', locals: { coins: 5 } },
      { line: 4, event: 'line', locals: { coins: 5, stars: 2 } },
      { line: 5, event: 'line', locals: { coins: 8, stars: 2 } },
      { line: 6, event: 'line', locals: { coins: 8, stars: 3 } },
      { line: 7, event: 'line', locals: { coins: 6, stars: 3 } },
    ])
    const response = {
      'after-coins-start:coins': '5', 'after-coins-start:stars': '—',
      'after-stars-start:coins': '5', 'after-stars-start:stars': '2',
      'after-coins-plus:coins': '8', 'after-coins-plus:stars': '2',
      'after-stars-plus:coins': '8', 'after-stars-plus:stars': '3',
      'after-coins-minus:coins': '6', 'after-coins-minus:stars': '3',
    }
    expect(await assessActivity(candidate, { response, execution, runPython: noRun })).toMatchObject({ passed: true })

    const incorrect = await assessActivity(candidate, {
      response: { ...response, 'after-coins-start:coins': '4' },
      execution,
      runPython: noRun,
    })
    expect(incorrect).toMatchObject({ passed: false, evidence: { expected: '5', actual: '4' } })
    expect(incorrect.message).toContain('after line 1, coins is 5')
  })

  it('uses repeated occurrences of one source line as successive loop-state checkpoints', async () => {
    const activity: LearningActivity = {
      id: 'trace-loop-total',
      kind: 'trace-table',
      title: 'Follow the total',
      prompt: 'Record the total after each repetition.',
      required: true,
      code: 'total = 0\nfor step in [2, 3]:\n    total = total + step\n    print(total)',
      variables: ['total'],
      checkpoints: [
        { id: 'first', line: 3, occurrence: 1, label: 'after repetition 1' },
        { id: 'second', line: 3, occurrence: 2, label: 'after repetition 2' },
      ],
    }
    const execution = success('2\n5\n', [], [
      { line: 1, event: 'line', locals: {} },
      { line: 2, event: 'line', locals: { total: 0 } },
      { line: 3, event: 'line', locals: { total: 0, step: 2 } },
      { line: 4, event: 'line', locals: { total: 2, step: 2 } },
      { line: 3, event: 'line', locals: { total: 2, step: 3 } },
      { line: 4, event: 'line', locals: { total: 5, step: 3 } },
    ])

    expect(await assessActivity(activity, {
      response: { 'first:total': '2', 'second:total': '5' },
      execution,
      runPython: noRun,
    })).toMatchObject({ passed: true })
  })

  it('runs the AST check only after the required output has passed', async () => {
    const activity = getLessonById('stage-2-lesson-1')!.steps[1].activity!
    expect(activity.kind).toBe('code')
    if (activity.kind !== 'code') throw new Error('Expected a code activity')
    let astRunCount = 0
    const runAst = async () => {
      astRunCount += 1
      return success('')
    }
    expect((await assessActivity(activity, {
      code: 'points = 10\nprint(points)',
      execution: success('10\n'),
      runPython: runAst,
    })).passed).toBe(true)
    expect(astRunCount).toBe(1)

    const wrongOutput = await assessActivity(activity, {
      code: 'points = 10\nprint(points)',
      execution: success('11\n'),
      runPython: runAst,
    })
    expect(wrongOutput.passed).toBe(false)
    expect(astRunCount).toBe(1)
  })
})

describe('Stage 3 decision assessment capabilities', () => {
  it('checks a path prediction against actual Python line events', async () => {
    const activity: LearningActivity = {
      id: 'predict-temperature-path',
      kind: 'branch-trace',
      title: 'Predict the path',
      prompt: 'Choose the branch.',
      required: true,
      code: 'temperature = 35\nif temperature > 30:\n    print("Hot")\nelse:\n    print("Cool")',
      paths: [
        { id: 'hot', label: 'Hot', lines: [3] },
        { id: 'cool', label: 'Cool', lines: [5] },
      ],
    }
    const execution = success('Hot\n', [], [
      { line: 1, event: 'line', locals: {} },
      { line: 2, event: 'line', locals: { temperature: 35 } },
      { line: 3, event: 'line', locals: { temperature: 35 } },
    ])

    expect(await assessActivity(activity, { response: 'hot', execution, runPython: noRun }))
      .toMatchObject({ passed: true, message: 'Correct — Python took the “Hot” path.' })
    expect(await assessActivity(activity, { response: 'cool', execution, runPython: noRun }))
      .toMatchObject({ passed: false, evidence: { expected: 'Hot', actual: 'Cool' } })
  })

  it('requires structured AST concepts in addition to passing varied behaviour cases', async () => {
    const activity: CodeActivity = {
      id: 'build-a-decision',
      kind: 'code',
      title: 'Build a decision',
      prompt: 'Use an if statement.',
      required: true,
      starterCode: 'if ready:\n    print("Go")',
      assessment: {
        kind: 'behavior',
        cases: [{ inputs: [], output: { mode: 'exact', lines: ['Go'] } }],
        requirements: ['conditional', 'comparison'],
      },
    }
    const runner = async ({ code }: { code: string }) => code.includes('isinstance(node, ast.Compare)')
      ? { ...success(''), status: 'error' as const, error: 'AssertionError: Use a comparison.' }
      : success('Go\n')

    const failed = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('Go\n'),
      runPython: runner,
    })
    expect(failed).toMatchObject({ passed: false, message: 'Use a comparison such as >, <, ==, or >=.' })

    const passed = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('Go\n'),
      runPython: async ({ code }) => code.includes('import ast') ? success('') : success('Go\n'),
    })
    expect(passed).toMatchObject({ passed: true })
  })
})

describe('Stage 4 repetition safety', () => {
  it('passes an intentional timeout and explains when a loop actually finishes', async () => {
    const activity: CodeActivity = {
      id: 'observe-a-loop-timeout',
      kind: 'code',
      title: 'Observe the time limit',
      prompt: 'Run the loop and notice that Python stops it safely.',
      required: true,
      starterCode: 'while True:\n    print("again")',
      assessment: { kind: 'timeout' },
    }

    expect(await assessActivity(activity, {
      code: activity.starterCode,
      execution: { ...success(''), status: 'timeout' },
      runPython: noRun,
    })).toMatchObject({ passed: true, message: 'Good observation — Python stopped this run at the time limit.' })

    expect(await assessActivity(activity, {
      code: 'print("finished")',
      execution: success('finished\n'),
      runPython: noRun,
    })).toMatchObject({ passed: false, message: 'This program finished before the time limit. Make the loop condition stay True.' })
  })
})

describe('Stage 5 collection AST requirements', () => {
  it('describes ordinary output mismatches without referring to input answers', async () => {
    const activity = getLessonById('stage-5-lesson-2')!.steps[1].activity!
    if (activity.kind !== 'code') throw new Error('Expected a code activity')
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('cat\ndog\n'),
      runPython: async () => success('cat\ndog\n'),
    })

    expect(result).toMatchObject({
      passed: false,
      message: 'The result is not quite right yet. Compare your output with the task and try again.',
    })
  })

  it.each([
    ['list-literal', 'isinstance(node.value, ast.List)', 'scores = [8, 3, 10]\nprint(scores)'],
    ['list-index', 'isinstance(node, ast.Subscript)', 'animals = ["cat", "dog"]\nprint(animals[0])'],
    ['subscript', 'isinstance(node, ast.Subscript)', 'word = "python"\nprint(word[0])'],
    ['sequence-loop', 'sequence_names', 'animals = ["cat", "dog"]\nfor animal in animals:\n    print(animal)'],
    ['length-call', 'node.func.id == "len"', 'animals = ["cat", "dog"]\nprint(len(animals))'],
    ['membership-test', 'isinstance(operator, ast.In)', 'animals = ["cat", "dog"]\nprint("dog" in animals)'],
    ['append-call', 'node.func.attr == "append"', 'shopping = ["milk"]\nshopping.append("bread")\nprint(shopping)'],
  ] satisfies Array<[AstRequirement, string, string]>)('checks %s through Python AST', async (requirement, pattern, code) => {
    const activity: CodeActivity = {
      id: `check-${requirement}`,
      kind: 'code',
      title: 'Use the concept',
      prompt: 'Write the program.',
      required: true,
      starterCode: code,
      assessment: { kind: 'ast', requirement },
    }
    let astSource = ''
    const result = await assessActivity(activity, {
      code,
      execution: success(''),
      runPython: async ({ code: source }) => {
        astSource = source
        return success('')
      },
    })

    expect(result.passed).toBe(true)
    expect(astSource).toContain(pattern)
  })

  it('gives a concrete hint when the learner does not use append()', async () => {
    const activity: CodeActivity = {
      id: 'append-to-shopping',
      kind: 'code',
      title: 'Add an item',
      prompt: 'Add apples.',
      required: true,
      starterCode: 'shopping = ["milk"]',
      assessment: { kind: 'ast', requirement: 'append-call' },
    }
    const result = await assessActivity(activity, {
      code: 'shopping = ["milk"]\nshopping = shopping + ["apples"]\nprint(shopping)',
      execution: success("['milk', 'apples']\n"),
      runPython: async () => ({ ...success(''), status: 'error', error: 'AssertionError: Use shopping.append(item).' }),
    })

    expect(result).toMatchObject({ passed: false, message: 'Use list_name.append(item) to add an item to the list.' })
  })
})

describe('Stage 6 function AST requirements', () => {
  it.each([
    ['function-definition', 'isinstance(node, ast.FunctionDef)', 'def cheer():\n    print("You can do it!")\n\ncheer()'],
    ['function-call', 'node.func.id in function_names', 'def cheer():\n    print("You can do it!")\n\ncheer()'],
    ['function-parameter', 'argument.arg for argument in node.args.args', 'def greet(name):\n    print("Hello", name)\n\ngreet("Mia")'],
    ['multiple-parameters', 'len(node.args.args) >= 2', 'def show_score(name, score):\n    print(name, score)\n\nshow_score("Mia", 8)'],
    ['function-return', 'isinstance(child, ast.Return) and child.value is not None', 'def double(number):\n    return number * 2\n\nprint(double(6))'],
    ['local-scope', 'names_used_after_definition', 'def calculate():\n    result = 10\n    print(result)\n\ncalculate()\nprint(result)'],
  ] satisfies Array<[AstRequirement, string, string]>)('checks %s through Python AST', async (requirement, pattern, code) => {
    const activity: CodeActivity = {
      id: `check-${requirement}`,
      kind: 'code',
      title: 'Use the concept',
      prompt: 'Write the program.',
      required: true,
      starterCode: code,
      assessment: { kind: 'ast', requirement },
    }
    let astSource = ''
    const result = await assessActivity(activity, {
      code,
      execution: success(''),
      runPython: async ({ code: source }) => {
        astSource = source
        return success('')
      },
    })

    expect(result.passed).toBe(true)
    expect(astSource).toContain(pattern)
  })

  it('gives an actionable hint when a value is printed instead of returned', async () => {
    const activity: CodeActivity = {
      id: 'return-a-value',
      kind: 'code',
      title: 'Send back an answer',
      prompt: 'Return the doubled number.',
      required: true,
      starterCode: 'def double(number):\n    print(number * 2)',
      assessment: { kind: 'ast', requirement: 'function-return' },
    }
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('12\n'),
      runPython: async () => ({ ...success(''), status: 'error', error: 'AssertionError: Use return.' }),
    })

    expect(result).toMatchObject({
      passed: false,
      message: 'Use return to send a value back from the function.',
    })
  })

  it('only accepts the expected local-name error when the code demonstrates function scope', async () => {
    const activity: CodeActivity = {
      id: 'notice-local-scope',
      kind: 'code',
      title: 'Notice a local name',
      prompt: 'Observe what happens after the function finishes.',
      required: true,
      starterCode: 'def calculate():\n    result = 10\n    print(result)\n\ncalculate()\nprint(result)',
      assessment: { kind: 'runtime-error', exceptionName: 'NameError', requirements: ['local-scope'] },
    }
    expect(await assessActivity(activity, {
      code: activity.starterCode,
      execution: { ...success('10\n'), status: 'error', error: 'NameError: name \'result\' is not defined' },
      runPython: async () => success(''),
    })).toMatchObject({ passed: true })

    const unrelatedError = await assessActivity(activity, {
      code: 'print(missing_name)',
      execution: { ...success(''), status: 'error', error: 'NameError: name \'missing_name\' is not defined' },
      runPython: async ({ code }) => code.includes('names_used_after_definition')
        ? ({ ...success(''), status: 'error', error: 'AssertionError: not a local-scope example' })
        : success(''),
    })
    expect(unrelatedError).toMatchObject({
      passed: false,
      message: 'Try using a name assigned inside the function after the function finishes.',
    })
  })
})

describe('Python AST requirements', () => {
  it.each([
    ['total-accumulator', 'adds_current_item', 'numbers = [4, 7, 2]\ntotal = 0\nfor number in numbers:\n    total = total + number\nprint(total)'],
    ['total-accumulator', 'adds_current_item', 'total = 0\nfor number in [4, 7, 2]:\n    total = total + number\nprint(total)'],
    ['count-if', 'increments(node, counter_name)', 'scores = [4, 9, 2]\ncount = 0\nfor score in scores:\n    if score >= 7:\n        count = count + 1\nprint(count)'],
    ['search-flag', 'false_names', 'names = ["Mia", "Leo"]\nwanted = "Leo"\nfound = False\nfor name in names:\n    if name == wanted:\n        found = True\nprint(found)'],
    ['best-so-far', 'best_names', 'scores = [6, 3, 9, 7]\nbest = scores[0]\nfor score in scores:\n    if score > best:\n        best = score\nprint(best)'],
    ['transform-list', 'empty_list_names', 'numbers = [1, 2, 3]\ndoubled = []\nfor number in numbers:\n    doubled.append(number * 2)\nprint(doubled)'],
    ['filter-list', 'decision.body', 'scores = [4, 9, 2]\nhigh_scores = []\nfor score in scores:\n    if score >= 7:\n        high_scores.append(score)\nprint(high_scores)'],
    ['input-validation-loop', 'loop.test', 'age = int(input("Age: "))\nwhile age < 0:\n    age = int(input("Try again: "))\nprint(age)'],
    ['dictionary-literal', 'isinstance(node.value, ast.Dict)', 'student = {"name": "Mia", "age": 12}\nprint(student["name"])'],
    ['dictionary-field-read', 'isinstance(node.ctx, ast.Load)', 'student = {"name": "Mia"}\nprint(student["name"])'],
    ['dictionary-field-update', 'isinstance(node.ctx, ast.Store)', 'student = {"score": 88}\nstudent["score"] = 91\nprint(student["score"])'],
    ['list-of-records', 'len(node.value.elts) >= 2', 'students = [{"name": "Mia"}, {"name": "Leo"}]\nprint(students)'],
    ['record-iteration', 'field.value.id == loop.target.id', 'students = [{"name": "Mia"}, {"name": "Leo"}]\nfor student in students:\n    print(student["name"])'],
    ['record-filter', 'record_fields(decision.test, loop.target.id)', 'students = [{"name": "Mia", "score": 88}, {"name": "Leo", "score": 72}]\nfor student in students:\n    if student["score"] >= 80:\n        print(student["name"])'],
    ['record-total', 'adds_record_value(loop, loop.target.id, total_name)', 'students = [{"score": 88}, {"score": 72}]\ntotal = 0\nfor student in students:\n    total = total + student["score"]\nprint(total)'],
    ['multiple-assertions', 'len(assertions) < 3', 'def double(number):\n    return number * 2\nassert double(3) == 6\nassert double(0) == 0\nassert double(-2) == -4'],
    ['reused-function', 'if len(calls) < 2:', 'def show_result(score):\n    print(score)\nshow_result(8)\nshow_result(2)'],
  ] satisfies Array<[AstRequirement, string, string]>)('checks %s as a Python AST pattern', async (requirement, pattern, code) => {
    const activity: CodeActivity = {
      id: `check-${requirement}`,
      kind: 'code',
      title: 'Use the pattern',
      prompt: 'Write the algorithm.',
      required: true,
      starterCode: code,
      assessment: { kind: 'ast', requirement },
    }
    let astSource = ''
    const result = await assessActivity(activity, {
      code,
      execution: success(''),
      runPython: async ({ code: source }) => {
        astSource = source
        return success('')
      },
    })

    expect(result.passed).toBe(true)
    expect(astSource).toContain(pattern)
  })

  it('gives a pattern-focused hint when counting items without a condition', async () => {
    const activity: CodeActivity = {
      id: 'count-only-if-passing',
      kind: 'code',
      title: 'Count passing scores',
      prompt: 'Count scores of at least 7.',
      required: true,
      starterCode: 'scores = [4, 9, 2]\ncount = 0\nfor score in scores:\n    count = count + 1\nprint(count)',
      assessment: { kind: 'ast', requirement: 'count-if' },
    }
    const result = await assessActivity(activity, {
      code: activity.starterCode,
      execution: success('3\n'),
      runPython: async () => ({ ...success(''), status: 'error', error: 'AssertionError: count only when an item passes.' }),
    })

    expect(result).toMatchObject({
      passed: false,
      message: 'Start a count at 0 and add 1 only when an item passes an if test.',
    })
  })
})
