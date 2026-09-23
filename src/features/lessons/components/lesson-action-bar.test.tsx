import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LessonActionBar } from './lesson-action-bar'

const commonProps = {
  stepIndex: 0,
  totalSteps: 2,
  completedActivities: 0,
  requiredActivities: 2,
  canGoPrevious: false,
  canGoNext: false,
  nextLabel: 'Next step',
  isBusy: false,
  isLessonComplete: false,
  runtimeStatus: 'ready' as const,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
}

describe('sticky lesson navigation', () => {
  it('shows task completion, not viewed-step position, in the progress meter', () => {
    const { rerender } = render(<LessonActionBar {...commonProps} />)
    const progress = screen.getByRole('progressbar', { name: 'Required task progress' })
    expect(progress).toHaveAttribute('aria-valuemax', '2')
    expect(progress).toHaveAttribute('aria-valuenow', '0')

    rerender(<LessonActionBar {...commonProps} stepIndex={1} completedActivities={1} />)
    expect(progress).toHaveAttribute('aria-valuenow', '1')
  })

  it('does not present an inert next action when the available course is complete', () => {
    render(<LessonActionBar {...commonProps} nextLabel="Course complete" isLessonComplete canGoNext={false} />)
    expect(screen.getByRole('button', { name: /Course complete/ })).toBeDisabled()
  })

  it('explains when Python could not start', () => {
    render(<LessonActionBar {...commonProps} runtimeStatus="error" runtimeError="Network request failed" />)

    expect(screen.getByText('Python could not start')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh the page and try again.')
    expect(screen.getByRole('alert')).toHaveTextContent('Network request failed')
  })
})
