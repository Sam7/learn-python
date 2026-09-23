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

test('Stage 0: experiments, error repair, execution tracing, and a three-line creation all complete', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Curriculum content execution is covered in Chromium.')
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

  const output = page.getByRole('region', { name: 'Python output' })
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
  await expect(page.getByRole('button', { name: 'Next stage coming soon' })).toBeDisabled()
  await expect(page.getByRole('progressbar', { name: 'Required task progress' })).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByText('6/6 ready')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'First tiny creation' })).toBeVisible()
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
})

async function verifyViewport(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport + 1)
}
