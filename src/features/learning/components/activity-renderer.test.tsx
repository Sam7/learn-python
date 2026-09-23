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

  it('renders conditional paths and labels lines that ran or were skipped', () => {
    const activity: LearningActivity = {
      id: 'trace-weather-branch',
      kind: 'branch-trace',
      title: 'Predict the path',
      prompt: 'Which message will Python show?',
      required: true,
      code: 'temperature = 35\nif temperature > 30:\n    print("Hot")\nelse:\n    print("Cool")',
      paths: [
        { id: 'hot', label: 'Hot path', lines: [3] },
        { id: 'cool', label: 'Cool path', lines: [5] },
      ],
    }

    render(
      <ActivityRenderer
        activity={activity}
        response="hot"
        onResponseChange={vi.fn()}
        onAssessResponse={vi.fn()}
        code=""
        onCodeChange={vi.fn()}
        onResetCode={vi.fn()}
        onRun={vi.fn()}
        isRunning={false}
        runtimeReady
        execution={{
          status: 'success',
          stdout: 'Hot\n',
          stderr: '',
          inputTranscript: [],
          traceFrames: [
            { line: 1, event: 'line', locals: {} },
            { line: 2, event: 'line', locals: { temperature: 35 } },
            { line: 3, event: 'line', locals: { temperature: 35 } },
          ],
          durationMs: 2,
        }}
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

    expect(screen.getByRole('radio', { name: 'Hot path' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Run and compare' })).toBeEnabled()
    expect(screen.getByLabelText('Line 3 executed')).toBeInTheDocument()
    expect(screen.getByLabelText('Line 5 skipped')).toBeInTheDocument()
  })

  it('shows feedback for a deterministic choice instead of silently unlocking the next step', () => {
    const activity: LearningActivity = {
      id: 'choose-the-right-result',
      kind: 'choice',
      title: 'Choose the result',
      prompt: 'What happens?',
      required: true,
      options: [{ id: 'right', text: 'The loop stops.' }],
      correctOptionId: 'right',
    }

    render(
      <ActivityRenderer
        activity={activity}
        response="right"
        onResponseChange={vi.fn()}
        onAssessResponse={vi.fn()}
        code=""
        onCodeChange={vi.fn()}
        onResetCode={vi.fn()}
        onRun={vi.fn()}
        isRunning={false}
        runtimeReady
        execution={null}
        feedback={{ passed: true, message: 'Correct — the loop condition becomes False.' }}
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

    expect(screen.getByRole('status')).toHaveTextContent('Correct — the loop condition becomes False.')
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
