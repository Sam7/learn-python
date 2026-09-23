import type { Stage } from '../types'

interface StageOutline {
  order: number
  title: string
  description: string
  lessons: string[]
}

const outlines: StageOutline[] = [
  {
    order: 4,
    title: 'Repetition and Time',
    description: 'Repeat instructions and watch values change over time.',
    lessons: [
      'Discover the repetition problem',
      'Repeat something a fixed number of times',
      'The loop variable changes',
      'Use the changing value',
      'State can survive between iterations',
      'Decisions inside repetition',
      'Repeat while something remains true',
      'The infinite loop',
      'Repeat until the user succeeds',
      'Build: launch sequence',
    ],
  },
  {
    order: 5,
    title: 'Collections',
    description: 'Keep related values together and work with them as a group.',
    lessons: [
      'One name, many values',
      'Items have positions',
      'Boundaries again',
      'Do something for every item',
      'Combine collections with decisions',
      'Ask questions about collections',
      'Collections can change',
      'Strings are collections too',
      'Build: analyse some scores',
    ],
  },
  {
    order: 6,
    title: 'Functions and Abstraction',
    description: 'Give actions names, pass in information, and produce results.',
    lessons: [
      'You have been using functions all along',
      'Give an action a name',
      'Give a function information',
      'Multiple inputs',
      'Producing a value',
      'return is not print',
      'Functions can be combined',
      'Local state',
      'Functions as contracts',
      'Build: mini maths toolkit',
    ],
  },
  {
    order: 7,
    title: 'Reusable Algorithmic Patterns',
    description: 'Recognise useful shapes for totals, counts, searches, and more.',
    lessons: [
      'Total / accumulate',
      'Count',
      'Average combines patterns',
      'Search',
      'Best so far',
      'Transform',
      'Filter',
      'Validate / repeat until acceptable',
      'Recognise the pattern',
      'Pattern transfer',
    ],
  },
  {
    order: 8,
    title: 'Representing Information',
    description: 'Choose useful structures for information about one thing or many.',
    lessons: [
      'The problem with parallel variables',
      'A record with named fields',
      'Update a record',
      'Many structured things',
      'Query structured data',
      'Nested information',
      'Choose the representation',
      'Build: leaderboard',
    ],
  },
  {
    order: 9,
    title: 'Debugging and Correctness',
    description: 'Use evidence, examples, and tests to find and fix problems.',
    lessons: [
      'Three fundamentally different failures',
      'Read the error message',
      'Expected versus actual',
      'Trace before changing',
      'Form a hypothesis',
      'Make the problem smaller',
      'Assertions',
      'Edge cases',
      'Fix one thing, test everything',
      'Refactor without changing behaviour',
    ],
  },
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
