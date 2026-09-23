import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserPythonRunner } from './browser-python-runner'
import { canUseInteractiveInput } from './input-channel'
import type { PythonRunHandlers, PythonRunRequest, PythonRunResult } from './types'

export type PythonRuntimeStatus = 'loading' | 'ready' | 'error'

export function usePythonRunner() {
  const runnerRef = useRef<BrowserPythonRunner | null>(null)
  const [runtimeStatus, setRuntimeStatus] = useState<PythonRuntimeStatus>('loading')
  const [runtimeError, setRuntimeError] = useState<string | undefined>()
  const [interactiveInput] = useState(() => canUseInteractiveInput())

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

  const run = useCallback(async (request: PythonRunRequest, handlers?: PythonRunHandlers): Promise<PythonRunResult> => {
    if (!runnerRef.current) {
      return { status: 'error', stdout: '', stderr: '', inputTranscript: [], error: 'Python is still preparing.', durationMs: 0 }
    }
    return runnerRef.current.run(request, handlers)
  }, [])

  const cancel = useCallback(() => runnerRef.current?.cancel(), [])

  return { run, cancel, interactiveInput, runtimeStatus, runtimeError }
}
