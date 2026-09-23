import type { Lesson } from '../types'

export function futureLesson(
  id: string,
  order: number,
  title: string,
  summary: string,
  task: string,
): Lesson {
  return {
    id,
    order,
    title,
    shortTitle: title,
    summary,
    explanation: { lead: 'This lesson is planned for a future Python Steps update.' },
    starterCode: '# This lesson is coming soon.',
    task,
    hints: [],
    validation: { kind: 'unavailable' },
    status: 'coming-soon',
  }
}
