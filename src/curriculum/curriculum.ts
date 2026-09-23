import type { Curriculum, LearningActivity, Lesson, LessonStep, Module } from './types'
import { collectionsModule } from './modules/collections'
import { decisionsModule } from './modules/decisions'
import { fundamentalsModule } from './modules/fundamentals'
import { functionsModule } from './modules/functions'
import { inputModule } from './modules/input'
import { loopsModule } from './modules/loops'
import { projectsModule } from './modules/projects'
import { typesModule } from './modules/types'

const curriculumDefinition: Curriculum = {
  title: 'Python Steps',
  modules: [
    fundamentalsModule,
    inputModule,
    typesModule,
    decisionsModule,
    loopsModule,
    collectionsModule,
    functionsModule,
    projectsModule,
  ],
}

export function orderCurriculum(definition: Curriculum): Curriculum {
  return {
    ...definition,
    modules: [...definition.modules]
      .sort((left, right) => left.order - right.order)
      .map((module) => ({
        ...module,
        lessons: [...module.lessons].sort((left, right) => left.order - right.order),
      })),
  }
}

export const curriculum = orderCurriculum(curriculumDefinition)

assertValidCurriculum(curriculum)

export const modules = curriculum.modules
export const allLessons = modules.flatMap((module) => module.lessons)
export const readyLessons = allLessons.filter((lesson) => lesson.status === 'ready')
export const lessonIds = allLessons.map((lesson) => lesson.id)

export function getLessonById(id: string): Lesson | undefined {
  return allLessons.find((lesson) => lesson.id === id)
}

export function getModuleById(id: string): Module | undefined {
  return modules.find((module) => module.id === id)
}

export function getModuleForLesson(lessonId: string): Module | undefined {
  return modules.find((module) => module.lessons.some((lesson) => lesson.id === lessonId))
}

export function getLessonLocation(lessonId: string) {
  const module = getModuleForLesson(lessonId)
  const lesson = module?.lessons.find((item) => item.id === lessonId)
  return module && lesson ? { module, lesson } : undefined
}

export function getPreviousLesson(lessonId: string): Lesson | undefined {
  const currentIndex = readyLessons.findIndex((lesson) => lesson.id === lessonId)
  return currentIndex > 0 ? readyLessons[currentIndex - 1] : undefined
}

export function getNextLesson(lessonId: string): Lesson | undefined {
  const currentIndex = readyLessons.findIndex((lesson) => lesson.id === lessonId)
  return currentIndex >= 0 ? readyLessons[currentIndex + 1] : undefined
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
  const moduleIds = new Set<string>()
  const lessonIdsSeen = new Set<string>()
  const activityIds = new Set<string>()
  const moduleOrderValues = new Set<number>()

  for (const [moduleIndex, module] of curriculumData.modules.entries()) {
    if (!module.id.trim()) issues.push(`Module at position ${moduleIndex + 1} has no id.`)
    if (moduleIds.has(module.id)) issues.push(`Duplicate module id: ${module.id}.`)
    moduleIds.add(module.id)
    if (!Number.isInteger(module.order) || module.order <= 0) issues.push(`Module ${module.id} must have a positive integer order.`)
    if (moduleOrderValues.has(module.order)) issues.push(`Duplicate module order: ${module.order}.`)
    moduleOrderValues.add(module.order)

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      if (!lesson.id.trim()) issues.push(`A lesson in ${module.id} has no id.`)
      if (lessonIdsSeen.has(lesson.id)) issues.push(`Duplicate lesson id: ${lesson.id}.`)
      lessonIdsSeen.add(lesson.id)
      if (lesson.order <= 0) issues.push(`Lesson ${lesson.id} must have a positive order.`)
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
      }

      if (lesson.status === 'ready' && requiredActivities === 0) {
        issues.push(`Ready lesson ${lesson.id} needs at least one required activity.`)
      }
      if (lessonIndex > 0 && module.lessons[lessonIndex - 1].order >= lesson.order) {
        issues.push(`Lessons in ${module.id} must have increasing order values.`)
      }
    }
  }

  for (let index = 1; index < curriculumData.modules.length; index += 1) {
    if (curriculumData.modules[index - 1].order >= curriculumData.modules[index].order) {
      issues.push('Modules must be listed in increasing order.')
    }
  }

  return issues
}

export function assertValidCurriculum(curriculumData: Curriculum): void {
  const issues = validateCurriculum(curriculumData)
  if (issues.length > 0) throw new Error(`Invalid curriculum:\n${issues.join('\n')}`)
}

export interface ModuleProgress {
  completedCount: number
  availableCount: number
  totalCount: number
  upcomingCount: number
  isComplete: boolean
}

export function getModuleProgress(module: Module, completedLessonIds: string[]): ModuleProgress {
  const availableLessons = module.lessons.filter((lesson) => lesson.status === 'ready')
  const completedCount = availableLessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length
  return {
    completedCount,
    availableCount: availableLessons.length,
    totalCount: module.lessons.length,
    upcomingCount: module.lessons.length - availableLessons.length,
    isComplete: availableLessons.length > 0 && completedCount === availableLessons.length,
  }
}
