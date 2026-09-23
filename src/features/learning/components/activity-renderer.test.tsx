import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LearningActivity } from '../../../curriculum/types'
import { ActivityRenderer } from './activity-renderer'

describe('activity rendering', () => {
  it('renders a learner-filled trace table with accessible state inputs', () => {
    const activity: LearningActivity = {
      id: 'trace-coins',
      kind: 'trace-table',
      title: 'Trace the values',
      prompt: 'Fill the row for line 1, then compare with Python.',
      required: true,
      code: 'coins = 5\nprint(coins)',
      variables: ['coins'],
      checkpoints: [{ id: 'after-one', line: 1, label: 'after line 1' }],
    }
    const onResponseChange = vi.fn()
    const onRun = vi.fn()

    render(
      <ActivityRenderer
        activity={activity}
        onResponseChange={onResponseChange}
        onAssessResponse={vi.fn()}
        code=""
        onCodeChange={vi.fn()}
        onResetCode={vi.fn()}
        onRun={onRun}
        isRunning={false}
        runtimeReady
        execution={null}
        feedback={null}
        hintsRevealed={0}
        onRevealHint={vi.fn()}
        onCompleteTrace={vi.fn()}
        input={{
          interactive: true,
          transcriptValue: '',
          onTranscriptChange: vi.fn(),
          pendingRequest: null,
          answerValue: '',
          onAnswerChange: vi.fn(),
          onSubmitAnswer: vi.fn(),
          onCancelRun: vi.fn(),
        }}
      />,
    )

    expect(screen.getByRole('table', { name: 'Your state trace table' })).toBeInTheDocument()
    const cell = screen.getByRole('textbox', { name: 'coins after line 1' })
    fireEvent.change(cell, { target: { value: '5' } })
    expect(onResponseChange).toHaveBeenCalledWith({ 'after-one:coins': '5' })
    expect(screen.getByRole('button', { name: 'Run and compare' })).toBeDisabled()
    expect(onRun).not.toHaveBeenCalled()
  })

  it('saves an ungraded reflection without asking for a correctness check', () => {
    const activity: LearningActivity = {
      id: 'explain-what-changed',
      kind: 'reflection',
      title: 'What changed?',
      prompt: 'In your own words, describe what happened to the score.',
      required: false,
    }
    const onResponseChange = vi.fn()

    render(
      <ActivityRenderer
        activity={activity}
        onResponseChange={onResponseChange}
        onAssessResponse={vi.fn()}
        code=""
        onCodeChange={vi.fn()}
        onResetCode={vi.fn()}
        onRun={vi.fn()}
        isRunning={false}
        runtimeReady
        execution={null}
        feedback={null}
        hintsRevealed={0}
        onRevealHint={vi.fn()}
        onCompleteTrace={vi.fn()}
        input={{
          interactive: true,
          transcriptValue: '',
          onTranscriptChange: vi.fn(),
          pendingRequest: null,
          answerValue: '',
          onAnswerChange: vi.fn(),
          onSubmitAnswer: vi.fn(),
          onCancelRun: vi.fn(),
        }}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Your reflection' }), {
      target: { value: 'The second assignment points score at 20.' },
    })

    expect(onResponseChange).toHaveBeenCalledWith('The second assignment points score at 20.')
    expect(screen.getByText('This is for your own thinking. It is not graded.')).toBeVisible()
    expect(screen.queryByRole('button', { name: /check|submit|run/i })).not.toBeInTheDocument()
  })
})
