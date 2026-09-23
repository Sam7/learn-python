import type { PythonInputMode, PythonInputTranscriptEntry } from './types'

export type WorkerInput = {
  mode: PythonInputMode
  lines: string[]
  channel?: SharedArrayBuffer
}

export type WorkerRequest =
  | { type: 'run'; requestId: number; code: string; input: WorkerInput }
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
      error?: string
      durationMs: number
    }
  | { type: 'reset-complete'; requestId: number }
