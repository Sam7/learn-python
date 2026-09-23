import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const decisionsModule: Module = {
  id: 'decisions',
  order: 4,
  title: 'Making decisions',
  description: 'Teach programs to choose what to do.',
  lessons: [
    futureLesson('compare-values', 1, 'Comparing values', 'Ask whether values are the same or different.', 'Compare two values.'),
    futureLesson('if', 2, 'if', 'Run code only when a condition is true.', 'Write a simple if statement.'),
    futureLesson('else', 3, 'else', 'Give a program another path.', 'Add an else branch.'),
    futureLesson('elif', 4, 'elif', 'Check another possibility.', 'Add an elif branch.'),
    futureLesson('logic-words', 5, 'and, or, not', 'Combine or change conditions.', 'Use a logic word in a decision.'),
    futureLesson('text-quiz', 6, 'A simple text quiz', 'Put decisions together in a mini-project.', 'Build a short text quiz.'),
  ],
}
