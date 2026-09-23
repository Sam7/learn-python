import type { PythonRunResult } from '../features/python/python-runner/types'

export type LessonStatus = 'ready' | 'coming-soon'

export interface LessonContent {
  lead: string
  notes?: string[]
}

export interface LessonInput {
  label: string
  prompt: string
  defaultValue: string
}

export type OutputValidation = {
  kind: 'output'
  mode: 'exact' | 'lines' | 'contains' | 'non-empty'
  expected?: string[]
  lineCount?: number
  reject?: string[]
}

export type AstValidation = {
  kind: 'ast'
  requirement: 'text-variable' | 'variable-in-sentence'
  reject?: string[]
}

export type UnavailableValidation = {
  kind: 'unavailable'
}

export type LessonValidation = OutputValidation | AstValidation | UnavailableValidation

export interface Lesson {
  id: string
  order: number
  title: string
  shortTitle: string
  summary: string
  explanation: LessonContent
  exampleCode?: string
  starterCode: string
  task: string
  hints: string[]
  input?: LessonInput
  validation: LessonValidation
  status: LessonStatus
}

export interface Module {
  id: string
  order: number
  title: string
  description: string
  lessons: Lesson[]
}

export interface Curriculum {
  title: string
  modules: Module[]
}

export interface ValidationResult {
  passed: boolean
  message: string
}

export interface LessonValidationContext {
  code: string
  execution: PythonRunResult
  runValidationCode: (code: string) => Promise<PythonRunResult>
}
