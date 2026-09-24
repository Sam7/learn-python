import {
  answerInput,
  canUseInteractiveInput,
  cancelInput,
  createInputChannel,
  type InputChannel,
} from './input-channel'
import type { WorkerResponse, WorkerInput } from './protocol'
import type {
  PythonRunHandlers,
  PythonRunRequest,
  PythonRunResult,
  PythonRunner,
} from './types'

const DEFAULT_TIMEOUT_MS = 5_000
const INPUT_WAIT_TIMEOUT_MS = 5 * 60 * 1_000

interface PendingRun {
  resolve: (result: PythonRunResult) => void
  timer: ReturnType<typeof setTimeout>
  inputChannel: InputChannel | null
  handlers?: PythonRunHandlers
}

function cancelledResult(message = 'The Python run was cancelled.'): PythonRunResult {
  return {
    status: 'cancelled',
    stdout: '',
    stderr: '',
    inputTranscript: [],
    error: message,
    durationMs: 0,
  }
}

export class BrowserPythonRunner implements PythonRunner {
  private worker: Worker | null = null
  private readyPromise: Promise<void> | null = null
  private readyResolve: (() => void) | null = null
  private readyReject: ((error: Error) => void) | null = null
  private requestId = 0
  private pending = new Map<number, PendingRun>()

  readonly interactiveInput = canUseInteractiveInput()

  private createWorker() {
    const worker = new Worker(new URL('../python.worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve
      this.readyReject = reject
    })

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'runtime-ready') {
        this.readyResolve?.()
        this.readyResolve = null
        this.readyReject = null
        return
      }
      if (message.type === 'runtime-error') {
        const error = new Error(message.error)
        this.readyReject?.(error)
        this.readyResolve = null
        this.readyReject = null
        this.resolvePendingWithError(error)
        return
      }
      if (message.type === 'reset-complete') return

      const pending = this.pending.get(message.requestId)
      if (!pending) return

      if (message.type === 'input-request') {
        this.scheduleTimeout(message.requestId, INPUT_WAIT_TIMEOUT_MS)
        const requestInput = pending.handlers?.onInputRequest
        if (!requestInput || !pending.inputChannel) {
          if (pending.inputChannel) cancelInput(pending.inputChannel)
          return
        }
        void requestInput({ inputIndex: message.inputIndex, prompt: message.prompt }).then(
          (answer) => {
            if (this.pending.get(message.requestId) === pending) answerInput(pending.inputChannel!, answer)
          },
          () => {
            if (this.pending.get(message.requestId) === pending) cancelInput(pending.inputChannel!)
          },
        )
        return
      }

      clearTimeout(pending.timer)
      this.pending.delete(message.requestId)
      pending.resolve({
        status: message.status,
        stdout: message.stdout,
        stderr: message.stderr,
        inputTranscript: message.inputTranscript,
        traceFrames: message.traceFrames,
        error: message.error,
        durationMs: message.durationMs,
        workspaceFiles: message.workspaceFiles,
        workspaceWarning: message.workspaceWarning,
      })
    }

    worker.onerror = (event) => {
      const error = new Error(event.message || 'The Python worker stopped unexpectedly.')
      this.readyReject?.(error)
      this.readyResolve = null
      this.readyReject = null
      this.resolvePendingWithError(error)
      this.restartWorker()
    }
  }

  private scheduleTimeout(requestId: number, timeoutMs: number) {
    const pending = this.pending.get(requestId)
    if (!pending) return
    clearTimeout(pending.timer)
    pending.timer = setTimeout(() => {
      const current = this.pending.get(requestId)
      if (!current) return
      this.pending.delete(requestId)
      this.restartWorker()
      void this.prepare().catch(() => undefined)
      if (timeoutMs === INPUT_WAIT_TIMEOUT_MS) {
        current.handlers?.onInputCancel?.('Python waited too long for an answer. Run the code again when you are ready.')
      }
      current.resolve({
        status: 'timeout',
        stdout: '',
        stderr: '',
        inputTranscript: [],
        error: timeoutMs === INPUT_WAIT_TIMEOUT_MS
          ? 'Python waited too long for an answer. Run the code again when you are ready.'
          : 'Your program took too long to finish. It may contain an endless loop.',
        durationMs: timeoutMs,
      })
    }, timeoutMs)
  }

  private resolvePendingWithError(error: Error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.handlers?.onInputCancel?.(error.message)
      pending.resolve({
        status: 'error',
        stdout: '',
        stderr: '',
        inputTranscript: [],
        error: error.message,
        durationMs: 0,
      })
      this.pending.delete(id)
    }
  }

  private restartWorker() {
    this.worker?.terminate()
    this.worker = null
    this.readyPromise = null
    this.readyResolve = null
    this.readyReject = null
  }

  async prepare(): Promise<void> {
    if (!this.worker || !this.readyPromise) this.createWorker()
    await this.readyPromise
  }

  async run(request: PythonRunRequest, handlers?: PythonRunHandlers): Promise<PythonRunResult> {
    if (this.pending.size > 0) return { ...cancelledResult('Python is already running.'), status: 'error' }

    try {
      await this.prepare()
    } catch (error) {
      return {
        status: 'error',
        stdout: '',
        stderr: '',
        inputTranscript: [],
        error: error instanceof Error ? error.message : String(error),
        durationMs: 0,
      }
    }

    const worker = this.worker
    if (!worker) {
      return { status: 'error', stdout: '', stderr: '', inputTranscript: [], error: 'Python is not available yet.', durationMs: 0 }
    }

    const id = ++this.requestId
    const requestedInput = request.input ?? { mode: 'transcript' as const, lines: [] }
    const mode = requestedInput.mode === 'interactive' && this.interactiveInput ? 'interactive' : 'transcript'
    const inputChannel = mode === 'interactive' ? createInputChannel() : null
    const input: WorkerInput = {
      mode,
      lines: requestedInput.lines ?? [],
      ...(inputChannel ? { channel: inputChannel.buffer } : {}),
    }

    return new Promise<PythonRunResult>((resolve) => {
      const pending: PendingRun = {
        resolve,
        timer: setTimeout(() => undefined, 0),
        inputChannel,
        handlers,
      }
      this.pending.set(id, pending)
      this.scheduleTimeout(id, request.timeoutMs ?? DEFAULT_TIMEOUT_MS)
      worker.postMessage({
        type: 'run',
        requestId: id,
        ...(request.workspace
          ? { mode: 'workspace', workspace: { ...request.workspace, files: { ...request.workspace.files, [request.workspace.entryFile]: request.code } } }
          : { mode: 'code', code: request.code }),
        input,
        trace: request.trace ?? false,
      })
    })
  }

  cancel(): void {
    const current = this.pending.entries().next().value as [number, PendingRun] | undefined
    if (!current) return
    const [requestId, pending] = current
    clearTimeout(pending.timer)
    this.pending.delete(requestId)
    if (pending.inputChannel) cancelInput(pending.inputChannel)
    this.restartWorker()
    void this.prepare().catch(() => undefined)
    pending.resolve(cancelledResult())
  }

  async reset(): Promise<void> {
    this.restartWorker()
    await this.prepare()
  }

  dispose(): void {
    this.resolvePendingWithError(new Error('Python runner was closed.'))
    this.restartWorker()
  }
}
