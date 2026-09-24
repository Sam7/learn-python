import { INPUT_STATUS, waitForInput } from './python-runner/input-channel'
import { createOutputCapture } from './python-runner/output-capture'
import type { WorkerRequest, WorkerResponse } from './python-runner/protocol'
import type { PythonInputTranscriptEntry } from './python-runner/types'
import type { PythonTraceFrame, PythonTraceValue } from './python-runner/types'
import type { PythonWorkspace } from './python-runner/types'
import {
  isSafeVirtualFilePath,
  MAX_VIRTUAL_FILE_BYTES,
  MAX_VIRTUAL_FILE_COUNT,
  MAX_VIRTUAL_WORKSPACE_BYTES,
  normalizeVirtualFiles,
  type VirtualFileMap,
} from '../../lib/virtual-files'

const PYODIDE_VERSION = '0.27.5'
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`
const WORKSPACE_ROOT = '/home/pyodide/python_steps_workspace'

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

function workspaceSource(workspace: PythonWorkspace): string {
  const files = normalizeVirtualFiles(workspace.files)
  const source = files[workspace.entryFile]
  if (!isSafeVirtualFilePath(workspace.entryFile) || typeof source !== 'string') {
    throw new Error('The project entry file must be a safe relative path in the workspace.')
  }
  return source
}

async function prepareWorkspace(pyodide: PyodideRuntime, workspace: PythonWorkspace): Promise<void> {
  const files = normalizeVirtualFiles(workspace.files)
  workspaceSource({ ...workspace, files })
  pyodide.globals.set('__python_steps_workspace_files_json', JSON.stringify(files))
  await pyodide.runPythonAsync(`
import importlib as __python_steps_importlib
import json as __python_steps_json
import os as __python_steps_os
import shutil as __python_steps_shutil
import sys as __python_steps_sys

__python_steps_root = ${JSON.stringify(WORKSPACE_ROOT)}
for __python_steps_name, __python_steps_module in list(__python_steps_sys.modules.items()):
    __python_steps_module_file = getattr(__python_steps_module, "__file__", None)
    if __python_steps_module_file:
        try:
            __python_steps_module_path = __python_steps_os.path.abspath(__python_steps_module_file)
            if __python_steps_os.path.commonpath((__python_steps_root, __python_steps_module_path)) == __python_steps_root:
                __python_steps_sys.modules.pop(__python_steps_name, None)
        except ValueError:
            pass
__python_steps_sys.path_importer_cache.pop(__python_steps_root, None)
__python_steps_importlib.invalidate_caches()
if __python_steps_os.path.exists(__python_steps_root):
    __python_steps_shutil.rmtree(__python_steps_root)
__python_steps_os.makedirs(__python_steps_root)
for __python_steps_relative, __python_steps_content in __python_steps_json.loads(__python_steps_workspace_files_json).items():
    __python_steps_target = __python_steps_os.path.join(__python_steps_root, *__python_steps_relative.split("/"))
    __python_steps_os.makedirs(__python_steps_os.path.dirname(__python_steps_target), exist_ok=True)
    with open(__python_steps_target, "w", encoding="utf-8", newline="") as __python_steps_file:
        __python_steps_file.write(__python_steps_content)
`)
}

function pythonString(value: unknown): string {
  if (typeof value === 'string') return value
  const proxy = value as Partial<PyProxyValue> | null
  if (proxy && typeof proxy.toJs === 'function') {
    try {
      const converted = proxy.toJs()
      if (typeof converted === 'string') return converted
      return String(converted)
    } finally {
      proxy.destroy?.()
    }
  }
  return String(value)
}

async function snapshotWorkspace(pyodide: PyodideRuntime): Promise<{ files: VirtualFileMap; omitted: number }> {
  const snapshot = await pyodide.runPythonAsync(`
import json as __python_steps_json
import os as __python_steps_os

__python_steps_root = ${JSON.stringify(WORKSPACE_ROOT)}
__python_steps_result = {"files": {}, "omitted": 0}
__python_steps_total_bytes = 0
for __python_steps_directory, __python_steps_directories, __python_steps_names in __python_steps_os.walk(__python_steps_root):
    __python_steps_directories.sort()
    for __python_steps_name in sorted(__python_steps_names):
        __python_steps_path = __python_steps_os.path.join(__python_steps_directory, __python_steps_name)
        if __python_steps_os.path.islink(__python_steps_path):
            __python_steps_result["omitted"] += 1
            continue
        __python_steps_relative = __python_steps_os.path.relpath(__python_steps_path, __python_steps_root).replace(__python_steps_os.sep, "/")
        try:
            __python_steps_size = __python_steps_os.path.getsize(__python_steps_path)
            if __python_steps_size > ${MAX_VIRTUAL_FILE_BYTES} or len(__python_steps_result["files"]) >= ${MAX_VIRTUAL_FILE_COUNT} or __python_steps_total_bytes + __python_steps_size > ${MAX_VIRTUAL_WORKSPACE_BYTES}:
                __python_steps_result["omitted"] += 1
                continue
            with open(__python_steps_path, "r", encoding="utf-8") as __python_steps_file:
                __python_steps_content = __python_steps_file.read()
        except (OSError, UnicodeDecodeError):
            __python_steps_result["omitted"] += 1
            continue
        __python_steps_result["files"][__python_steps_relative] = __python_steps_content
        __python_steps_total_bytes += __python_steps_size
__python_steps_json.dumps(__python_steps_result)
`)
  const parsed: unknown = JSON.parse(pythonString(snapshot))
  if (!parsed || typeof parsed !== 'object' || !('files' in parsed)) return { files: {}, omitted: 0 }
  const record = parsed as { files: unknown; omitted?: unknown }
  return {
    files: normalizeVirtualFiles(record.files),
    omitted: typeof record.omitted === 'number' && Number.isInteger(record.omitted) ? record.omitted : 0,
  }
}

function wrappedLearnerCode(code: string, trace: boolean, filename = '<learner>', workspaceRoot?: string): string {
  const filenameLiteral = JSON.stringify(filename)
  const workspaceSetup = workspaceRoot ? `
import os as __python_steps_os
import sys as __python_steps_sys
__python_steps_old_cwd = __python_steps_os.getcwd()
__python_steps_old_path = __python_steps_sys.path[:]
__python_steps_workspace_root = ${JSON.stringify(workspaceRoot)}
__python_steps_sys.path.insert(0, __python_steps_workspace_root)
__python_steps_os.chdir(__python_steps_workspace_root)
` : ''
  const workspaceCleanup = workspaceRoot ? `
    __python_steps_sys.path[:] = __python_steps_old_path
    __python_steps_os.chdir(__python_steps_old_cwd)
` : ''
  const tracingSetup = trace ? `
import sys as __python_steps_sys

def __python_steps_trace(frame, event, arg):
    if frame.f_code.co_filename == ${filenameLiteral} and event in ("line", "return"):
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
${workspaceSetup}
${tracingSetup}

def __python_steps_input(prompt=""):
    value = __python_steps_next_input(prompt)
    if value is None:
        raise EOFError("EOF when reading a line")
    return value

__python_steps_original_input = __python_steps_builtins.input
__python_steps_builtins.input = __python_steps_input
try:
    exec(compile(${JSON.stringify(code)}, ${filenameLiteral}, "exec"), {})
finally:
    __python_steps_builtins.input = __python_steps_original_input
${tracingCleanup}
${workspaceCleanup}
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

async function runPython(request: Extract<WorkerRequest, { type: 'run' }>) {
  const { requestId, input, trace } = request
  const workspace = request.mode === 'workspace' ? request.workspace : undefined
  const startedAt = performance.now()
  const stdout = createOutputCapture()
  const stderr = createOutputCapture(20_000, 'Python error output')
  const traceFrames: PythonTraceFrame[] = []
  const initialWorkspaceFiles = workspace ? normalizeVirtualFiles(workspace.files) : undefined
  let workspaceFiles = initialWorkspaceFiles
  let workspaceWarning: string | undefined
  let workspacePrepared = false
  let status: 'success' | 'error' | 'cancelled' = 'success'
  let errorMessageValue: string | undefined
  const context: RunContext = {
    requestId,
    input,
    inputIndex: 0,
    inputTranscript: [],
  }

  try {
    const pyodide = await getRuntime()
    let code: string
    let filename = '<learner>'
    if (workspace) {
      await prepareWorkspace(pyodide, workspace)
      workspacePrepared = true
      code = workspaceSource({ ...workspace, files: initialWorkspaceFiles ?? {} })
      filename = `${WORKSPACE_ROOT}/${workspace.entryFile}`
    } else {
      code = request.mode === 'code' ? request.code : ''
    }
    pyodide.globals.set('__python_steps_next_input', (prompt: string) => nextInput(context, prompt))
    if (trace) {
      pyodide.globals.set('__python_steps_capture', (line: number, event: PythonTraceFrame['event'], locals: unknown) => {
        if (traceFrames.length < 600) traceFrames.push({ line, event, locals: plainLocals(locals) })
      })
    }
    pyodide.setStdin({ stdin: () => nextInput(context, '') })
    pyodide.setStdout({ batched: (text) => stdout.append(`${text}\n`) })
    pyodide.setStderr({ batched: (text) => stderr.append(`${text}\n`) })
    await pyodide.runPythonAsync(wrappedLearnerCode(code, trace, filename, workspace ? WORKSPACE_ROOT : undefined))
  } catch (error) {
    status = error instanceof InputCancelledError ? 'cancelled' : 'error'
    errorMessageValue = errorMessage(error)
  }

  if (workspacePrepared) {
    try {
      const pyodide = await getRuntime()
      const snapshot = await snapshotWorkspace(pyodide)
      workspaceFiles = snapshot.files
      if (snapshot.omitted > 0) {
        workspaceWarning = `${snapshot.omitted} file${snapshot.omitted === 1 ? '' : 's'} could not be saved to the project workspace because they were too large, not text, or over the file limit.`
      }
    } catch (error) {
      workspaceWarning = `Python ran, but the project files could not be saved: ${errorMessage(error)}`
    }
  }

  self.postMessage({
    type: 'run-result',
    requestId,
    status,
    stdout: stdout.read(),
    stderr: stderr.read(),
    inputTranscript: context.inputTranscript,
    ...(trace ? { traceFrames } : {}),
    ...(errorMessageValue ? { error: errorMessageValue } : {}),
    ...(workspaceFiles ? { workspaceFiles } : {}),
    ...(workspaceWarning ? { workspaceWarning } : {}),
    durationMs: Math.round(performance.now() - startedAt),
  } satisfies WorkerResponse)
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === 'run') {
    void runPython(event.data)
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
