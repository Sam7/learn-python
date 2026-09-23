import type {
  PythonRunRequest,
  PythonRunResult,
  PythonRunner,
} from './types'
import type { WorkerResponse } from '../python.worker'

const DEFAULT_TIMEOUT_MS = 8_000

interface PendingRun {
  resolve: (result: PythonRunResult) => void
  timer: ReturnType<typeof setTimeout>
}

export class BrowserPythonRunner implements PythonRunner {
  private worker: Worker | null = null
  private readyPromise: Promise<void> | null = null
  private readyResolve: (() => void) | null = null
  private readyReject: ((error: Error) => void) | null = null
  private requestId = 0
  private pending = new Map<number, PendingRun>()

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
      if (message.type === 'reset-complete') {
        return
      }

      const pending = this.pending.get(message.requestId)
      if (!pending) return
      clearTimeout(pending.timer)
      this.pending.delete(message.requestId)
      pending.resolve({
        status: message.status,
        stdout: message.stdout,
        stderr: message.stderr,
        error: message.error,
        durationMs: message.durationMs,
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

  private resolvePendingWithError(error: Error) {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.resolve({
        status: 'error',
        stdout: '',
        stderr: '',
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

  async run({ code, timeoutMs = DEFAULT_TIMEOUT_MS }: PythonRunRequest): Promise<PythonRunResult> {
    try {
      await this.prepare()
    } catch (error) {
      return {
        status: 'error',
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : String(error),
        durationMs: 0,
      }
    }

    const worker = this.worker
    if (!worker) {
      return { status: 'error', stdout: '', stderr: '', error: 'Python is not available yet.', durationMs: 0 }
    }

    const requestId = ++this.requestId
    return new Promise<PythonRunResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId)
        this.restartWorker()
        // Start rebuilding the runtime immediately. The next Run can then wait
        // for a warm worker instead of making the learner wait from scratch.
        void this.prepare().catch(() => undefined)
        resolve({
          status: 'timeout',
          stdout: '',
          stderr: '',
          error: 'Your program took too long to finish. It may contain an endless loop.',
          durationMs: timeoutMs,
        })
      }, timeoutMs)
      this.pending.set(requestId, { resolve, timer })
      worker.postMessage({ type: 'run', requestId, code })
    })
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
