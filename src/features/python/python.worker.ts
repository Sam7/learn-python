import { INPUT_STATUS, waitForInput } from './python-runner/input-channel'
import { createOutputCapture } from './python-runner/output-capture'
import type { WorkerRequest, WorkerResponse } from './python-runner/protocol'
import type { PythonInputTranscriptEntry } from './python-runner/types'
import type { PythonTraceFrame, PythonTraceValue } from './python-runner/types'

const PYODIDE_VERSION = '0.27.5'
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`

interface PyodideGlobals {
  set(name: string, value: unknown): void
}

interface PyProxyValue {
  toJs(options?: { dict_converter?: (entries: Iterable<[string, unknown]>) => unknown }): unknown
  destroy?(): void
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

function wrappedLearnerCode(code: string, trace: boolean): string {
  const tracingSetup = trace ? `
import sys as __python_steps_sys

def __python_steps_trace(frame, event, arg):
    if frame.f_code.co_filename == "<learner>" and event in ("line", "return"):
        __python_steps_capture(frame.f_lineno, event, frame.f_locals)
    return __python_steps_trace

__python_steps_previous_trace = __python_steps_sys.gettrace()
__python_steps_sys.settrace(__python_steps_trace)
` : ''
  const tracingCleanup = trace ? `
    __python_steps_sys.settrace(__python_steps_previous_trace)
` : ''

  return `
import builtins as __python_steps_builtins
${tracingSetup}

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
${tracingCleanup}
`
}

function traceValue(value: unknown, depth = 0): PythonTraceValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return typeof value === 'string' ? value.slice(0, 120) : value
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (depth >= 2) return String(value).slice(0, 120)
  if (Array.isArray(value)) return value.slice(0, 12).map((item) => traceValue(item, depth + 1))
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 12).map(([key, item]) => [key, traceValue(item, depth + 1)]))
  }
  return String(value).slice(0, 120)
}

function plainLocals(value: unknown): Record<string, PythonTraceValue> {
  let converted = value
  const proxy = value as Partial<PyProxyValue> | null
  if (proxy && typeof proxy.toJs === 'function') {
    try {
      converted = proxy.toJs({ dict_converter: (entries) => Object.fromEntries(entries) })
    } finally {
      proxy.destroy?.()
    }
  }
  if (!converted || typeof converted !== 'object' || Array.isArray(converted)) return {}
  return Object.fromEntries(
    Object.entries(converted as Record<string, unknown>)
      .filter(([name]) => !name.startsWith('__'))
      .slice(0, 24)
      .map(([name, item]) => [name, traceValue(item)]),
  )
}

async function runPython(
  requestId: number,
  code: string,
  input: Extract<WorkerRequest, { type: 'run' }>['input'],
  trace: boolean,
) {
  const startedAt = performance.now()
  const stdout = createOutputCapture()
  const stderr = createOutputCapture(20_000, 'Python error output')
  const traceFrames: PythonTraceFrame[] = []
  const context: RunContext = {
    requestId,
    input,
    inputIndex: 0,
    inputTranscript: [],
  }

  try {
    const pyodide = await getRuntime()
    pyodide.globals.set('__python_steps_next_input', (prompt: string) => nextInput(context, prompt))
    if (trace) {
      pyodide.globals.set('__python_steps_capture', (line: number, event: PythonTraceFrame['event'], locals: unknown) => {
        if (traceFrames.length < 600) traceFrames.push({ line, event, locals: plainLocals(locals) })
      })
    }
    pyodide.setStdin({ stdin: () => nextInput(context, '') })
    pyodide.setStdout({ batched: (text) => stdout.append(`${text}\n`) })
    pyodide.setStderr({ batched: (text) => stderr.append(`${text}\n`) })
    await pyodide.runPythonAsync(wrappedLearnerCode(code, trace))
    self.postMessage({
      type: 'run-result',
      requestId,
      status: 'success',
      stdout: stdout.read(),
      stderr: stderr.read(),
      inputTranscript: context.inputTranscript,
      ...(trace ? { traceFrames } : {}),
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  } catch (error) {
    const cancelled = error instanceof InputCancelledError
    self.postMessage({
      type: 'run-result',
      requestId,
      status: cancelled ? 'cancelled' : 'error',
      stdout: stdout.read(),
      stderr: stderr.read(),
      inputTranscript: context.inputTranscript,
      ...(trace ? { traceFrames } : {}),
      error: errorMessage(error),
      durationMs: Math.round(performance.now() - startedAt),
    } satisfies WorkerResponse)
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'run') {
    void runPython(event.data.requestId, event.data.code, event.data.input, event.data.trace)
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
