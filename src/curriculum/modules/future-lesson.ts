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
    steps: [{
      id: `${id}-planned`,
      content: [
        { type: 'paragraph', text: 'This lesson is planned for a future Python Steps update.' },
        { type: 'callout', tone: 'note', text: task },
      ],
    }],
    status: 'coming-soon',
  }
}
