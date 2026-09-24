import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function verifyRunButtonPlacement(page: Page) {
  const runButton = page.getByRole('button', { name: 'Run code' })
  const resetButton = page.getByRole('button', { name: 'Reset code' })
  const editor = page.getByTestId('code-editor')
  await expect(runButton).toBeEnabled({ timeout: 60_000 })
  await expect(runButton).toBeVisible()
  await expect(runButton.locator('svg')).toBeVisible()
  await expect(runButton).toHaveClass(/bg-teal/)
  await expect(page.getByText('Running checks your answer.', { exact: true })).toHaveCount(0)

  const activity = page.locator('section[aria-label]').filter({ has: editor }).first()
  const [runBox, resetBox, editorBox, activityBox] = await Promise.all([
    runButton.boundingBox(),
    resetButton.boundingBox(),
    editor.boundingBox(),
    activity.boundingBox(),
  ])
  expect(runBox).not.toBeNull()
  expect(resetBox).not.toBeNull()
  expect(editorBox).not.toBeNull()
  expect(activityBox).not.toBeNull()
  expect(runBox!.x).toBeGreaterThan(resetBox!.x)
  expect(runBox!.y + runBox!.height).toBeLessThanOrEqual(editorBox!.y)
  expect(activityBox!.x + activityBox!.width - runBox!.x - runBox!.width).toBeLessThan(28)
}

async function capture(page: Page, testInfo: TestInfo, label: string) {
  await page.getByTestId('code-editor').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-${label}.png`, fullPage: false })
}

test('Run code is the right-aligned primary action in the code activity header', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Desktop placement is verified in Chromium.')
  await page.goto('/')
  await verifyRunButtonPlacement(page)
  await capture(page, testInfo, 'run-code-header-desktop')
})

test('Run code stays aligned and reachable on iPad @tablet', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'webkit', 'Tablet placement is verified in WebKit iPad projects.')
  test.setTimeout(120_000)
  await page.goto('/')
  await verifyRunButtonPlacement(page)
  await capture(page, testInfo, 'run-code-header-ipad')
})
