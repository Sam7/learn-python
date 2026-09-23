import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExecutionOutput } from './execution-output'

describe('execution output', () => {
  it('presents an expected timeout as a successful learning observation', () => {
    render(
      <ExecutionOutput
        execution={{
          status: 'timeout',
          stdout: '',
          stderr: '',
          inputTranscript: [],
          error: 'Your program took too long to finish. It may contain an endless loop.',
          durationMs: 5_000,
        }}
        isRunning={false}
        feedback={{ passed: true, message: 'Good observation — Python stopped this run at the time limit.' }}
        expectedTimeout
      />,
    )

    expect(screen.getByText('Python stopped this program at the time limit, as expected.')).toBeVisible()
    expect(screen.getByText('Your program took too long to finish. It may contain an endless loop.')).toBeVisible()
    expect(screen.getByLabelText('Expected Python result observed')).toBeInTheDocument()
    expect(screen.queryByLabelText('Run failed')).not.toBeInTheDocument()
  })
})
