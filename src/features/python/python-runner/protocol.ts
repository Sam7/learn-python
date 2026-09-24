import type { PythonInputMode, PythonInputTranscriptEntry, PythonTraceFrame, PythonWorkspace } from './types'
import type { VirtualFileMap } from '../../../lib/virtual-files'

export type WorkerInput = {
  mode: PythonInputMode
  lines: string[]
  channel?: SharedArrayBuffer
}

type WorkerRunOptions = { type: 'run'; requestId: number; input: WorkerInput; trace: boolean }

export type WorkerRequest =
  | (WorkerRunOptions & ({ mode: 'code'; code: string } | { mode: 'workspace'; workspace: PythonWorkspace }))
  | { type: 'reset'; requestId: number }

export type WorkerResponse =
  | { type: 'runtime-ready' }
  | { type: 'runtime-error'; error: string }
  | { type: 'input-request'; requestId: number; inputIndex: number; prompt: string }
  | {
      type: 'run-result'
      requestId: number
      status: 'success' | 'error' | 'cancelled'
      stdout: string
      stderr: string
      inputTranscript: PythonInputTranscriptEntry[]
      traceFrames?: PythonTraceFrame[]
      workspaceFiles?: VirtualFileMap
      workspaceWarning?: string
      error?: string
      durationMs: number
    }
  | { type: 'reset-complete'; requestId: number }
