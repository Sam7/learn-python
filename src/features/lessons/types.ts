import type { PythonRunResult } from '../python/python-runner/types'

export interface LessonContent {
  lead: string
  notes?: string[]
}

export type OutputValidation = {
  kind: 'output'
  mode: 'exact' | 'lines' | 'non-empty'
  expected?: string[]
  lineCount?: number
  reject?: string[]
}

export type AstValidation = {
  kind: 'ast'
  requirement: 'text-variable'
  reject?: string[]
}

export type LessonValidationDefinition = OutputValidation | AstValidation

export interface Lesson {
  id: string
  order: number
  title: string
  shortTitle: string
  concept: string
  explanation: LessonContent
  exampleCode?: string
  starterCode: string
  task: string
  hints: string[]
  validation: LessonValidationDefinition
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
