import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserPythonRunner } from './browser-python-runner'
import type { PythonRunRequest, PythonRunResult } from './types'

export type PythonRuntimeStatus = 'loading' | 'ready' | 'error'

export function usePythonRunner() {
  const runnerRef = useRef<BrowserPythonRunner | null>(null)
  const [runtimeStatus, setRuntimeStatus] = useState<PythonRuntimeStatus>('loading')
  const [runtimeError, setRuntimeError] = useState<string | undefined>()

  useEffect(() => {
    const runner = new BrowserPythonRunner()
    runnerRef.current = runner
    void runner.prepare().then(
      () => setRuntimeStatus('ready'),
      (error: unknown) => {
        setRuntimeStatus('error')
        setRuntimeError(error instanceof Error ? error.message : String(error))
      },
    )
    return () => runner.dispose()
  }, [])

  const run = useCallback(async (request: PythonRunRequest): Promise<PythonRunResult> => {
    if (!runnerRef.current) {
      return { status: 'error', stdout: '', stderr: '', error: 'Python is still preparing.', durationMs: 0 }
    }
    return runnerRef.current.run(request)
  }, [])

  return { run, runtimeStatus, runtimeError }
}
