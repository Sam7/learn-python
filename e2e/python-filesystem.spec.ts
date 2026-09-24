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

test('a submitted workspace snapshot survives a runtime reset without leaking warm-worker files', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The Pyodide workspace contract runs in Chromium.')
  await page.goto('/')

  const runs = await page.evaluate(async () => {
    const { BrowserPythonRunner } = await import('/src/features/python/python-runner/browser-python-runner.ts')
    const runner = new BrowserPythonRunner()
    await runner.prepare()
    try {
      const first = await runner.run({
        code: `from pathlib import Path
Path("scores.py").write_text("""def load_score():
    with open("score.txt") as data:
        return data.read()
""")
Path("score.txt").write_text("100")
print("saved")`,
        workspace: { entryFile: 'main.py', files: { 'main.py': '' } },
      })
      await runner.reset()
      const second = await runner.run({
        code: 'import scores\nprint(scores.load_score())',
        workspace: { entryFile: 'main.py', files: first.workspaceFiles ?? {} },
      })
      const isolated = await runner.run({
        code: 'from pathlib import Path\nprint(Path("score.txt").exists())',
        workspace: { entryFile: 'main.py', files: { 'main.py': '' } },
      })
      return { first, second, isolated }
    } finally {
      runner.dispose()
    }
  })

  expect(runs.first.status, runs.first.error).toBe('success')
  expect(runs.first.workspaceFiles).toMatchObject({ 'main.py': expect.any(String), 'score.txt': '100', 'scores.py': expect.any(String) })
  expect(runs.second.status, runs.second.error).toBe('success')
  expect(runs.second.stdout).toContain('100')
  expect(runs.second.workspaceFiles).toMatchObject({
    'main.py': 'import scores\nprint(scores.load_score())',
    'score.txt': '100',
    'scores.py': runs.first.workspaceFiles?.['scores.py'],
  })
  expect(runs.isolated.status, runs.isolated.error).toBe('success')
  expect(runs.isolated.stdout).toContain('False')
})
