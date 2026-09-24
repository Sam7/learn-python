import { expect, test } from '@playwright/test'

test('Pyodide keeps files and imports learner modules across worker runs', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The Pyodide filesystem spike runs in Chromium.')
  await page.goto('/')

  const runs = await page.evaluate(async () => {
    const { BrowserPythonRunner } = await import('/src/features/python/python-runner/browser-python-runner.ts')
    const runner = new BrowserPythonRunner()
    await runner.prepare()
    try {
      const write = await runner.run({
        code: `from pathlib import Path
Path("scores.py").write_text("""def load_score():
    with open("score.txt") as data:
        return data.read()
""")
Path("score.txt").write_text("100")
print("saved")`,
      })
      const read = await runner.run({
        code: 'import scores\nprint(scores.load_score())',
      })
      await runner.reset()
      const afterReset = await runner.run({ code: 'import scores' })
      return { write, read, afterReset }
    } finally {
      runner.dispose()
    }
  })

  expect(runs.write.status, runs.write.error).toBe('success')
  expect(runs.write.stdout).toContain('saved')
  expect(runs.read.status, runs.read.error).toBe('success')
  expect(runs.read.stdout).toContain('100')
  expect(runs.afterReset.status).toBe('error')
  expect(runs.afterReset.error).toContain("No module named 'scores'")
})
