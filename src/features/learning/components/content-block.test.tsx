import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContentBlockView } from './content-block'

describe('expression evaluation content', () => {
  it('shows each reduction as a distinct, accessible step', () => {
    render(<ContentBlockView block={{
      type: 'evaluation',
      expression: '2 + 3 * 4',
      steps: ['2 + 12', '14'],
      caption: 'Watch the expression reduce',
    }} />)

    expect(screen.getByRole('list', { name: 'Expression evaluation steps' })).toBeInTheDocument()
    expect(screen.getByText('Watch the expression reduce')).toBeInTheDocument()
    expect(screen.getByText('2 + 3 * 4')).toBeInTheDocument()
    expect(screen.getByText('2 + 12')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })
})
