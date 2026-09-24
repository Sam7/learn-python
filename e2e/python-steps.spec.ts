import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { getLessonLocation, getRequiredActivityIds, readyLessons } from '../src/curriculum/curriculum'

const activitiesBefore = (lessonId: string) => {
  const target = getLessonLocation(lessonId)!
  return readyLessons
    .filter((lesson) => {
      const location = getLessonLocation(lesson.id)!
      return location.stage.order < target.stage.order
        || (location.stage.order === target.stage.order && lesson.order < target.lesson.order)
    })
    .flatMap(getRequiredActivityIds)
}

async function waitForPython(page: Page) {
  await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled({ timeout: 60_000 })
}

async function setEditorCode(page: Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.fill(code)
  await expect(editor).toContainText(code.split('\n')[0])
}

async function runAndExpectPass(page: Page, code: string) {
  await waitForPython(page)
  await setEditorCode(page, code)
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Great work', { timeout: 20_000 })
}

async function runStarterWithAnswers(page: Page, answers: string[]) {
  await waitForPython(page)
  await page.getByRole('button', { name: 'Run code' }).click()
  for (let index = 0; index < answers.length; index += 1) {
    await answerLivePrompt(page, answers[index], index + 1)
  }
  await expect(page.getByRole('status')).toContainText('Great work', { timeout: 30_000 })
}

async function finishTrace(page: Page) {
  await page.getByRole('button', { name: 'Run and trace' }).click()
  await expect(page.getByRole('button', { name: 'Next execution step' })).toBeVisible({ timeout: 20_000 })
  for (let step = 0; step < 100; step += 1) {
    if (await page.getByRole('button', { name: 'Finish trace' }).isVisible().catch(() => false)) break
    await page.getByRole('button', { name: 'Next execution step' }).click()
  }
  await page.getByRole('button', { name: 'Finish trace' }).click()
  await expect(page.getByRole('button', { name: 'Next step' })).toBeEnabled()
}

async function answerLivePrompt(page: Page, value: string, answerNumber: number) {
  const answer = page.getByRole('textbox', { name: `Answer ${answerNumber}` })
  await expect(answer).toBeVisible()
  await answer.fill(value)
  await page.getByRole('button', { name: /Send answer/ }).click()
}

async function capture(page: Page, testInfo: TestInfo, label: string, scrollToTop = true) {
  if (scrollToTop) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-${label}.png`, fullPage: false })
}

async function openStageOneExpressionLesson(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('python-steps:progress', JSON.stringify({
      version: 2,
      currentLessonId: 'stage-1-lesson-3',
      currentStepByLesson: { 'stage-1-lesson-3': 'watch-an-expression-collapse' },
      completedActivityIds: [
        'print-a-greeting',
        'predict-message-order',
        'put-instructions-in-order',
        'experiment-with-output',
        'repair-a-missing-quote',
        'trace-three-instructions',
        'write-a-three-line-introduction',
        'predict-number-and-text',
        'number-or-text',
        'predict-three-calculations',
        'edit-three-calculations',
      ],
      activityProgress: {},
    }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Expressions collapse into values' })).toBeVisible()
}

async function openStageTwoTraceTableLesson(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('python-steps:progress', JSON.stringify({
      version: 2,
      currentLessonId: 'stage-2-lesson-6',
      currentStepByLesson: { 'stage-2-lesson-6': 'fill-the-state-trace-table' },
      completedActivityIds: [
        'print-a-greeting', 'predict-message-order', 'put-instructions-in-order',
        'experiment-with-output', 'repair-a-missing-quote', 'trace-three-instructions',
        'write-a-three-line-introduction',
        'predict-number-and-text', 'number-or-text', 'predict-three-calculations',
        'edit-three-calculations', 'predict-expression-result', 'create-an-expression-for-twenty',
        'predict-two-parenthesized-expressions', 'make-parentheses-change-the-result',
        'predict-joined-and-repeated-text', 'predict-joining-digit-text',
        'observe-mixed-value-type-error', 'predict-length-of-word', 'find-length-of-python',
        'calculate-three-minutes', 'calculate-two-hours', 'calculate-two-hours-fifteen-minutes',
        'predict-named-score', 'create-a-named-value', 'predict-calculation-before-assignment',
        'calculate-before-saving', 'choose-the-clearer-program', 'name-price-and-quantity',
        'predict-changing-score-output', 'reassign-the-same-name', 'predict-incremented-score',
        'increment-a-number',
      ],
      activityProgress: {},
    }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Trace multiple pieces of state' })).toBeVisible()
}

async function openLesson(page: Page, lessonId: string, stepId: string) {
  await page.addInitScript(({ completedActivityIds, currentLessonId, currentStepId, seedId }) => {
    if (sessionStorage.getItem(seedId)) return
    sessionStorage.setItem(seedId, 'true')
    localStorage.setItem('python-steps:progress', JSON.stringify({
      version: 2,
      currentLessonId,
      currentStepByLesson: { [currentLessonId]: currentStepId },
      completedActivityIds,
      activityProgress: {},
    }))
  }, {
    completedActivityIds: activitiesBefore(lessonId),
    currentLessonId: lessonId,
    currentStepId: stepId,
    seedId: `python-steps:e2e-seed:${Date.now()}-${Math.random()}`,
  })
  await page.goto('/')
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const initialized = 'python-steps:e2e-storage-cleared'
    if (sessionStorage.getItem(initialized)) return
    localStorage.clear()
    sessionStorage.setItem(initialized, 'true')
  })
})

test('Stage 0: prediction, output, and saved progress work across a refresh', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The full Python journey runs in Chromium; WebKit is reserved for tablet layout and focus checks.')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Make something happen' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('print')
  await expect(page.getByText('Nothing leaves this browser · progress saved on this device.')).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Check answer' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Collapse lesson navigation' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Required task progress' })).toHaveAttribute('aria-valuenow', '0')

  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText('Run the task to see what Python says.')
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await expect(page.getByText('Change only the words between the quotation marks.')).toBeVisible()
  await capture(page, testInfo, 'desktop')

  await runAndExpectPass(page, 'print("Good morning!")')
  await expect(output).toContainText('Good morning!')
  await expect(page.getByRole('progressbar', { name: 'Required task progress' })).toHaveAttribute('aria-valuenow', '1')
  await page.getByRole('button', { name: 'Next lesson' }).click()
  await expect(page.getByRole('heading', { name: 'Instructions happen in order' })).toBeVisible()

  const prediction = page.getByRole('textbox', { name: 'Your output prediction' })
  await prediction.fill('First\nSecond\nThird')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Instructions happen in order' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your output prediction' })).toHaveValue('First\nSecond\nThird')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed First', { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Next step' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await page.getByRole('button', { name: 'Move line 1 down' }).click()
  await page.getByRole('button', { name: 'Move line 2 down' }).click()
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeEnabled()
})

test('Stages 0–2: the first three curriculum stages complete and unlock Decisions', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Curriculum content execution is covered in Chromium.')
  test.setTimeout(240_000)
  await page.goto('/')
  const output = page.getByRole('region', { name: 'Python output' })
  await runAndExpectPass(page, 'print("Mine!")')
  await page.getByRole('button', { name: 'Next lesson' }).click()
  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('First\nSecond\nThird')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed First', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'Move line 1 down' }).click()
  await page.getByRole('button', { name: 'Move line 2 down' }).click()
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'print("Ready")\nprint("Go!")\nprint("Go!")')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('textbox', { name: 'Your reflection' }).fill('I duplicated the second instruction, so the message appeared twice.')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(output).toContainText('Python couldn’t run this yet.', { timeout: 20_000 })
  await expect(output).toContainText('SyntaxError')
  await setEditorCode(page, 'print("Hello")')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Great work', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run and trace' }).click()
  const tracePanel = page.getByRole('region', { name: 'Step through the program' })
  await expect(tracePanel.getByText(/Step 1 of/)).toBeVisible({ timeout: 20_000 })
  for (let step = 0; step < 20; step += 1) {
    if (await page.getByRole('button', { name: 'Finish trace' }).isVisible().catch(() => false)) break
    await page.getByRole('button', { name: 'Next execution step' }).click()
  }
  await page.getByRole('button', { name: 'Finish trace' }).click()
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'print("My name is Nova")\nprint("I live under the sea")\nprint("I collect tiny rocks")')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await expect(page.getByRole('progressbar', { name: 'Required task progress' })).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByText('6/6 ready')).toBeVisible()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'Values', exact: true })).toBeVisible()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('7\nseven')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 7')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'No. One is a number; one is text.' }).click()
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('7\n8\n30')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 7')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(4 + 3)\nprint(10 - 2)\nprint(6 * 5)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await capture(page, testInfo, 'stage-1-expression-desktop')
  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('14')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 14')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(4 * 5)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('36\n16')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 36')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print((10 + 2) * 3)\nprint(10 + (2 * 3))')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('haha\nhahaha')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed haha')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('52')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 52')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(output).toContainText('Python raised TypeError, as expected.')
  await expect(output).toContainText('TypeError:')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('8')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 8')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(len("Python"))')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'print(3 * 60)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(2 * 60 * 60)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(2 * 60 * 60 + 15 * 60)')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await expect(page.getByText('8/8 ready')).toBeVisible()
  await page.getByRole('button', { name: 'Show a hint' }).click()
  await capture(page, testInfo, 'stage-1-desktop')
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'Giving a value a name' })).toBeVisible()

  await page.getByRole('radio', { name: '10', exact: true }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('score is 10 after line 1')
  await page.getByRole('button', { name: 'Next step' }).click()
  await setEditorCode(page, 'print(10)')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Give a value a name')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await runAndExpectPass(page, 'points = 10\nprint(points)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: '8', exact: true }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('score is 8 after line 1')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'answer = 12 + 3\nprint(answer)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: /price and quantity/ }).click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'cost = 12\ncount = 4\nprint(cost * count)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('10\n20')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 10')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'points = 10\nprint(points)\npoints = 20\nprint(points)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: '11', exact: true }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('score is 11 after line 2')
  await page.getByRole('button', { name: 'Next step' }).click()
  await setEditorCode(page, 'score = 20\nscore = 21\nprint(score)')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Use the current value on the right side')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await runAndExpectPass(page, 'score = 20\nscore = score + 1\nprint(score)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  const traceTable = [
    ['coins after line 1', '5'], ['stars after line 1', '—'],
    ['coins after line 2', '5'], ['stars after line 2', '2'],
    ['coins after line 4', '8'], ['stars after line 4', '2'],
    ['coins after line 5', '8'], ['stars after line 5', '3'],
    ['coins after line 6', '6'], ['stars after line 6', '3'],
  ] as const
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await capture(page, testInfo, 'stage-2-trace-table-desktop')
  for (const [label, value] of traceTable) await page.getByRole('textbox', { name: label }).fill(value)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'stars after line 1' })).toHaveValue('—')
  await page.getByRole('textbox', { name: 'coins after line 1' }).fill('4')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('after line 1, coins is 5')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await page.getByRole('textbox', { name: 'coins after line 1' }).fill('5')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('matches the values Python had at every checkpoint', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await answerLivePrompt(page, 'Sam', 1)
  await expect(page.getByRole('status')).toContainText('works with different answers', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await answerLivePrompt(page, '12', 1)
  await expect(output).toContainText('Python raised TypeError, as expected.', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await answerLivePrompt(page, '12', 1)
  await expect(page.getByRole('status')).toContainText('works with different answers', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await answerLivePrompt(page, 'Maya', 1)
  await answerLivePrompt(page, '12', 2)
  await expect(page.getByRole('status')).toContainText('works with different answers', { timeout: 20_000 })
  await expect(page.getByRole('button', { name: /Names, State, and Input Stage complete/ })).toContainText('10/10 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'Questions the computer can answer' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Questions the computer can answer' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your output prediction' })).toBeVisible()
})

test('Stage 3: comparisons and decision paths work through the full chapter', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(240_000)
  await openLesson(page, 'stage-3-lesson-1', 'predict-comparison-answers')
  await expect(page.getByRole('heading', { name: 'Questions the computer can answer' })).toBeVisible()

  const prediction = page.getByRole('textbox', { name: 'Your output prediction' })
  await prediction.fill('True\nTrue\nTrue')
  await expect(page.getByRole('button', { name: 'Run and compare' })).toBeEnabled({ timeout: 60_000 })
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Python printed True')
  await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
  await prediction.fill('True\nTrue\nFalse')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed True')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'print(9 >= 8)\nprint(9 != 8)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'is_raining = True\nprint(is_raining)')
  await page.getByRole('button', { name: 'Next step' }).click()
  const booleanPrediction = page.getByRole('textbox', { name: 'Your output prediction' })
  await booleanPrediction.fill('False')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Python printed True')
  await booleanPrediction.fill('True')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed True')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: 'The indented message is skipped' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Python took the “The indented message runs” path', { timeout: 20_000 })
  await expect(page.getByLabel('Line 3 executed')).toBeVisible()
  await page.getByRole('radio', { name: 'The indented message runs' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “The indented message runs” path')
  await capture(page, testInfo, 'stage-3-branch-trace-desktop')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('radio', { name: 'The indented message runs' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Python took the “The indented message is skipped” path')
  await expect(page.getByLabel('Line 3 skipped')).toBeVisible()
  await page.getByRole('radio', { name: 'The indented message is skipped' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “The indented message is skipped” path')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: 'The Teen path' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “The Teen path” path')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['14'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await prediction.fill('False False\nFalse True\nTrue True')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed False False')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['13'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: 'Silver' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “Silver” path')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['72'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: 'The ride message runs' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “The ride message runs” path')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['12', '145'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  const tableAnswers = ['School', 'No school', 'No school', 'No school']
  for (const [index, answer] of tableAnswers.entries()) {
    await page.getByRole('button', { name: answer, exact: true }).click()
    if (index < tableAnswers.length - 1) await page.getByRole('button', { name: 'Next step' }).click()
  }
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['no', 'no'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('radio', { name: 'Door can open' }).check()
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “Door can open” path')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, ['no'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runStarterWithAnswers(page, ['32', 'no'])
  await expect(page.getByRole('button', { name: /Decisions Stage complete/ })).toContainText('10/10 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'Discover the repetition problem' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Discover the repetition problem' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('print')
})

test('Stage 4: repetition and changing loop state work through the full chapter', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(240_000)
  await openLesson(page, 'stage-4-lesson-1', 'add-one-more-jump')
  await expect(page.getByRole('heading', { name: 'Discover the repetition problem' })).toBeVisible()

  await runAndExpectPass(page, 'print("Jump!")\nprint("Jump!")\nprint("Jump!")\nprint("Jump!")\nprint("Jump!")\nprint("Jump!")')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runStarterWithAnswers(page, [])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  const prediction = page.getByRole('textbox', { name: 'Your output prediction' })
  await prediction.fill('0\n1\n2\n3\n4')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 0')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'It starts at 0 and stops before 5.' }).click()
  await expect(page.getByRole('status')).toContainText('five values starting at 0')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await prediction.fill('0\n2\n4\n6\n8')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 0')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'for number in range(5):\n    print(number * 3)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await finishTrace(page)
  await page.getByRole('button', { name: 'Next step' }).click()
  const loopTable = [
    ['total after turn 1', '2'],
    ['total after turn 2', '4'],
    ['total after turn 3', '6'],
    ['total after turn 4', '8'],
  ] as const
  for (const [label, value] of loopTable) await page.getByRole('textbox', { name: label }).fill(value)
  await page.getByRole('textbox', { name: 'total after turn 1' }).fill('3')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('after turn 1, total is 2')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await page.getByRole('textbox', { name: 'total after turn 1' }).fill('2')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('matches the values Python had at every checkpoint')
  await capture(page, testInfo, 'stage-4-loop-state-desktop')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await finishTrace(page)
  await page.getByRole('button', { name: 'Next step' }).click()
  await prediction.fill('3\n4\n5')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 3')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await finishTrace(page)
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'count becomes 0, so count > 0 is False.' }).click()
  await expect(page.getByRole('status')).toContainText('repeated subtraction eventually makes the condition False')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runStarterWithAnswers(page, [])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('stopped this run at the time limit', { timeout: 20_000 })
  await expect(page.getByText('Python stopped this program at the time limit, as expected.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'count stays 3 because the loop never changes it.' }).click()
  await expect(page.getByRole('status')).toContainText('count needs to change')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runStarterWithAnswers(page, ['ruby', 'python'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runStarterWithAnswers(page, ['5'])
  await expect(page.getByRole('button', { name: /Repetition and Time Stage complete/ })).toContainText('10/10 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'One name, many values' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'One name, many values' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Collections/ })).toBeVisible()
})

test('Stage 5: collections, positions, iteration, and questions work through the full chapter', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(240_000)
  await openLesson(page, 'stage-5-lesson-1', 'choose-a-clearer-group')
  await expect(page.getByRole('heading', { name: 'One name, many values' })).toBeVisible()

  await page.getByRole('button', { name: 'scores = [12, 15, 9]' }).click()
  await expect(page.getByRole('status')).toContainText('one list name gives us a way to work with the whole group')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'scores = [12, 15, 9]\nprint(scores)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('cat\ndog')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed cat')
  await page.getByRole('button', { name: 'Next step' }).click()
  await setEditorCode(page, 'animals = ["cat", "dog", "rabbit"]\nprint(animals[0])\nprint(animals[1])')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('not quite right yet')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await setEditorCode(page, 'animals = ["cat", "dog", "rabbit"]\nprint(animals[0])\nprint(animals[1])\nprint(animals[2])')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Great work', { timeout: 20_000 })
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('IndexError', { timeout: 20_000 })
  await expect(page.getByRole('status')).toContainText('raised the expected IndexError')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'animals = ["cat", "dog", "rabbit"]\nfor animal in animals:\n    print(animal)')
  await page.getByRole('button', { name: 'Next lesson' }).click()
  await runAndExpectPass(page, 'scores = [4, 9, 2, 10, 7]\nfor score in scores:\n    if score >= 7:\n        print(score)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('3\nTrue')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 3')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'names = ["Mia", "Leo", "Ava"]\nprint(len(names))\nprint("Leo" in names)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'shopping = ["milk", "bread"]\nshopping.append("apples")\nprint(shopping)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'for letter in word:' }).click()
  await expect(page.getByRole('status')).toContainText('string is an ordered sequence')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'word = "python"\nfor letter in word:\n    print(letter)\nprint(word[0])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'scores = [8, 3, 10, 6, 9]\nfor score in scores:\n    print(score)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'scores = [8, 3, 10, 6, 9]\nfor score in scores:\n    if score >= 7:\n        print(score)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'scores = [8, 3, 10, 6, 9]\nprint(len(scores))')
  await capture(page, testInfo, 'stage-5-score-analysis-desktop')
  await expect(page.getByRole('button', { name: /Collections Stage complete/ })).toContainText('9/9 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'You have been using functions all along' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'You have been using functions all along' })).toBeVisible()
})

test('Stage 6: functions, parameters, return values, and scope work through the full chapter', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(300_000)
  await openLesson(page, 'stage-6-lesson-1', 'spot-familiar-functions')
  await expect(page.getByRole('heading', { name: 'You have been using functions all along' })).toBeVisible()

  await page.getByRole('button', { name: 'They call a function by writing its name and parentheses.' }).click()
  await expect(page.getByRole('status')).toContainText('the name tells Python which function to use')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'word = "python"\nprint(len(word))\nprint(int("12") + 1)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('The program starts\nThe program continues')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed The program starts')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'def cheer():\n    print("You can do it!")\n\ncheer()\ncheer()')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'def greet(name):\n    print("Hello", name)\n\ngreet("Mia")\ngreet("Leo")')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'show_score("Mia", 8)' }).click()
  await expect(page.getByRole('status')).toContainText('the first value goes to name')
  await page.getByRole('button', { name: 'Next step' }).click()
  await setEditorCode(page, 'def show_score(name, score):\n    print(name, "scored", score)\n\nshow_score(8, "Mia")\nshow_score(10, "Leo")')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('not quite right yet')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await runAndExpectPass(page, 'def show_score(name, score):\n    print(name, "scored", score)\n\nshow_score("Mia", 8)\nshow_score("Leo", 10)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'def double(number):\n    return number * 2\n\nprint(double(6))\nprint(double(9))')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Return number * 2 from inside the function.' }).click()
  await expect(page.getByRole('status')).toContainText('return supplies the value')
  await page.getByRole('button', { name: 'Next step' }).click()
  await setEditorCode(page, 'def double(number):\n    print(number * 2)\n\nprint(double(6) + 1)\nprint(double(9) + 1)')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('TypeError', { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await runAndExpectPass(page, 'def double(number):\n    return number * 2\n\nprint(double(6) + 1)\nprint(double(9) + 1)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('11')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 11')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'def double(number):\n    return number * 2\n\ndef add_one(number):\n    return number + 1\n\nprint(add_one(double(5)))\nprint(add_one(double(7)))')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Inside calculate(), where the name was created.' }).click()
  await expect(page.getByRole('status')).toContainText('result is local to calculate()')
  await page.getByRole('button', { name: 'Next step' }).click()
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('NameError', { timeout: 20_000 })
  await expect(page.getByRole('status')).toContainText('raised the expected NameError')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'Return width * height.' }).click()
  await expect(page.getByRole('status')).toContainText('multiplying the two inputs')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'def area(width, height):\n    return width * height\n\nprint(area(3, 4))\nprint(area(5, 2))')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'def double(number):\n    return number * 2\n\nprint(double(3))\nprint(double(6))')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'def is_even(number):\n    return number % 2 == 0\n\nprint(is_even(4))\nprint(is_even(7))')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'def larger(a, b):\n    if a > b:\n        return a\n    return b\n\nprint(larger(3, 4))\nprint(larger(5, 2))\nprint(larger(7, 7))')
  await capture(page, testInfo, 'stage-6-mini-toolkit-desktop')
  await expect(page.getByRole('button', { name: /Functions and Abstraction Stage complete/ })).toContainText('10/10 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'Total / accumulate' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Total / accumulate' })).toBeVisible()
})

test('Stage 7: algorithm patterns work across the full chapter and transfer to new examples', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(300_000)
  await openLesson(page, 'stage-7-lesson-1', 'build-the-total-pattern')
  await expect(page.getByRole('heading', { name: 'Total / accumulate' })).toBeVisible()

  await setEditorCode(page, 'numbers = [4, 7, 2]\ntotal = 1\nfor number in numbers:\n    total = total + number\nprint(total)')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('not quite right yet')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()
  await runAndExpectPass(page, 'numbers = [4, 7, 2]\ntotal = 0\nfor number in numbers:\n    total = total + number\nprint(total)')
  await page.locator('.cm-content').scrollIntoViewIfNeeded()
  await capture(page, testInfo, 'stage-7-code-workspace-desktop', false)
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'scores = [4, 9, 2, 10, 7]\ncount = 0\nfor score in scores:\n    if score >= 7:\n        count = count + 1\nprint(count)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('32\n5\n6.4')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 32')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'scores = [4, 9, 2, 10, 7]\ntotal = 0\nfor score in scores:\n    total = total + score\ncount = len(scores)\naverage = total / count\nprint(average)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await setEditorCode(page, 'names = ["Mia", "Leo", "Ava"]\nwanted = input("Name to find: ")\nfound = False\nfor name in names:\n    if name == wanted:\n        found = True\nprint(found)')
  await runStarterWithAnswers(page, ['Leo'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('textbox', { name: 'Your output prediction' }).fill('6\n6\n9\n9')
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python printed 6')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'scores = [-6, -3, -9, -7]\nbest = scores[0]\nfor score in scores:\n    if score > best:\n        best = score\nprint(best)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'numbers = [1, -2, 3]\ndoubled = []\nfor number in numbers:\n    doubled.append(number * 2)\nprint(doubled)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'scores = [4, 9, 2, 10, 7]\nhigh_scores = []\nfor score in scores:\n    if score >= 7:\n        high_scores.append(score)\nprint(high_scores)')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await setEditorCode(page, 'age = int(input("Age: "))\nwhile age < 0:\n    age = int(input("Try again: "))\nprint(age)')
  await runStarterWithAnswers(page, ['-1', '12'])
  await page.getByRole('button', { name: 'Next lesson' }).click()

  const patternAnswers = [
    ['Count items that pass a test', 'check each day and add 1 for every rainy one'],
    ['Keep the best value so far', 'keep the hottest value found so far'],
    ['Keep items that pass a test', 'keep each name that passes'],
    ['Transform every item', 'transform every temperature'],
    ['Search for a match', 'search until you find a match'],
  ] as const
  for (const [answer, feedback] of patternAnswers) {
    await page.getByRole('button', { name: answer, exact: true }).click()
    await expect(page.getByRole('status')).toContainText(feedback)
    if (answer !== 'Search for a match') await page.getByRole('button', { name: 'Next step' }).click()
  }
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runAndExpectPass(page, 'scores = [4, 9, 2, 10, 7]\ncount = 0\nfor score in scores:\n    if score >= 7:\n        count = count + 1\nprint(count)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'rained = [True, False, True, True]\nrainy_days = 0\nfor did_rain in rained:\n    if did_rain:\n        rainy_days = rainy_days + 1\nprint(rainy_days)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runAndExpectPass(page, 'words = ["water", "planet", "sun", "library"]\nlong_words = 0\nfor word in words:\n    if len(word) > 5:\n        long_words = long_words + 1\nprint(long_words)')
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.getByText('These problems looked different, but each used the same count-if pattern.')).toBeVisible()
  await capture(page, testInfo, 'stage-7-pattern-transfer-desktop')
  await expect(page.getByRole('button', { name: /Reusable Algorithmic Patterns Stage complete/ })).toContainText('10/10 ready')
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next stage' }).click()
  await expect(page.getByRole('heading', { name: 'The problem with parallel variables' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'The problem with parallel variables' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('python-steps:progress') ?? '{}') as {
      activityProgress?: Record<string, { code?: string }>
    }
    return saved.activityProgress?.['transfer-count-to-word-lengths']?.code
  })).toContain('long_words = long_words + 1')
})

async function runUnchangedStarterAndExpectBlocked(page: Page) {
  await waitForPython(page)
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled({ timeout: 20_000 })
  await expect(page.getByRole('button', { name: /Next (step|lesson|stage)/ })).toBeDisabled()
}

test('Stage 8: records and representations work through the full leaderboard project', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The complete Python curriculum journey runs in Chromium.')
  test.setTimeout(300_000)
  await openLesson(page, 'stage-8-lesson-1', 'spot-related-values')
  await expect(page.getByRole('heading', { name: 'The problem with parallel variables' })).toBeVisible()

  await page.getByRole('button', { name: 'Three separate loops' }).click()
  await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
  await page.getByRole('button', { name: 'One record with named fields' }).click()
  await expect(page.getByRole('button', { name: 'Next step' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next step' }).click()
  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'name = "Mia"\nage = 12\nscore = 88\nstudent = {"name": name, "age": age, "score": score}\nprint(student["name"])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'student = {"name": "Mia", "age": 12, "score": 88}\nprint(student["name"])\nprint(student["age"])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'student = {"name": "Mia", "age": 12, "score": 88}\nstudent["score"] = 91\nprint(student["score"])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'students = [{"name": "Mia", "score": 88}, {"name": "Leo", "score": 72}, {"name": "Ava", "score": 95}]\nfor student in students:\n    print(student["name"])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'students = [{"name": "Mia", "score": 88}, {"name": "Leo", "score": 72}, {"name": "Ava", "score": 95}]\nfor student in students:\n    if student["score"] >= 80:\n        print(student["name"])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  await page.getByRole('button', { name: 'A list of three numbers' }).click()
  await expect(page.getByRole('status')).toContainText('Right — the square brackets hold a list')
  await page.getByRole('button', { name: 'Next step' }).click()
  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'player = {"name": "Nova", "scores": [8, 10, 7]}\nprint(player["scores"][1])')
  await page.getByRole('button', { name: 'Next lesson' }).click()

  const representationAnswers = [
    ['represent-five-temperatures', 'A list'],
    ['represent-one-person', 'A dictionary'],
    ['represent-a-class', 'A list of dictionaries'],
    ['represent-a-shopping-cart', 'A list of dictionaries'],
  ] as const
  for (let index = 0; index < representationAnswers.length; index += 1) {
    const [, answer] = representationAnswers[index]
    const nextLabel = index === representationAnswers.length - 1 ? 'Next lesson' : 'Next step'
    await page.getByRole('button', { name: answer, exact: true }).click()
    await expect(page.getByRole('button', { name: nextLabel })).toBeEnabled()
    await page.getByRole('button', { name: nextLabel }).click()
  }

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'players = [{"name": "Nova", "score": 84}, {"name": "Pixel", "score": 93}, {"name": "Echo", "score": 76}]\nfor player in players:\n    print(player["name"], player["score"])')
  await page.getByRole('button', { name: 'Next step' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'players = [{"name": "Nova", "score": 84}, {"name": "Pixel", "score": 93}, {"name": "Echo", "score": 76}]\nbest = players[0]\nfor player in players:\n    if player["score"] > best["score"]:\n        best = player\nprint(best["name"])')
  await page.getByRole('button', { name: 'Next step' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'players = [{"name": "Nova", "score": 84}, {"name": "Pixel", "score": 93}, {"name": "Echo", "score": 76}]\ncount = 0\nfor player in players:\n    if player["score"] > 80:\n        count = count + 1\nprint(count)')
  await page.getByRole('button', { name: 'Next step' }).click()

  await runUnchangedStarterAndExpectBlocked(page)
  await runAndExpectPass(page, 'players = [{"name": "Nova", "score": 84}, {"name": "Pixel", "score": 93}, {"name": "Echo", "score": 76}]\ntotal = 0\nfor player in players:\n    total = total + player["score"]\naverage = total / len(players)\nprint(average)')
  await page.locator('.cm-content').scrollIntoViewIfNeeded()
  await capture(page, testInfo, 'stage-8-leaderboard-desktop', false)
  await expect(page.getByRole('button', { name: /Representing Information Stage complete/ })).toContainText('8/8 ready')
  await expect(page.getByRole('button', { name: 'Next stage coming soon' })).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Build: leaderboard' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('python-steps:progress') ?? '{}') as {
      activityProgress?: Record<string, { code?: string }>
    }
    return saved.activityProgress?.['leaderboard-average-score']?.code
  })).toContain('total = total + player["score"]')
})

test('Stage 8 structured-record coding stays usable at iPad sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Stage 8 tablet coverage uses WebKit iPad projects.')
  test.setTimeout(120_000)
  await openLesson(page, 'stage-8-lesson-5', 'find-students-over-eighty')
  await expect(page.getByRole('heading', { name: 'Query structured data' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 60_000 })

  await runUnchangedStarterAndExpectBlocked(page)
  const solution = 'students = [{"name": "Mia", "score": 88}, {"name": "Leo", "score": 72}, {"name": "Ava", "score": 95}]\nfor student in students:\n    if student["score"] >= 80:\n        print(student["name"])'
  await runAndExpectPass(page, solution)

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  if (initialOrientation === 'portrait') await expect(page.getByRole('button', { name: 'Open curriculum' })).toBeVisible()
  const output = page.getByRole('region', { name: 'Python output' })
  await output.scrollIntoViewIfNeeded()
  await expect(output).toContainText('Mia')
  await expect(output).toContainText('Ava')
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-8-record-filter`, false)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  await expect(page.getByRole('heading', { name: 'Query structured data' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('student["score"] >= 80')
  await output.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-8-record-filter`, false)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Query structured data' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('student["score"] >= 80')
})

test('invalid Python and runaway code show useful feedback and recover', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Runtime failure cases execute in Chromium.')
  test.setTimeout(40_000)
  await page.goto('/')
  await waitForPython(page)
  const output = page.getByRole('region', { name: 'Python output' })

  await setEditorCode(page, 'print("Hello Python!"')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(output).toContainText('Python couldn’t run this yet.', { timeout: 20_000 })
  await expect(output).toContainText('SyntaxError')
  await expect(page.getByRole('button', { name: 'Next lesson' })).toBeDisabled()

  await setEditorCode(page, 'while True:\n    pass')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(output).toContainText('endless loop', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled()
  await setEditorCode(page, 'print("recovered")')
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(output).toContainText('recovered', { timeout: 15_000 })
})

test('large Python output is bounded so a print-heavy program stays manageable', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The worker output limit is exercised in Chromium.')
  await page.goto('/')
  await waitForPython(page)
  await setEditorCode(page, 'for number in range(25000):\n    print("x")')
  await page.getByRole('button', { name: 'Run code' }).click()
  const output = page.getByRole('region', { name: 'Python output' }).locator('pre')
  await expect(output).toContainText('[Python output shortened after 20000 characters.]', { timeout: 20_000 })
  expect((await output.textContent())?.length ?? 0).toBeLessThan(21_000)
})

test('interactive Python input supports multiple answers without echoing them into output', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Python input behaviour executes in Chromium.')
  test.setTimeout(90_000)
  await page.goto('/')
  await waitForPython(page)
  await setEditorCode(page, 'first = input("First? ")\nsecond = input("Second? ")\nprint(first)\nprint(second)')
  await page.getByRole('button', { name: 'Run code' }).click()
  await answerLivePrompt(page, 'Ada', 1)
  await answerLivePrompt(page, 'Python', 2)
  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText('Ada')
  await expect(output).toContainText('Python')
  await expect(output).not.toContainText('First? Ada')
  await expect(output).not.toContainText('Second? Python')
})

test('tablet layout remains focusable, scrollable, and free from horizontal overflow @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Tablet coverage uses WebKit.')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Make something happen' })).toBeVisible()
  await expect(page.locator('.cm-content')).toBeVisible()
  await page.locator('.cm-content').click()
  await expect(page.locator('.cm-content')).toBeFocused()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const expectedWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(expectedWidth)
  if (initialOrientation === 'landscape') {
    await expect(page.getByRole('button', { name: 'Collapse lesson navigation' })).toBeVisible()
    const editorBox = await page.locator('.cm-editor').boundingBox()
    const outputBox = await page.getByRole('region', { name: 'Python output' }).boundingBox()
    expect(editorBox).not.toBeNull()
    expect(outputBox).not.toBeNull()
    expect(outputBox!.x).toBeGreaterThan(editorBox!.x + editorBox!.width / 2)
  } else {
    await expect(page.getByRole('button', { name: 'Open curriculum' })).toBeVisible()
  }
  await verifyViewport(page)
  await capture(page, testInfo, `ipad-${initialOrientation}`)

  if (initialOrientation === 'portrait') {
    await page.getByRole('button', { name: 'Open curriculum' }).click()
    const navigator = page.getByRole('dialog', { name: 'Choose a lesson' })
    await expect(navigator).toBeVisible()
    await expect(navigator.getByRole('button', { name: 'Make something happen' })).toBeVisible()
    await page.getByRole('button', { name: 'Close curriculum' }).last().click()
  }

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedWidth = rotatedOrientation === 'portrait' ? 834 : 1194
  await page.setViewportSize(rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 })
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedWidth)
  if (rotatedOrientation === 'portrait') {
    await expect(page.getByRole('button', { name: 'Open curriculum' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Collapse lesson navigation' })).toHaveCount(0)
  } else {
    await expect(page.getByRole('button', { name: 'Collapse lesson navigation' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open curriculum' })).toHaveCount(0)
  }
  await verifyViewport(page)
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('region', { name: 'Python output' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run code' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}`)
  await openStageOneExpressionLesson(page)
  await expect(page.getByText('Watch the expression reduce')).toBeVisible()
  await expect(page.getByRole('list', { name: 'Expression evaluation steps' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your output prediction' })).toBeVisible()
  await verifyViewport(page)
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-1-expression`)
  await openStageTwoTraceTableLesson(page)
  await expect(page.getByRole('table', { name: 'Your state trace table' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'coins after line 1' })).toBeVisible()
  await verifyViewport(page)
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-2-trace-table`)
})

test('branch trace stays clear and usable at iPad landscape and portrait sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'The responsive branch-trace review uses WebKit iPad projects.')
  await openLesson(page, 'stage-3-lesson-3', 'trace-the-true-path')
  await expect(page.getByRole('heading', { name: 'One-way decision' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 20_000 })
  const expectedPath = page.getByRole('radio', { name: 'The indented message runs' })
  await expectedPath.check()
  await expect(expectedPath).toBeChecked()
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('python-steps:progress') ?? '{}') as {
      activityProgress?: Record<string, { response?: unknown }>
    }
    return saved.activityProgress?.['trace-hot-one-way-decision']?.response
  })).toBe('message-runs')
  await expect(page.getByRole('button', { name: 'Run and compare' })).toBeEnabled({ timeout: 60_000 })
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('Correct — Python took the “The indented message runs” path', { timeout: 20_000 })

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('It is hot')
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-3-branch-trace`)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  await expect(page.getByRole('heading', { name: 'One-way decision' })).toBeVisible()
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-3-branch-trace`)
})

test('repeated loop-state table remains usable at iPad landscape and portrait sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'The responsive loop-state review uses WebKit iPad projects.')
  await openLesson(page, 'stage-4-lesson-5', 'fill-the-total-table')
  await expect(page.getByRole('heading', { name: 'State can survive between iterations' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 20_000 })

  const answers = [
    ['total after turn 1', '2'],
    ['total after turn 2', '4'],
    ['total after turn 3', '6'],
    ['total after turn 4', '8'],
  ] as const
  for (const [label, value] of answers) {
    const cell = page.getByRole('textbox', { name: label })
    await cell.fill(value)
    await expect(cell).toHaveValue(value)
  }
  await expect(page.getByRole('button', { name: 'Run and compare' })).toBeEnabled({ timeout: 60_000 })
  await page.getByRole('button', { name: 'Run and compare' }).click()
  await expect(page.getByRole('status')).toContainText('matches the values Python had at every checkpoint', { timeout: 20_000 })

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-4-loop-state`)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  await expect(page.getByRole('table', { name: 'Your state trace table' })).toBeVisible()
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-4-loop-state`)
})

test('collection code and output stay usable at iPad landscape and portrait sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Responsive collection coverage uses WebKit iPad projects.')
  await openLesson(page, 'stage-5-lesson-9', 'select-high-scores')
  await expect(page.getByRole('heading', { name: 'Build: analyse some scores' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 20_000 })
  await runAndExpectPass(page, 'scores = [8, 3, 10, 6, 9]\nfor score in scores:\n    if score >= 7:\n        print(score)')

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  if (initialOrientation === 'portrait') await expectPortraitNavigationGap(page)
  const output = page.getByRole('region', { name: 'Python output' })
  await output.scrollIntoViewIfNeeded()
  await expect(output).toContainText('8')
  await expect(output).toContainText('10')
  await expect(output).toContainText('9')
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-5-score-filter`)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  if (rotatedOrientation === 'portrait') await expectPortraitNavigationGap(page)
  await expect(page.getByRole('heading', { name: 'Build: analyse some scores' })).toBeVisible()
  await output.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-5-score-filter`)
})

test('function return lesson stays usable at iPad landscape and portrait sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Responsive function coverage uses WebKit iPad projects.')
  test.setTimeout(120_000)
  await openLesson(page, 'stage-6-lesson-6', 'use-the-returned-value')
  await expect(page.getByRole('heading', { name: 'return is not print' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 60_000 })
  await runAndExpectPass(page, 'def double(number):\n    return number * 2\n\nprint(double(6) + 1)\nprint(double(9) + 1)')

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  const output = page.getByRole('region', { name: 'Python output' })
  await output.scrollIntoViewIfNeeded()
  await expect(output).toContainText('13')
  await expect(output).toContainText('19')
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-6-return-value`)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  await expect(page.getByRole('heading', { name: 'return is not print' })).toBeVisible()
  await output.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-6-return-value`)
})

test('validation retry remains usable at iPad landscape and portrait sizes @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Responsive input-loop coverage uses WebKit iPad projects.')
  test.setTimeout(120_000)
  await openLesson(page, 'stage-7-lesson-8', 'ask-again-when-age-is-negative')
  await expect(page.getByRole('heading', { name: 'Validate / repeat until acceptable' })).toBeVisible()
  await expect(page.getByTestId('sticky-action-bar')).toHaveAttribute('data-runtime-status', 'ready', { timeout: 60_000 })
  await setEditorCode(page, 'age = int(input("Age: "))\nwhile age < 0:\n    age = int(input("Try again: "))\nprint(age)')
  await runStarterWithAnswers(page, ['-1', '12'])

  const initialOrientation = testInfo.project.name.includes('landscape') ? 'landscape' : 'portrait'
  const initialWidth = initialOrientation === 'landscape' ? 1194 : 834
  expect(await page.evaluate(() => window.innerWidth)).toBe(initialWidth)
  await verifyViewport(page)
  const output = page.getByRole('region', { name: 'Python output' })
  await output.scrollIntoViewIfNeeded()
  await expect(output).toContainText('12')
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${initialOrientation}-stage-7-validation`)

  const rotatedOrientation = initialOrientation === 'landscape' ? 'portrait' : 'landscape'
  const rotatedViewport = rotatedOrientation === 'portrait'
    ? { width: 834, height: 1194 }
    : { width: 1194, height: 834 }
  await page.setViewportSize(rotatedViewport)
  expect(await page.evaluate(() => window.innerWidth)).toBe(rotatedViewport.width)
  await verifyViewport(page)
  await expect(page.getByRole('heading', { name: 'Validate / repeat until acceptable' })).toBeVisible()
  await output.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('sticky-action-bar')).toBeVisible()
  await capture(page, testInfo, `ipad-${rotatedOrientation}-stage-7-validation`)
})

async function verifyViewport(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport + 1)
}

async function expectPortraitNavigationGap(page: Page) {
  const navigation = page.getByRole('button', { name: 'Open curriculum' })
  const lessonStep = page.getByText('Lesson 9 · Step 2')
  const [navigationBox, lessonBox] = await Promise.all([
    navigation.boundingBox(),
    lessonStep.boundingBox(),
  ])
  expect(navigationBox).not.toBeNull()
  expect(lessonBox).not.toBeNull()
  expect(lessonBox!.y - (navigationBox!.y + navigationBox!.height)).toBeLessThan(64)
}
