import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const inputModule: Module = {
  id: 'talking-to-user',
  order: 2,
  title: 'Talking to the user',
  description: 'Move from fixed programs to interactive ones.',
  lessons: [
    futureLesson('ask-a-question', 1, 'Asking a question', 'Use input() to ask the user something.', 'Ask the user a question with input().'),
    futureLesson('save-an-answer', 2, 'Saving the answer', 'Keep an answer in a variable.', 'Save what the user types in a variable.'),
    futureLesson('input-and-output', 3, 'Combining input and output', 'Use an answer in a response.', 'Ask a question and print a response.'),
    futureLesson('text-to-numbers', 4, 'Text to numbers', 'Use int() when text should become a number.', 'Convert a typed number with int().'),
    futureLesson('age-calculator', 5, 'A simple age calculator', 'Combine input, variables, and maths.', 'Build a small age or calculator program.'),
  ],
}
