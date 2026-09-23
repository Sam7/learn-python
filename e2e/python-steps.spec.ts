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

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('desktop learner journey runs Python, checks an answer, and opens the next lesson', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await expect(page.getByRole('heading', { name: 'Saying something' })).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Your own text' })).toBeVisible()
})

test('refresh restores the active lesson and edited code', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)
  await setEditorCode(page, 'print("Hello Python!")')
  await page.getByRole('button', { name: /Run code/ }).click()
  await expect(page.getByRole('region', { name: 'Python output' })).toContainText('Hello Python!', { timeout: 20_000 })
  await page.getByRole('button', { name: /Check answer/ }).click()
  await page.getByRole('button', { name: /Next lesson/ }).click()
  await expect(page.getByRole('heading', { name: 'Your own text' })).toBeVisible()
  await setEditorCode(page, 'print("Sam")\nprint("books")')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your own text' })).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('books')
})

test('the four lesson definitions form a complete progressive path', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Source editing is covered in Chromium; WebKit is used for tablet layout/focus coverage.')
  await waitForPython(page)

  const lessonsToComplete = [
    { code: 'print("Hello Python!")', next: 'Your own text' },
    { code: 'print("Sam")\nprint("noodles")', next: 'Numbers and simple maths' },
    { code: 'print(12 + 8)', next: 'Variables' },
    { code: 'favourite_food = "mango"\nprint(favourite_food)', next: undefined },
  ]

  for (const lesson of lessonsToComplete) {
    await setEditorCode(page, lesson.code)
    await page.getByRole('button', { name: /Run code/ }).click()
    const lessonOutput = page.getByRole('region', { name: 'Python output' })
    await expect(lessonOutput).toContainText(/.+/, { timeout: 20_000 })
    await page.getByRole('button', { name: /Check answer/ }).click()
    await expect(page.getByRole('status')).toContainText('Great work')
    if (lesson.next) {
      await page.getByRole('button', { name: /Next lesson/ }).click()
      await expect(page.getByRole('heading', { name: lesson.next })).toBeVisible()
    }
  }

  await expect(page.getByText('You finished the first four steps!')).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Saying something' })).toBeVisible()
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
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}.png`, fullPage: true })
})
