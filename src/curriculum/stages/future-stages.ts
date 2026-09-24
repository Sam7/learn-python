import type { Stage } from '../types'

interface StageOutline {
  order: number
  title: string
  description: string
  lessons: string[]
}

const outlines: StageOutline[] = [
  {
    order: 10,
    title: 'Designing Programs',
    description: 'Plan from examples and build a program one useful slice at a time.',
    lessons: [
      'Understand through examples',
      'Inputs → process → outputs',
      'Describe the algorithm in ordinary language',
      'Break the problem apart',
      'Build one working slice',
      'Function contracts before implementation',
      'Choose representation before algorithm',
      'Recognise existing algorithm patterns',
      'Build from acceptance examples',
      'First mostly-independent project',
    ],
  },
  {
    order: 11,
    title: 'Connecting Programming to the Real World',
    description: 'Use libraries, files, and modules to build and explain larger programs.',
    lessons: [
      'Libraries are reusable capabilities',
      'Randomness project',
      'Programs can persist information',
      'Structured persistent data',
      'Expected failures',
      'Modules organise larger programs',
      'Guided final project',
      'Independent capstone',
    ],
  },
]

export const futureStages: Stage[] = outlines.map((outline) => ({
  id: `stage-${outline.order}`,
  order: outline.order,
  title: outline.title,
  description: outline.description,
  lessons: outline.lessons.map((title, index) => ({
    id: `stage-${outline.order}-lesson-${index + 1}`,
    order: index + 1,
    title,
    shortTitle: title.replace(/^Build: /, ''),
    summary: outline.description,
    learningGoal: title,
    steps: [],
    status: 'coming-soon',
  })),
}))
