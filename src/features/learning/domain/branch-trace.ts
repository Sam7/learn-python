import type { BranchTracePath } from '../../../curriculum/types'
import type { PythonRunResult } from '../../python/python-runner/types'

export type BranchResolution =
  | { kind: 'resolved'; path: BranchTracePath }
  | { kind: 'unresolved' }

export type BranchLineStatus = 'executed' | 'skipped'

export function resolveBranchPath(
  paths: BranchTracePath[],
  execution: PythonRunResult,
): BranchResolution {
  if (execution.status !== 'success' || !execution.traceFrames?.length) return { kind: 'unresolved' }

  const executedLines = new Set(
    execution.traceFrames
      .filter((frame) => frame.event === 'line')
      .map((frame) => frame.line),
  )
  const activePaths = paths.filter((path) => path.lines.some((line) => executedLines.has(line)))
  if (activePaths.length === 1) return { kind: 'resolved', path: activePaths[0] }
  if (activePaths.length > 1) return { kind: 'unresolved' }

  const fallbackPaths = paths.filter((path) => path.otherwise)
  return fallbackPaths.length === 1
    ? { kind: 'resolved', path: fallbackPaths[0] }
    : { kind: 'unresolved' }
}

export function getBranchLineStatuses(
  paths: BranchTracePath[],
  execution: PythonRunResult | null,
): Map<number, BranchLineStatus> {
  if (execution?.status !== 'success' || !execution.traceFrames?.length) return new Map()

  const executedLines = new Set(
    execution.traceFrames
      .filter((frame) => frame.event === 'line')
      .map((frame) => frame.line),
  )
  return new Map(paths.flatMap((path) =>
    path.lines.map((line) => [line, executedLines.has(line) ? 'executed' : 'skipped'] as const),
  ))
}
