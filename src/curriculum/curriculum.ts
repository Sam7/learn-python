import type { Curriculum, Lesson, Module } from './types'
import { collectionsModule } from './modules/collections'
import { decisionsModule } from './modules/decisions'
import { fundamentalsModule } from './modules/fundamentals'
import { functionsModule } from './modules/functions'
import { inputModule } from './modules/input'
import { loopsModule } from './modules/loops'
import { projectsModule } from './modules/projects'
import { typesModule } from './modules/types'

export const curriculum: Curriculum = {
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
