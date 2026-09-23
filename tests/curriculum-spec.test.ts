import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { allLessons, curriculum, getLessonLocation } from '../src/curriculum/curriculum'

const specification = readFileSync(resolve(process.cwd(), 'docs/curriculum-01.md'), 'utf8')

describe('curriculum-01 specification alignment', () => {
  it('has the same ordered stage names as the source curriculum', () => {
    const specifiedStages = [...specification.matchAll(/^# STAGE (\d+) — (.+)$/gm)]
      .map(([, order, title]) => [Number(order), title.trim()])

    expect(curriculum.stages.map(({ order, title }) => [order, title])).toEqual(specifiedStages)
  })

  it('represents every micro-lesson title and order from the source curriculum', () => {
    const specifiedLessons = [...specification.matchAll(/^### (\d+)\.(\d+) — (.+)$/gm)]
      .map(([, stageOrder, lessonOrder, title]) => [
        Number(stageOrder),
        Number(lessonOrder),
        title.replace(/`/g, '').trim(),
      ])
    const curriculumLessons = allLessons.map((lesson) => [
      getLessonLocation(lesson.id)!.stage.order,
      lesson.order,
      lesson.title,
    ])

    expect(specifiedLessons).toHaveLength(109)
    expect(curriculumLessons).toEqual(specifiedLessons)
  })
})
