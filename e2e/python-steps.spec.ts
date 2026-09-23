import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function waitForPython(page: Page) {
  await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled({ timeout: 60_000 })
}

async function setEditorCode(page: Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.click()
  const selectAllShortcut = await page.evaluate(() => /Mac|iPad/.test(navigator.platform) ? 'Meta+A' : 'Control+A')
  await page.keyboard.press(selectAllShortcut)
  await page.keyboard.press('Backspace')
  const lines = code.split('\n')
  for (const [index, line] of lines.entries()) {
    await page.keyboard.insertText(line)
    if (index < lines.length - 1) await page.keyboard.press('Enter')
  }
  for (const line of lines) await expect(editor).toContainText(line)
}

async function runAndExpectPass(page: Page, code: string) {
  await waitForPython(page)
  await setEditorCode(page, code)
  await page.getByRole('button', { name: 'Run code' }).click()
  await expect(page.getByRole('status')).toContainText('Great work', { timeout: 20_000 })
}

async function answerLivePrompt(page: Page, value: string, answerNumber: number) {
  const answer = page.getByRole('textbox', { name: `Answer ${answerNumber}` })
  await expect(answer).toBeVisible()
  await answer.fill(value)
  await page.getByRole('button', { name: /Send answer/ }).click()
}

async function capture(page: Page, testInfo: TestInfo, label: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('Stage 0: prediction, output, and saved progress work across a refresh', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'The full Python journey runs in Chromium; WebKit is reserved for tablet layout and focus checks.')
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

test('Stages 0–2: the first three curriculum stages complete as expected', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Curriculum content execution is covered in Chromium.')
  test.setTimeout(240_000)
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
  await expect(page.getByText('10/10 ready')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next stage coming soon' })).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Build: the future machine' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('age = int(age_text)')
  await expect(page.getByRole('button', { name: 'Next stage coming soon' })).toBeDisabled()
})

test('invalid Python and runaway code show useful feedback and recover', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Runtime failure cases execute in Chromium.')
  test.setTimeout(40_000)
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

test('interactive Python input supports multiple answers without echoing them into output', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Python input behaviour executes in Chromium.')
  test.setTimeout(90_000)
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

test('tablet layout remains focusable, scrollable, and free from horizontal overflow', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Tablet coverage uses WebKit.')
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

async function verifyViewport(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport + 1)
}
