import { INPUT_STATUS, waitForInput } from './python-runner/input-channel'
import type { WorkerRequest, WorkerResponse } from './python-runner/protocol'
import type { PythonInputTranscriptEntry } from './python-runner/types'

const PYODIDE_VERSION = '0.27.5'
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`

interface PyodideGlobals {
  set(name: string, value: unknown): void
}

interface PyodideRuntime {
  globals: PyodideGlobals
  runPythonAsync(code: string): Promise<unknown>
  setStdin(config: { stdin: () => string | undefined }): void
  setStdout(config: { batched: (text: string) => void }): void
  setStderr(config: { batched: (text: string) => void }): void
}

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime>
}

class InputCancelledError extends Error {
  constructor() {
    super('The input request was cancelled.')
    this.name = 'InputCancelledError'
  }
}

type RunContext = {
  requestId: number
  input: Extract<WorkerRequest, { type: 'run' }>['input']
  inputIndex: number
  inputTranscript: PythonInputTranscriptEntry[]
}

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

function nextInput(context: RunContext, prompt: string): string | undefined {
  const inputIndex = context.inputIndex++
  let answer: string | undefined

  if (context.input.mode === 'interactive') {
    if (!context.input.channel) throw new InputCancelledError()
    const channel = context.input.channel
    const control = new Int32Array(channel, 0, 2)
    Atomics.store(control, 0, INPUT_STATUS.waiting)
    self.postMessage({ type: 'input-request', requestId: context.requestId, inputIndex, prompt } satisfies WorkerResponse)
    answer = waitForInput({
      buffer: channel,
      control,
      data: new Uint8Array(channel, Int32Array.BYTES_PER_ELEMENT * 2),
    })
    if (answer === undefined) throw new InputCancelledError()
  } else {
    answer = context.input.lines[inputIndex]
  }

  if (answer !== undefined) {
    context.inputTranscript.push({ inputIndex, prompt, answer })
  }
  return answer
}

function wrappedLearnerCode(code: string): string {
  return `
import builtins as __python_steps_builtins

def __python_steps_input(prompt=""):
    value = __python_steps_next_input(prompt)
    if value is None:
        raise EOFError("EOF when reading a line")
    return value

__python_steps_original_input = __python_steps_builtins.input
__python_steps_builtins.input = __python_steps_input
try:
    exec(compile(${JSON.stringify(code)}, "<learner>", "exec"), {})
finally:
    __python_steps_builtins.input = __python_steps_original_input
`
}

async function runPython(requestId: number, code: string, input: Extract<WorkerRequest, { type: 'run' }>['input']) {
  const startedAt = performance.now()
  const stdout: string[] = []
  const stderr: string[] = []
  const context: RunContext = {
    requestId,
    input,
    inputIndex: 0,
    inputTranscript: [],
  }

  try {
    const pyodide = await getRuntime()
    pyodide.globals.set('__python_steps_next_input', (prompt: string) => nextInput(context, prompt))
    pyodide.setStdin({ stdin: () => nextInput(context, '') })
    pyodide.setStdout({ batched: (text) => stdout.push(`${text}\n`) })
    pyodide.setStderr({ batched: (text) => stderr.push(`${text}\n`) })
    await pyodide.runPythonAsync(wrappedLearnerCode(code))
    self.postMessage({
      type: 'run-result',
      requestId,
      status: 'success',
      stdout: stdout.join(''),
      stderr: stderr.join(''),
      inputTranscript: context.inputTranscript,
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  } catch (error) {
    const cancelled = error instanceof InputCancelledError
    self.postMessage({
      type: 'run-result',
      requestId,
      status: cancelled ? 'cancelled' : 'error',
      stdout: stdout.join(''),
      stderr: stderr.join(''),
      inputTranscript: context.inputTranscript,
      error: errorMessage(error),
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'run') {
    void runPython(event.data.requestId, event.data.code, event.data.input)
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
