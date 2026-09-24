import { expect, test } from '@playwright/test'

test('required editable Python activities do not pass on their untouched starters', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The curriculum-wide Python audit runs once in Chromium.')
  test.setTimeout(300_000)

  // Keep the audit page free of the learner app's own runtime instance. The
  // curriculum, validator, and worker modules are still served/transformed by Vite.
  await page.route((url) => url.pathname === '/', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
    body: '<!doctype html><html><head><meta charset="utf-8"><title>Curriculum audit</title></head><body></body></html>',
  }))
  await page.goto('/')

  const report = await page.evaluate(async () => {
    const [{ curriculum }, { BrowserPythonRunner }, { assessActivity }] = await Promise.all([
      import('/src/curriculum/curriculum.ts'),
      import('/src/features/python/python-runner/browser-python-runner.ts'),
      import('/src/features/lessons/validators/activity-validator.ts'),
    ])
    const runner = new BrowserPythonRunner()
    const passingStarters: string[] = []
    const assessmentFailures: string[] = []
    const observations: string[] = []
    let assessedCount = 0

    try {
      await runner.prepare()
      for (const stage of curriculum.stages) {
        for (const lesson of stage.lessons) {
          if (lesson.status !== 'ready') continue
          for (const step of lesson.steps) {
            const activity = step.activity
            if (!activity?.required || !['code', 'file-workspace'].includes(activity.kind)) continue
            assessedCount += 1

            const label = `${stage.id} (${stage.title}) / ${lesson.id} (${lesson.title}) / ${activity.id} (${activity.title})`
            const code = activity.kind === 'code'
              ? activity.starterCode
              : activity.starterFiles[activity.entryFile] ?? ''
            const workspaceFiles = activity.kind === 'file-workspace' ? activity.starterFiles : undefined
            const sampleInputs = activity.sampleInputs
              ?? (activity.assessment.kind === 'behavior' ? activity.assessment.cases[0]?.inputs : undefined)
              ?? []
            const isObservation = activity.assessment.kind === 'runtime-error' || activity.assessment.kind === 'timeout'

            try {
              const execution = await runner.run({
                code,
                input: { mode: 'transcript', lines: sampleInputs },
                ...(activity.kind === 'file-workspace' && workspaceFiles
                  ? { workspace: { entryFile: activity.entryFile, files: { ...workspaceFiles, [activity.entryFile]: code } } }
                  : {}),
              })
              const result = await assessActivity(activity, {
                code,
                workspaceFiles,
                execution,
                runPython: (request) => runner.run(request),
              })

              if (isObservation) {
                observations.push(activity.id)
                if (!result.passed) assessmentFailures.push(`${label}: intentional observation no longer passes unchanged (${result.message})`)
              } else if (result.passed) {
                passingStarters.push(`${label}: untouched starter passed (${result.message})`)
              }
            } catch (error) {
              assessmentFailures.push(`${label}: assessment threw ${error instanceof Error ? error.message : String(error)}`)
            }
          }
        }
      }
    } finally {
      runner.dispose()
    }

    return { assessedCount, passingStarters, assessmentFailures, observations }
  })

  expect(report.assessmentFailures, report.assessmentFailures.join('\n')).toEqual([])
  expect(report.passingStarters, report.passingStarters.join('\n')).toEqual([])
  expect(report.assessedCount).toBeGreaterThan(0)
  expect(report.observations.sort()).toEqual([
    'notice-the-list-index-error',
    'observe-input-text-type-error',
    'observe-local-name-error',
    'observe-mixed-value-type-error',
    'observe-value-error',
    'run-the-non-stopping-loop',
  ])
})
