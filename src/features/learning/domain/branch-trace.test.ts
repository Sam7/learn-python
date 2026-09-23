import { describe, expect, it } from 'vitest'
import type { BranchTracePath } from '../../../curriculum/types'
import type { PythonRunResult } from '../../python/python-runner/types'
import { getBranchLineStatuses, resolveBranchPath } from './branch-trace'

const paths: BranchTracePath[] = [
  { id: 'warm', label: 'It is warm', lines: [3] },
  { id: 'cool', label: 'It is cool', lines: [], otherwise: true },
]

function execution(lines: number[]): PythonRunResult {
  return {
    status: 'success',
    stdout: '',
    stderr: '',
    inputTranscript: [],
    traceFrames: lines.map((line) => ({ line, event: 'line', locals: {} })),
    durationMs: 1,
  }
}

describe('branch trace domain', () => {
  it('resolves the exclusive path from Python line events including a skipped one-way branch', () => {
    expect(resolveBranchPath(paths, execution([1, 2, 3]))).toEqual({ kind: 'resolved', path: paths[0] })
    expect(resolveBranchPath(paths, execution([1, 2, 4]))).toEqual({ kind: 'resolved', path: paths[1] })
  })

  it('marks branch body lines as ran or skipped using real line events', () => {
    const alternatives = [
      { id: 'teen', label: 'Teen', lines: [3] },
      { id: 'child', label: 'Child', lines: [5] },
    ]
    expect([...getBranchLineStatuses(alternatives, execution([1, 2, 3, 6]))]).toEqual([
      [3, 'executed'],
      [5, 'skipped'],
    ])
  })

  it('does not guess when the trace activates multiple paths or execution failed', () => {
    expect(resolveBranchPath([
      { id: 'first', label: 'First', lines: [3] },
      { id: 'second', label: 'Second', lines: [4] },
    ], execution([3, 4]))).toEqual({ kind: 'unresolved' })
    expect(resolveBranchPath(paths, { ...execution([]), status: 'error' })).toEqual({ kind: 'unresolved' })
    expect(resolveBranchPath(paths, execution([]))).toEqual({ kind: 'unresolved' })
  })
})
