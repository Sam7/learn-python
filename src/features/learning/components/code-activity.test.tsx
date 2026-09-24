import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CodeActivity } from '../../../curriculum/types'
import { CodeActivityView, type InputInteractionProps } from './code-activity'

vi.mock('../../lessons/components/code-editor', () => ({
  CodeEditor: ({ value }: { value: string }) => <div data-testid="code-editor">{value}</div>,
}))

const activity: CodeActivity = {
  id: 'change-the-message',
  kind: 'code',
  title: 'Change the message',
  prompt: 'Change "Hello!" to something else, then run it.',
  required: true,
  starterCode: 'print("Hello!")',
  assessment: { kind: 'output', expectation: { mode: 'non-empty' } },
}

const input: InputInteractionProps = {
  interactive: true,
  transcriptValue: '',
  onTranscriptChange: vi.fn(),
  pendingRequest: null,
  answerValue: '',
  onAnswerChange: vi.fn(),
  onSubmitAnswer: vi.fn(),
  onCancelRun: vi.fn(),
}

function renderCodeActivity({ isRunning = false, runtimeReady = true } = {}) {
  const onRun = vi.fn()
  render(
    <CodeActivityView
      activity={activity}
      code={activity.starterCode}
      onCodeChange={vi.fn()}
      onReset={vi.fn()}
      onRun={onRun}
      isRunning={isRunning}
      runtimeReady={runtimeReady}
      execution={null}
      feedback={null}
      hintsRevealed={0}
      onRevealHint={vi.fn()}
      input={input}
    />,
  )
  return { onRun }
}

describe('code activity controls', () => {
  it('places the teal Run action after Reset in the task header and removes the helper copy', () => {
    renderCodeActivity()
    const region = screen.getByRole('region', { name: activity.title })
    const runButton = within(region).getByRole('button', { name: 'Run code' })
    const resetButton = within(region).getByRole('button', { name: 'Reset code' })
    const editor = within(region).getByTestId('code-editor')

    expect(runButton).toHaveClass('bg-teal')
    expect(runButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(runButton.compareDocumentPosition(resetButton) & Node.DOCUMENT_POSITION_PRECEDING).not.toBe(0)
    expect(runButton.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(within(region).queryByText('Running checks your answer.')).not.toBeInTheDocument()
  })

  it('runs when the header action is activated', () => {
    const { onRun } = renderCodeActivity()
    fireEvent.click(screen.getByRole('button', { name: 'Run code' }))
    expect(onRun).toHaveBeenCalledOnce()
  })

  it('preserves runtime readiness and in-progress disabled states', () => {
    const { unmount } = render(<CodeActivityView
      activity={activity}
      code={activity.starterCode}
      onCodeChange={vi.fn()}
      onReset={vi.fn()}
      onRun={vi.fn()}
      isRunning={false}
      runtimeReady={false}
      execution={null}
      feedback={null}
      hintsRevealed={0}
      onRevealHint={vi.fn()}
      input={input}
    />)
    expect(screen.getByRole('button', { name: 'Run code' })).toBeDisabled()
    unmount()

    renderCodeActivity({ isRunning: true })
    expect(screen.getByRole('button', { name: 'Running…' })).toBeDisabled()
  })
})
