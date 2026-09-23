export type LessonStatus = 'ready' | 'coming-soon'

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; tone: 'tip' | 'note'; text: string }
  | { type: 'example'; code: string; caption?: string }
  | { type: 'evaluation'; expression: string; steps: string[]; caption?: string }

export interface ActivityBase {
  id: string
  title: string
  prompt: string
  required: boolean
  hints?: string[]
}

export type OutputExpectation =
  | { mode: 'exact'; lines: string[] }
  | { mode: 'contains'; values: string[] }
  | { mode: 'line-count'; count: number }
  | { mode: 'distinct-lines'; count: number }
  | { mode: 'non-empty' }

export interface BehaviorTestCase {
  inputs: string[]
  output?: OutputExpectation
  requiredInputs?: Array<{
    inputIndex: number
    minimumOccurrences?: number
    mustAppearInOutput?: boolean
  }>
}

export type AstRequirement =
  | 'text-variable'
  | 'variable-in-sentence'
  | 'named-value'
  | 'variable-reassignment'
  | 'variable-increment'
  | 'comparison'
  | 'boolean-value'
  | 'conditional'
  | 'if-else'
  | 'elif'
  | 'logical-and'
  | 'logical-or'
  | 'logical-not'

export type CodeAssessment =
  | { kind: 'output'; expectation: OutputExpectation; rejectExact?: string[] }
  | { kind: 'output-and-ast'; expectation: OutputExpectation; requirement: AstRequirement }
  | { kind: 'behavior'; cases: BehaviorTestCase[]; requirements?: AstRequirement[] }
  | { kind: 'runtime-error'; exceptionName: string }
  | { kind: 'ast'; requirement: AstRequirement; rejectOutput?: string[] }

export interface CodeActivity extends ActivityBase {
  kind: 'code'
  starterCode: string
  sampleInputs?: string[]
  assessment: CodeAssessment
  executionMode?: 'normal' | 'trace'
}

export interface PredictOutputActivity extends ActivityBase {
  kind: 'predict-output'
  code: string
  expectedOutput: string[]
  sampleInputs?: string[]
}

export interface PredictStateActivity extends ActivityBase {
  kind: 'predict-state'
  code: string
  line: number
  occurrence?: number
  variable: string
  expectedValue: string
  choices: string[]
}

export interface ChoiceActivity extends ActivityBase {
  kind: 'choice'
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  correctFeedback?: string
  incorrectFeedback?: string
}

export interface ArrangeCodeActivity extends ActivityBase {
  kind: 'arrange-code'
  fragments: Array<{ id: string; code: string }>
  startingOrder: string[]
  correctOrder: string[]
}

export interface TraceActivity extends ActivityBase {
  kind: 'trace'
  code: string
  sampleInputs?: string[]
}

export interface TraceTableCheckpoint {
  id: string
  line: number
  label: string
  occurrence?: number
}

export interface TraceTableActivity extends ActivityBase {
  kind: 'trace-table'
  code: string
  variables: string[]
  checkpoints: TraceTableCheckpoint[]
  sampleInputs?: string[]
}

export interface BranchTracePath {
  id: string
  label: string
  /** Exclusive body lines for this path. An otherwise path may have no lines. */
  lines: number[]
  otherwise?: boolean
}

/** Predict which mutually exclusive path Python takes, then compare with a real trace. */
export interface BranchTraceActivity extends ActivityBase {
  kind: 'branch-trace'
  code: string
  paths: BranchTracePath[]
}

/** A private, ungraded pause for the learner to put their reasoning into words. */
export interface ReflectionActivity extends ActivityBase {
  kind: 'reflection'
  required: false
  placeholder?: string
}

export type LearningActivity =
  | CodeActivity
  | PredictOutputActivity
  | PredictStateActivity
  | ChoiceActivity
  | ArrangeCodeActivity
  | TraceActivity
  | TraceTableActivity
  | BranchTraceActivity
  | ReflectionActivity

export interface LessonStep {
  id: string
  content: ContentBlock[]
  activity?: LearningActivity
}

export interface Lesson {
  id: string
  order: number
  title: string
  shortTitle: string
  summary: string
  learningGoal?: string
  conceptTags?: string[]
  misconceptions?: string[]
  steps: LessonStep[]
  status: LessonStatus
}

export interface Stage {
  id: string
  order: number
  title: string
  description: string
  lessons: Lesson[]
}

export interface Curriculum {
  title: string
  stages: Stage[]
}

export interface ValidationResult {
  passed: boolean
  message: string
  evidence?: {
    expected?: string
    actual?: string
  }
}

export type LearnerResponse = string | string[] | Record<string, string>

export interface ActivityProgress {
  code?: string
  response?: LearnerResponse
  hintsRevealed?: number
}
