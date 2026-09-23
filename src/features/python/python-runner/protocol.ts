import type { PythonInputMode, PythonInputTranscriptEntry, PythonTraceFrame } from './types'

export type WorkerInput = {
  mode: PythonInputMode
  lines: string[]
  channel?: SharedArrayBuffer
}

export type WorkerRequest =
  | { type: 'run'; requestId: number; code: string; input: WorkerInput; trace: boolean }
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
      error?: string
      durationMs: number
    }
  | { type: 'reset-complete'; requestId: number }
