import { expect, test } from '@playwright/test'

async function waitForPython(page: import('@playwright/test').Page) {
  await expect(page.getByRole('button', { name: /Run code/ })).toBeEnabled({ timeout: 30_000 })
}

async function setEditorCode(page: import('@playwright/test').Page, code: string) {
  const editor = page.locator('.cm-content')
  await editor.click()
  await editor.focus()
  const selectAllShortcut = await page.evaluate(() => /Mac|iPad/.test(navigator.platform) ? 'Meta+A' : 'Control+A')
  await page.keyboard.press(selectAllShortcut)
  await page.keyboard.press('Backspace')
  const lines = code.split('\n')
  for (const [index, line] of lines.entries()) {
    await page.keyboard.insertText(line)
    if (index < lines.length - 1) await page.keyboard.press('Enter')
  }
  for (const line of code.split('\n')) {
    await expect(editor).toContainText(line)
  }
}

async function answerLivePrompt(page: import('@playwright/test').Page, value: string, answerNumber = 1) {
  const answer = page.getByRole('textbox', { name: `Answer ${answerNumber}` })
  await expect(answer).toBeVisible()
  await answer.fill(value)
  await page.getByRole('button', { name: /Send answer/ }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.location.search.includes('transcript-fallback')) {
      Object.defineProperty(window, 'crossOriginIsolated', { configurable: true, value: false })
    }
  })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('desktop learner journey runs Python, checks an answer, and opens the next lesson', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await expect(page.getByRole('heading', { name: 'Hello Python' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('print')
  await waitForPython(page)

  await setEditorCode(page, 'print("Hello Python!")')
  await page.getByRole('button', { name: /Run code/ }).click()
  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText('Hello Python!', { timeout: 20_000 })
  await page.getByRole('button', { name: /Check answer/ }).click()
  await expect(page.getByRole('status')).toContainText('Great work')
  await expect(page.getByText('Lesson complete')).toBeVisible()

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-first-lesson.png`, fullPage: true })
  await page.getByRole('button', { name: /Next lesson/ }).click()
  await expect(page.getByRole('heading', { name: 'Printing your own text' })).toBeVisible()
})

test('refresh restores the active lesson and edited code', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)
  await setEditorCode(page, 'print("Hello Python!")')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('Hello Python!', { timeout: 20_000 })
  await page.getByRole('button', { name: /Check answer/ }).click()
  await page.getByRole('button', { name: /Next lesson/ }).click()
  await expect(page.getByRole('heading', { name: 'Printing your own text' })).toBeVisible()
  await setEditorCode(page, 'print("Sam")\nprint("books")')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Printing your own text' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('books')
})

test('the available learning path reaches the next chapter', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)

  const lessonsToComplete = [
    { code: 'print("Hello Python!")', next: 'Printing your own text', button: 'Next lesson' },
    { code: 'print("Sam")\nprint("noodles")', next: 'Numbers and maths', button: 'Next lesson' },
    { code: 'print(12 + 8)', next: 'Remembering things', button: 'Next lesson' },
    { code: 'favourite_food = "mango"\nprint(favourite_food)', next: 'Putting values into sentences', button: 'Next lesson' },
    { code: 'favourite_food = "mango"\nprint("My favourite food is", favourite_food)', next: 'Asking a question', button: 'Next chapter' },
    { code: 'name = input("What is your name? ")\nprint("Hello", name)', input: 'Sam', next: undefined, button: undefined },
  ]

  for (const lesson of lessonsToComplete) {
    await setEditorCode(page, lesson.code)
    await page.getByRole('button', { name: /Run code/ }).click()
    if (lesson.input) await answerLivePrompt(page, lesson.input)
    const lessonOutput = page.getByRole('region', { name: 'Python output' })
    await expect(lessonOutput).toContainText(/.+/, { timeout: 20_000 })
    await page.getByRole('button', { name: /Check answer/ }).click()
    await expect(page.getByRole('status')).toContainText('Great work')
    if (lesson.next) {
      await page.getByRole('button', { name: new RegExp(lesson.button ?? 'Next lesson') }).click()
      await expect(page.getByRole('heading', { name: lesson.next })).toBeVisible()
      if (lesson.button === 'Next chapter') {
        await expect(page.locator('.cm-content')).toContainText('input')
        await expect(page.locator('.cm-content')).not.toContainText('favourite_food')
        await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-next-chapter.png`, fullPage: true })
      }
    }
  }

  await expect(page.getByText('Chapter complete')).toBeVisible()
})

test('interactive input supports multiple prompts and line reads', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Interactive stdin is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)
  await setEditorCode(page, 'first = input("First? ")\nsecond = input("Second? ")\nprint(first)\nprint(second)')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python is waiting for input' })).toBeVisible()
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-input-prompt.png`, fullPage: false })
  await answerLivePrompt(page, 'Ada')
  await answerLivePrompt(page, 'Python', 2)
  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText('First? Ada')
  await expect(output).toContainText('Second? Python')
  await expect(output).toContainText('Ada')
  await expect(output).toContainText('Python')

  await setEditorCode(page, 'import sys\nfirst = sys.stdin.readline().strip()\nsecond = sys.stdin.readline().strip()\nprint(first, second)')
  await page.getByRole('button', { name: /Run code/ }).click()
  await answerLivePrompt(page, 'one')
  await answerLivePrompt(page, 'two', 2)
  await expect(output).toContainText('one two')
})

test('an interactive run can be cancelled while waiting for input', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Interactive cancellation is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)
  await setEditorCode(page, 'name = input("Your name? ")\nprint(name)')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python is waiting for input' })).toBeVisible()
  await page.getByRole('button', { name: /Cancel/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('cancelled')
  await expect(page.getByRole('button', { name: /Run code/ })).toBeEnabled()

  await setEditorCode(page, 'print("recovered")')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('recovered', { timeout: 15_000 })
})

test('transcript input fallback supports multiple answers', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Fallback stdin is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await page.goto('/?transcript-fallback')
  await waitForPython(page)
  await expect(page.getByRole('textbox', { name: 'Program input' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Program input' }).fill('one\ntwo')
  await setEditorCode(page, 'import sys\nfirst = sys.stdin.readline().strip()\nsecond = sys.stdin.readline().strip()\nprint(first, second)')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('one two', { timeout: 20_000 })
})

test('transcript input explains when Python needs another answer', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Fallback EOF is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await page.goto('/?transcript-fallback')
  await waitForPython(page)
  await page.getByRole('textbox', { name: 'Program input' }).fill('only one')
  await setEditorCode(page, 'first = input("First? ")\nsecond = input("Second? ")\nprint(first, second)')
  await page.getByRole('button', { name: /Run code/ }).click()
  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText('Python asked for another answer', { timeout: 20_000 })
  await expect(output).toContainText('EOF when reading a line')
})

test('selected code keeps a readable light foreground', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Selection styling is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-code-selection.png`, fullPage: false })

  const selectionStyles = await page.evaluate(() => {
    const editorElement = document.querySelector('.cm-content')
    if (!editorElement) return null
    const style = getComputedStyle(editorElement, '::selection')
    return { color: style.color, backgroundColor: style.backgroundColor }
  })

  expect(selectionStyles).toEqual({ color: 'rgb(232, 243, 239)', backgroundColor: 'rgb(40, 127, 120)' })
})

test('invalid Python gives a useful error and does not complete the lesson', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)
  await setEditorCode(page, 'print("Hello Python!"')
  await page.getByRole('button', { name: /Run code/ }).click()
  const output = page.getByRole('region', { name: 'Python output' })
  await expect(output).toContainText("couldn’t run this yet", { timeout: 20_000 })
  await page.getByRole('button', { name: /Check answer/ }).click()
  await expect(page.getByRole('status')).toContainText('Run your code successfully')
  await expect(page.getByRole('button', { name: /Next lesson/ })).toHaveCount(0)
})

test('an endless loop times out and the run control recovers', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  test.setTimeout(25_000)
  await waitForPython(page)
  await setEditorCode(page, 'while True:\n    pass')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('endless loop', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: /Run code/ })).toBeEnabled()
  await setEditorCode(page, 'print("recovered")')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('recovered', { timeout: 15_000 })
})

test('tablet layout stays reachable without horizontal page overflow', async ({ page }, testInfo) => {
  await waitForPython(page)
  await expect(page.getByRole('heading', { name: 'Hello Python' })).toBeVisible()
  const editor = page.locator('.cm-content')
  await expect(editor).toBeVisible()
  await editor.click()
  await expect(editor).toBeFocused()
  await expect(page.getByRole('button', { name: /Run code/ })).toBeVisible()
  await page.getByRole('region', { name: 'Python output' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('region', { name: 'Python output' })).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.height).toBeGreaterThan(page.viewportSize()?.height ?? 0)

  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole('button', { name: 'Open curriculum' }).click()
    const navigatorDialog = page.getByRole('dialog', { name: 'Choose a lesson' })
    await expect(navigatorDialog).toBeVisible()
    await expect(navigatorDialog.getByText('Getting Python to do things')).toBeVisible()
    await page.getByRole('button', { name: 'Close curriculum' }).last().click()
    await expect(page.getByRole('dialog', { name: 'Choose a lesson' })).toHaveCount(0)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}.png`, fullPage: true })
})
