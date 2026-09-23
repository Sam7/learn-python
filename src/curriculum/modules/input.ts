import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const inputModule: Module = {
  id: 'talking-to-user',
  order: 2,
  title: 'Talking to the user',
  description: 'Move from fixed programs to interactive ones.',
  lessons: [
    {
      id: 'ask-a-question',
      order: 1,
      title: 'Asking a question',
      shortTitle: 'Ask a question',
      summary: 'Use input() to let a person answer your program.',
      explanation: {
        lead: 'The input() command pauses Python and lets someone type an answer. Save that answer in a variable so you can use it.',
        notes: ['The answer starts as text, just like words inside quotation marks.'],
      },
      exampleCode: 'name = input("What is your name? ")\nprint("Hello", name)',
      starterCode: 'name = input("What is your name? ")\nprint("Hello", name)',
      task: 'Ask for a name and print a greeting that uses the answer.',
      hints: [
        'Save input("What is your name? ") in a variable called name.',
        'Print Hello and the name variable together.',
      ],
      sampleInputs: ['Alex'],
      validation: {
        kind: 'behavior',
        requirement: 'uses-input',
        cases: [
          { inputs: ['Ada'], expectedOutput: ['Hello Ada'] },
          { inputs: ['Grace'], expectedOutput: ['Hello Grace'] },
        ],
      },
      status: 'ready',
    },
    futureLesson('save-an-answer', 2, 'Saving the answer', 'Keep an answer in a variable.', 'Save what the user types in a variable.'),
    futureLesson('input-and-output', 3, 'Combining input and output', 'Use an answer in a response.', 'Ask a question and print a response.'),
    futureLesson('text-to-numbers', 4, 'Text to numbers', 'Use int() when text should become a number.', 'Convert a typed number with int().'),
    futureLesson('age-calculator', 5, 'A simple age calculator', 'Combine input, variables, and maths.', 'Build a small age or calculator program.'),
  ],
}
