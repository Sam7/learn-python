import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const loopsModule: Module = {
  id: 'loops',
  order: 4,
  title: 'Repeating things',
  description: 'Repeat useful work without copying code.',
  lessons: [
    futureLesson('for-loops', 1, 'Repeating with for', 'Use for to repeat a small block.', 'Repeat a line with for.'),
    futureLesson('range', 2, 'range()', 'Generate a series of numbers.', 'Use range() to repeat a set number of times.'),
    futureLesson('counting-forwards', 3, 'Counting forwards', 'Use a loop to count.', 'Print a count from one number to another.'),
    futureLesson('loop-variables', 4, 'Variables inside loops', 'Use each loop value in your code.', 'Use a loop variable in output.'),
    futureLesson('while-loops', 5, 'Simple while', 'Repeat while a condition is true.', 'Write a small while loop.'),
    futureLesson('countdown', 6, 'A countdown', 'Combine loops into a small project.', 'Build a countdown.'),
  ],
}
