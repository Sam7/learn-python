import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const typesModule: Module = {
  id: 'types-and-numbers',
  order: 3,
  title: 'Types and numbers',
  description: 'Understand what kind of value Python is holding.',
  lessons: [
    futureLesson('text-or-number', 1, 'Text or number?', 'See the difference between text and a number.', 'Compare a value in quotation marks with a number.'),
    futureLesson('turn-text-into-number', 2, 'Turning text into a number', 'Use int() when typed text should become a whole number.', 'Convert a typed number with int().'),
    futureLesson('calculate-with-answers', 3, 'Calculating with answers', 'Use converted answers in simple maths.', 'Ask for numbers and calculate with them.'),
    futureLesson('age-calculator', 4, 'A simple age calculator', 'Combine input, variables, int(), and maths.', 'Build a small age calculator.'),
  ],
}
