export type PythonRunStatus = 'success' | 'error' | 'timeout'

export interface PythonRunRequest {
  code: string
  stdin?: string[]
  timeoutMs?: number
}

export interface PythonRunResult {
  status: PythonRunStatus
  stdout: string
  stderr: string
  error?: string
  durationMs: number
}

export interface PythonRunner {
  prepare(): Promise<void>
  run(request: PythonRunRequest): Promise<PythonRunResult>
  reset(): Promise<void>
  dispose(): void
}
