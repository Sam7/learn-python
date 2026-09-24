import type { Curriculum, LearningActivity, Lesson, LessonStep, Stage } from './types'
import { stageZero } from './stages/stage-0'
import { stageOne } from './stages/stage-1'
import { stageTwo } from './stages/stage-2'
import { stageThree } from './stages/stage-3'
import { stageFour } from './stages/stage-4'
import { stageFive } from './stages/stage-5'
import { stageSix } from './stages/stage-6'
import { stageSeven } from './stages/stage-7'
import { stageEight } from './stages/stage-8'
import { stageNine } from './stages/stage-9'
import { stageTen } from './stages/stage-10'
import { stageEleven } from './stages/stage-11'
import { isSafeVirtualFilePath, normalizeVirtualFiles } from '../lib/virtual-files'

const curriculumDefinition: Curriculum = {
  title: 'Python Steps',
  stages: [stageZero, stageOne, stageTwo, stageThree, stageFour, stageFive, stageSix, stageSeven, stageEight, stageNine, stageTen, stageEleven],
}

export function orderCurriculum(definition: Curriculum): Curriculum {
  return {
    ...definition,
    stages: [...definition.stages]
      .sort((left, right) => left.order - right.order)
      .map((stage) => ({
        ...stage,
        lessons: [...stage.lessons].sort((left, right) => left.order - right.order),
      })),
  }
}

export const curriculum = orderCurriculum(curriculumDefinition)

assertValidCurriculum(curriculum)

export const stages = curriculum.stages
export const allLessons = stages.flatMap((stage) => stage.lessons)
export const readyLessons = allLessons.filter((lesson) => lesson.status === 'ready')
export const lessonIds = allLessons.map((lesson) => lesson.id)

export function getLessonById(id: string): Lesson | undefined {
  return allLessons.find((lesson) => lesson.id === id)
}

export function getStageById(id: string): Stage | undefined {
  return stages.find((stage) => stage.id === id)
}

export function getStageForLesson(lessonId: string): Stage | undefined {
  return stages.find((stage) => stage.lessons.some((lesson) => lesson.id === lessonId))
}

export function getLessonLocation(lessonId: string) {
  const stage = getStageForLesson(lessonId)
  const lesson = stage?.lessons.find((item) => item.id === lessonId)
  return stage && lesson ? { stage, lesson } : undefined
}

export function getPreviousLesson(lessonId: string): Lesson | undefined {
  const currentIndex = readyLessons.findIndex((lesson) => lesson.id === lessonId)
  return currentIndex > 0 ? readyLessons[currentIndex - 1] : undefined
}

export function getNextLesson(lessonId: string): Lesson | undefined {
  const currentIndex = readyLessons.findIndex((lesson) => lesson.id === lessonId)
  return currentIndex >= 0 ? readyLessons[currentIndex + 1] : undefined
}

export function getNextCurriculumLesson(lessonId: string): Lesson | undefined {
  const currentIndex = allLessons.findIndex((lesson) => lesson.id === lessonId)
  return currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined
}

export function getFirstReadyLesson(): Lesson | undefined {
  return readyLessons[0]
}

export function getStepById(lesson: Lesson, stepId: string): LessonStep | undefined {
  return lesson.steps.find((step) => step.id === stepId)
}

export function getActivityById(lesson: Lesson, activityId: string): LearningActivity | undefined {
  return lesson.steps.find((step) => step.activity?.id === activityId)?.activity
}

export function getRequiredActivityIds(lesson: Lesson): string[] {
  return lesson.steps.flatMap((step) => {
    const activity = step.activity
    return activity?.required ? [activity.id] : []
  })
}

export function isLessonComplete(lesson: Lesson, completedActivityIds: string[]): boolean {
  const requiredIds = getRequiredActivityIds(lesson)
  return lesson.status === 'ready'
    && requiredIds.length > 0
    && requiredIds.every((id) => completedActivityIds.includes(id))
}

export function getCompletedLessonIds(completedActivityIds: string[]): string[] {
  return readyLessons
    .filter((lesson) => isLessonComplete(lesson, completedActivityIds))
    .map((lesson) => lesson.id)
}

export function validateCurriculum(curriculumData: Curriculum): string[] {
  const issues: string[] = []
  const stageIds = new Set<string>()
  const lessonIdsSeen = new Set<string>()
  const activityIds = new Set<string>()
  const stageOrderValues = new Set<number>()

  for (const [stageIndex, stage] of curriculumData.stages.entries()) {
    if (!stage.id.trim()) issues.push(`Stage at position ${stageIndex + 1} has no id.`)
    if (stageIds.has(stage.id)) issues.push(`Duplicate stage id: ${stage.id}.`)
    stageIds.add(stage.id)
    if (!Number.isInteger(stage.order) || stage.order < 0) issues.push(`Stage ${stage.id} must have a non-negative integer order.`)
    if (stageOrderValues.has(stage.order)) issues.push(`Duplicate stage order: ${stage.order}.`)
    stageOrderValues.add(stage.order)

    for (const [lessonIndex, lesson] of stage.lessons.entries()) {
      if (!lesson.id.trim()) issues.push(`A lesson in ${stage.id} has no id.`)
      if (lessonIdsSeen.has(lesson.id)) issues.push(`Duplicate lesson id: ${lesson.id}.`)
      lessonIdsSeen.add(lesson.id)
      if (!Number.isInteger(lesson.order) || lesson.order <= 0) issues.push(`Lesson ${lesson.id} must have a positive integer order.`)
      if (lesson.status === 'ready' && lesson.steps.length === 0) {
        issues.push(`Ready lesson ${lesson.id} needs at least one step.`)
      }

      const stepIds = new Set<string>()
      let requiredActivities = 0
      for (const step of lesson.steps) {
        if (!step.id.trim()) issues.push(`A step in ${lesson.id} has no id.`)
        if (stepIds.has(step.id)) issues.push(`Duplicate step id ${step.id} in lesson ${lesson.id}.`)
        stepIds.add(step.id)
        const activity = step.activity
        if (!activity) continue
        if (!activity.id.trim()) issues.push(`An activity in ${lesson.id}/${step.id} has no id.`)
        if (activityIds.has(activity.id)) issues.push(`Duplicate activity id: ${activity.id}.`)
        activityIds.add(activity.id)
        if (activity.required) requiredActivities += 1

        if (activity.kind === 'choice' && !activity.options.some((option) => option.id === activity.correctOptionId)) {
          issues.push(`Choice activity ${activity.id} has no matching correct option.`)
        }
        if (activity.kind === 'predict-state' && !activity.choices.includes(activity.expectedValue)) {
          issues.push(`State prediction ${activity.id} must include its expected value as a choice.`)
        }
        if (activity.kind === 'trace-table') {
          if (activity.variables.length === 0 || activity.variables.some((name) => !name.trim())) {
            issues.push(`Trace table ${activity.id} needs one or more named variables.`)
          }
          if (new Set(activity.variables).size !== activity.variables.length) {
            issues.push(`Trace table ${activity.id} cannot repeat a variable column.`)
          }
          if (activity.checkpoints.length === 0) {
            issues.push(`Trace table ${activity.id} needs at least one checkpoint.`)
          }
          const checkpointIds = activity.checkpoints.map((checkpoint) => checkpoint.id)
          if (new Set(checkpointIds).size !== checkpointIds.length) {
            issues.push(`Trace table ${activity.id} cannot repeat a checkpoint id.`)
          }
          if (activity.checkpoints.some((checkpoint) => !Number.isInteger(checkpoint.line) || checkpoint.line < 1)) {
            issues.push(`Trace table ${activity.id} checkpoints need positive integer line numbers.`)
          }
        }
        if (activity.kind === 'branch-trace') {
          if (activity.paths.length < 2) {
            issues.push(`Branch trace ${activity.id} needs at least two alternative paths.`)
          }
          const pathIds = activity.paths.map((path) => path.id)
          if (activity.paths.some((path) => !path.id.trim() || !path.label.trim())) {
            issues.push(`Branch trace ${activity.id} needs a name and label for every path.`)
          }
          if (new Set(pathIds).size !== pathIds.length) {
            issues.push(`Branch trace ${activity.id} cannot repeat a path id.`)
          }
          if (activity.paths.filter((path) => path.otherwise).length > 1) {
            issues.push(`Branch trace ${activity.id} can have at most one otherwise path.`)
          }
          const branchLines = activity.paths.flatMap((path) => path.lines)
          if (new Set(branchLines).size !== branchLines.length) {
            issues.push(`Branch trace ${activity.id} cannot assign a line to multiple paths.`)
          }
          if (activity.paths.some((path) => path.lines.length === 0 && !path.otherwise)) {
            issues.push(`An empty path in branch trace ${activity.id} must be marked otherwise.`)
          }
          if (activity.paths.some((path) => path.otherwise && path.lines.length > 0)) {
            issues.push(`The otherwise path in branch trace ${activity.id} must not list exclusive lines.`)
          }
          if (branchLines.some((line) => !Number.isInteger(line) || line < 1 || line > activity.code.split('\n').length)) {
            issues.push(`Branch trace ${activity.id} lines must point to code lines.`)
          }
        }
        if (activity.kind === 'arrange-code') {
          const fragmentIds = activity.fragments.map((fragment) => fragment.id)
          if (new Set(fragmentIds).size !== fragmentIds.length) {
            issues.push(`Arrange-code activity ${activity.id} has duplicate fragment ids.`)
          }
          const validOrder = (order: string[]) => order.length === fragmentIds.length
            && new Set(order).size === fragmentIds.length
            && order.every((id) => fragmentIds.includes(id))
          if (!validOrder(activity.startingOrder) || !validOrder(activity.correctOrder)) {
            issues.push(`Arrange-code activity ${activity.id} must order every fragment exactly once.`)
          }
        }
        if (activity.kind === 'planning') {
          const fieldIds = activity.fields.map((field) => field.id)
          if (activity.fields.length === 0) {
            issues.push(`Planning activity ${activity.id} needs one or more fields.`)
          }
          if (activity.fields.some((field) => !field.id.trim() || !field.label.trim())) {
            issues.push(`Planning activity ${activity.id} needs an id and label for every field.`)
          }
          if (new Set(fieldIds).size !== fieldIds.length) {
            issues.push(`Planning activity ${activity.id} cannot repeat a field id.`)
          }
          if (!activity.fields.some((field) => field.required)) {
            issues.push(`Planning activity ${activity.id} needs at least one required field.`)
          }
          if (activity.fields.some((field) => field.rows !== undefined && (!Number.isInteger(field.rows) || field.rows < 1))) {
            issues.push(`Planning activity ${activity.id} field rows must be positive integers.`)
          }
        }
        if (activity.kind === 'file-workspace') {
          const paths = Object.keys(activity.starterFiles)
          if (paths.length === 0 || !paths.includes(activity.entryFile)) {
            issues.push(`File workspace ${activity.id} needs its entry file in the starter files.`)
          }
          if (!activity.entryFile.endsWith('.py') || !isSafeVirtualFilePath(activity.entryFile)) {
            issues.push(`File workspace ${activity.id} needs a safe Python entry-file path.`)
          }
          if (paths.some((path) => !isSafeVirtualFilePath(path))) {
            issues.push(`File workspace ${activity.id} contains an unsafe starter-file path.`)
          }
          if (paths.length > 40 || Object.values(activity.starterFiles).some((content) => typeof content !== 'string')) {
            issues.push(`File workspace ${activity.id} has an invalid number or type of starter files.`)
          }
          if (Object.keys(normalizeVirtualFiles(activity.starterFiles)).length !== paths.length) {
            issues.push(`File workspace ${activity.id} starter files exceed the safe workspace limits.`)
          }
        }
        if ('assessment' in activity && activity.assessment.kind === 'behavior') {
          if (activity.assessment.cases.some((testCase) => testCase.randomSeed !== undefined && !Number.isSafeInteger(testCase.randomSeed))) {
            issues.push(`Behavior assessment ${activity.id} random seeds must be safe integers.`)
          }
          for (const testCase of activity.assessment.cases) {
            if (testCase.workspaceSeed && activity.kind !== 'file-workspace') {
              issues.push(`Behavior assessment ${activity.id} can seed workspace files only for a file-workspace activity.`)
            }
            if (testCase.workspaceSeed && Object.keys(normalizeVirtualFiles(testCase.workspaceSeed)).length !== Object.keys(testCase.workspaceSeed).length) {
              issues.push(`Behavior assessment ${activity.id} has unsafe or oversized workspace seed files.`)
            }
            if (testCase.workspaceExpectations?.some((expectation) => !isSafeVirtualFilePath(expectation.path))) {
              issues.push(`Behavior assessment ${activity.id} has an unsafe workspace file expectation path.`)
            }
          }
          if (activity.assessment.fileRequirements) {
            if (activity.kind !== 'file-workspace') {
              issues.push(`Behavior assessment ${activity.id} can inspect project files only for a file-workspace activity.`)
            }
            if (activity.assessment.fileRequirements.some(({ path, requirements }) =>
              !isSafeVirtualFilePath(path) || !path.endsWith('.py') || requirements.length === 0,
            )) {
              issues.push(`Behavior assessment ${activity.id} file requirements need safe Python paths and at least one requirement.`)
            }
          }
        }
      }

      if (lesson.status === 'ready' && requiredActivities === 0) {
        issues.push(`Ready lesson ${lesson.id} needs at least one required activity.`)
      }
      if (lessonIndex > 0 && stage.lessons[lessonIndex - 1].order >= lesson.order) {
        issues.push(`Lessons in ${stage.id} must have increasing order values.`)
      }
    }
  }

  for (let index = 1; index < curriculumData.stages.length; index += 1) {
    if (curriculumData.stages[index - 1].order >= curriculumData.stages[index].order) {
      issues.push('Stages must be listed in increasing order.')
    }
  }

  return issues
}

export function assertValidCurriculum(curriculumData: Curriculum): void {
  const issues = validateCurriculum(curriculumData)
  if (issues.length > 0) throw new Error(`Invalid curriculum:\n${issues.join('\n')}`)
}

export interface StageProgress {
  completedCount: number
  availableCount: number
  totalCount: number
  upcomingCount: number
  isComplete: boolean
}

export function getStageProgress(stage: Stage, completedLessonIds: string[]): StageProgress {
  const availableLessons = stage.lessons.filter((lesson) => lesson.status === 'ready')
  const completedCount = availableLessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length
  return {
    completedCount,
    availableCount: availableLessons.length,
    totalCount: stage.lessons.length,
    upcomingCount: stage.lessons.length - availableLessons.length,
    isComplete: availableLessons.length > 0 && completedCount === availableLessons.length,
  }
}
