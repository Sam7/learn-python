import { Lightbulb, Terminal } from 'lucide-react'
import { useState } from 'react'
import type { PythonRunResult } from '../../python/python-runner/types'
import { cn } from '../../../lib/utils'
import { HintPanel } from './hint-panel'
import { OutputPanel } from './output-panel'

type UtilityTab = 'output' | 'hint'

interface LessonUtilityPanelProps {
  execution: PythonRunResult | null
  isRunning: boolean
  validationMessage: { passed: boolean; message: string } | null
  hints: string[]
  visibleHints: number
  onRevealHint: () => void
}

export function LessonUtilityPanel({
  execution,
  isRunning,
  validationMessage,
  hints,
  visibleHints,
  onRevealHint,
}: LessonUtilityPanelProps) {
  const [activeTab, setActiveTab] = useState<UtilityTab>('output')
  const outputTabId = 'lesson-utility-output-tab'
  const hintTabId = 'lesson-utility-hint-tab'

  return (
    <aside className="min-w-0 border-t border-line bg-white lg:sticky lg:top-[84px] lg:self-start lg:border-t-0" aria-label="Lesson support">
      <div className="overflow-hidden lg:rounded-2xl lg:border-y lg:border-r lg:border-line">
        <div className="flex border-b border-line" role="tablist" aria-label="Lesson support tabs">
          <button
            type="button"
            role="tab"
            id={outputTabId}
            aria-selected={activeTab === 'output'}
            aria-controls="lesson-utility-output-panel"
            className={tabClassName(activeTab === 'output')}
            onClick={() => setActiveTab('output')}
          >
            <Terminal size={17} aria-hidden="true" />
            Output
          </button>
          <button
            type="button"
            role="tab"
            id={hintTabId}
            aria-selected={activeTab === 'hint'}
            aria-controls="lesson-utility-hint-panel"
            className={tabClassName(activeTab === 'hint')}
            onClick={() => setActiveTab('hint')}
          >
            <Lightbulb size={17} aria-hidden="true" />
            Hint
          </button>
        </div>

        {activeTab === 'output' ? (
          <div id="lesson-utility-output-panel" role="tabpanel" aria-labelledby={outputTabId} tabIndex={0}>
            <OutputPanel execution={execution} isRunning={isRunning} validationMessage={validationMessage} embedded />
          </div>
        ) : (
          <div id="lesson-utility-hint-panel" role="tabpanel" aria-labelledby={hintTabId} tabIndex={0}>
            <HintPanel hints={hints} visibleCount={visibleHints} onReveal={onRevealHint} embedded />
          </div>
        )}
      </div>
    </aside>
  )
}

function tabClassName(selected: boolean) {
  return cn(
    'flex min-h-14 flex-1 items-center justify-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal',
    selected ? 'border-teal bg-mist/45 text-ink' : 'border-transparent text-muted hover:bg-mist/40 hover:text-ink',
  )
}
