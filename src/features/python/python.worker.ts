const PYODIDE_VERSION = '0.27.5'
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`

interface PyodideRuntime {
  runPythonAsync(code: string): Promise<unknown>
  setStdin(config: { stdin: () => string }): void
  setStdout(config: { batched: (text: string) => void }): void
  setStderr(config: { batched: (text: string) => void }): void
}

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime>
}

export type WorkerRequest =
  | { type: 'run'; requestId: number; code: string; stdin: string[] }
  | { type: 'reset'; requestId: number }

export type WorkerResponse =
  | { type: 'runtime-ready' }
  | { type: 'runtime-error'; error: string }
  | {
      type: 'run-result'
      requestId: number
      status: 'success' | 'error'
      stdout: string
      stderr: string
      error?: string
      durationMs: number
    }
  | { type: 'reset-complete'; requestId: number }

let runtime: PyodideRuntime | null = null
let runtimePromise: Promise<PyodideRuntime> | null = null

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function getRuntime(): Promise<PyodideRuntime> {
  if (runtime) return runtime
  if (!runtimePromise) {
    runtimePromise = import(/* @vite-ignore */ PYODIDE_MODULE_URL)
      .then((module) => (module as PyodideModule).loadPyodide({ indexURL: PYODIDE_INDEX_URL }))
      .then((loaded) => {
        runtime = loaded
        return loaded
      })
  }
  return runtimePromise
}

async function prepareRuntime() {
  try {
    await getRuntime()
    self.postMessage({ type: 'runtime-ready' } satisfies WorkerResponse)
  } catch (error) {
    self.postMessage({ type: 'runtime-error', error: errorMessage(error) } satisfies WorkerResponse)
  }
}

async function runPython(requestId: number, code: string, stdin: string[]) {
  const startedAt = performance.now()
  const stdout: string[] = []
  const stderr: string[] = []
  let inputIndex = 0

  try {
    const pyodide = await getRuntime()
    pyodide.setStdin({ stdin: () => stdin[inputIndex++] ?? '' })
    pyodide.setStdout({ batched: (text) => stdout.push(`${text}\n`) })
    pyodide.setStderr({ batched: (text) => stderr.push(`${text}\n`) })
    await pyodide.runPythonAsync(code)
    self.postMessage({
      type: 'run-result',
      requestId,
      status: 'success',
      stdout: stdout.join(''),
      stderr: stderr.join(''),
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  } catch (error) {
    self.postMessage({
      type: 'run-result',
      requestId,
      status: 'error',
      stdout: stdout.join(''),
      stderr: stderr.join(''),
      error: errorMessage(error),
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'run') {
    void runPython(event.data.requestId, event.data.code, event.data.stdin)
    return
  }

  runtime = null
  runtimePromise = null
  void getRuntime()
    .then(() => {
      self.postMessage({ type: 'reset-complete', requestId: event.data.requestId } satisfies WorkerResponse)
    })
    .catch((error) => {
      self.postMessage({ type: 'runtime-error', error: errorMessage(error) } satisfies WorkerResponse)
    })
}

void prepareRuntime()
