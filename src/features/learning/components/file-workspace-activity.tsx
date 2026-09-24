import { useState } from 'react'
import { FilePlus2, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import type { FileWorkspaceActivity, ValidationResult } from '../../../curriculum/types'
import { CodeEditor } from '../../lessons/components/code-editor'
import { InputPanel } from '../../python/components/input-panel'
import type { PythonRunResult } from '../../python/python-runner/types'
import { MAX_VIRTUAL_FILE_COUNT, nextPythonFileName, type VirtualFileMap } from '../../../lib/virtual-files'
import { ActivityHints } from './activity-hints'
import type { InputInteractionProps } from './code-activity'
import { ExecutionOutput } from './execution-output'

interface FileWorkspaceActivityViewProps {
  activity: FileWorkspaceActivity
  files: VirtualFileMap
  onFilesChange: (files: VirtualFileMap) => void
  onReset: () => void
  onRun: () => void
  isRunning: boolean
  runtimeReady: boolean
  runtimeError?: string
  execution: PythonRunResult | null
  feedback: ValidationResult | null
  hintsRevealed: number
  onRevealHint: () => void
  input: InputInteractionProps
}

export function FileWorkspaceActivityView({
  activity,
  files,
  onFilesChange,
  onReset,
  onRun,
  isRunning,
  runtimeReady,
  runtimeError,
  execution,
  feedback,
  hintsRevealed,
  onRevealHint,
  input,
}: FileWorkspaceActivityViewProps) {
  const [selection, setSelection] = useState({ activityId: activity.id, path: activity.entryFile })
  const selectedFile = selection.activityId === activity.id ? selection.path : activity.entryFile
  const fileNames = Object.keys(files).sort((left, right) => {
    if (left === activity.entryFile) return -1
    if (right === activity.entryFile) return 1
    return left.localeCompare(right)
  })
  const activeFile = files[selectedFile] !== undefined ? selectedFile : activity.entryFile
  const canRemove = activeFile !== activity.entryFile && !Object.hasOwn(activity.starterFiles, activeFile)

  const selectFile = (path: string) => setSelection({ activityId: activity.id, path })

  const updateFile = (value: string) => onFilesChange({ ...files, [activeFile]: value })

  const addFile = () => {
    if (fileNames.length >= MAX_VIRTUAL_FILE_COUNT) return
    const name = nextPythonFileName(files)
    onFilesChange({ ...files, [name]: '' })
    selectFile(name)
  }

  const removeFile = () => {
    if (!canRemove) return
    const nextFiles = { ...files }
    delete nextFiles[activeFile]
    onFilesChange(nextFiles)
    selectFile(activity.entryFile)
  }

  return (
    <section className="rounded-xl border border-teal/20 bg-white p-3.5 shadow-[0_8px_28px_rgba(40,127,120,0.05)] sm:p-4" aria-label={activity.title}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-ink">{activity.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{activity.prompt}</p>
        </div>
        <Button type="button" variant="quiet" size="sm" className="min-h-10 shrink-0" onClick={onReset} disabled={isRunning}>
          <RotateCcw size={14} aria-hidden="true" /> Reset project
        </Button>
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)]">
        <div className="min-w-0 rounded-xl border border-line bg-[#142321] p-2">
          <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="group" aria-label="Project files">
              {fileNames.map((path) => (
                <button
                  key={path}
                  type="button"
                  aria-label={`Open ${path}${path === activity.entryFile ? ', run entry file' : ''}`}
                  aria-pressed={activeFile === path}
                  onClick={() => selectFile(path)}
                  className={`min-h-10 shrink-0 rounded-md border px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${activeFile === path ? 'border-teal/50 bg-teal/15 text-white' : 'border-transparent text-mist/70 hover:bg-white/5 hover:text-white'}`}
                >
                  {path}
                  {path === activity.entryFile ? <span className="ml-1 text-mist/60">· run</span> : null}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="quiet" size="sm" className="size-10 px-0 text-mist hover:bg-white/10 hover:text-white" aria-label="Add project file" title="Add project file" onClick={addFile} disabled={isRunning || fileNames.length >= MAX_VIRTUAL_FILE_COUNT}>
                <FilePlus2 size={16} aria-hidden="true" />
              </Button>
              <Button type="button" variant="quiet" size="sm" className="size-10 px-0 text-mist hover:bg-white/10 hover:text-white" aria-label={`Remove ${activeFile}`} title={`Remove ${activeFile}`} onClick={removeFile} disabled={isRunning || !canRemove}>
                <Trash2 size={15} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <CodeEditor
            value={files[activeFile] ?? ''}
            onChange={updateFile}
            language={activeFile.endsWith('.py') ? 'python' : 'plain'}
            ariaLabel={`Editor for ${activeFile}`}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 pt-2">
            <Button type="button" size="sm" className="min-h-10 px-4" onClick={onRun} disabled={isRunning || !runtimeReady}>
              {isRunning ? 'Running…' : 'Run project'}
            </Button>
            <span className="text-[11px] text-mist/70">Python starts in {activity.entryFile}.</span>
          </div>
          {input.interactive ? null : (
            <div className="mt-2 rounded-lg bg-paper p-2 text-ink">
              <InputPanel {...input} />
            </div>
          )}
          {input.interactive && input.pendingRequest ? <InputPanel {...input} /> : null}
          {runtimeError ? <p className="mt-2 text-xs text-coral" role="alert">{runtimeError}</p> : null}
        </div>
        <ExecutionOutput execution={execution} isRunning={isRunning} feedback={feedback} />
      </div>

      <ActivityHints hints={activity.hints ?? []} visibleCount={hintsRevealed} onReveal={onRevealHint} />
    </section>
  )
}
