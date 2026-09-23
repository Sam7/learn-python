export type PythonRunStatus = 'success' | 'error' | 'timeout' | 'cancelled'

export type PythonInputMode = 'interactive' | 'transcript'

export interface PythonInputRequest {
  inputIndex: number
  prompt: string
}

export interface PythonInputTranscriptEntry extends PythonInputRequest {
  answer: string
}

export interface PythonRunRequest {
  code: string
  input?: {
    mode: PythonInputMode
    lines?: string[]
  }
  timeoutMs?: number
}

export interface PythonRunResult {
  status: PythonRunStatus
  stdout: string
  stderr: string
  inputTranscript: PythonInputTranscriptEntry[]
  error?: string
  durationMs: number
}

export interface PythonRunHandlers {
  onInputRequest?: (request: PythonInputRequest) => Promise<string>
  onInputCancel?: (message: string) => void
}

export interface PythonRunner {
  prepare(): Promise<void>
  run(request: PythonRunRequest, handlers?: PythonRunHandlers): Promise<PythonRunResult>
  cancel(): void
  reset(): Promise<void>
  dispose(): void
}
