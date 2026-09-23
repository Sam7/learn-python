import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const fundamentalsModule: Module = {
  id: 'fundamentals',
  order: 1,
  title: 'Getting Python to do things',
  description: 'Start with the edit, run, and output cycle.',
  lessons: [
    {
      id: 'saying-something',
      order: 1,
      title: 'Hello Python',
      shortTitle: 'Hello Python',
      summary: 'Use print() to make Python display words.',
      explanation: {
        lead: 'The print() command makes Python show something on the screen.',
        notes: ['Text goes inside quotation marks.'],
      },
      exampleCode: 'print("Hello!")',
      starterCode: 'print("Hello!")',
      task: 'Change the code so Python prints Hello Python!',
      hints: [
        'Keep print() and change the words inside the quotation marks.',
        'The exact words are Hello Python!',
      ],
      validation: { kind: 'output', mode: 'exact', expected: ['Hello Python!'] },
      status: 'ready',
    },
    {
      id: 'your-own-text',
      order: 2,
      title: 'Printing your own text',
      shortTitle: 'Your own text',
      summary: 'Change the text Python displays.',
      explanation: {
        lead: 'Text inside quotation marks is called a string. You can change it to say anything you like.',
        notes: ['Two print() commands make two lines.'],
      },
      exampleCode: 'print("My name is Alex")\nprint("I like pizza")',
      starterCode: 'print("My name is Alex")\nprint("I like pizza")',
      task: 'Make Python print two lines: one with your name and one with something you like.',
      hints: [
        'Edit the words between the quotation marks.',
        'Leave one print() command on each line.',
      ],
      validation: {
        kind: 'output',
        mode: 'lines',
        lineCount: 2,
        reject: ['My name is Alex\nI like pizza'],
      },
      status: 'ready',
    },
    {
      id: 'numbers-and-maths',
      order: 3,
      title: 'Numbers and maths',
      shortTitle: 'Numbers and maths',
      summary: 'Python can calculate answers for you.',
      explanation: {
        lead: 'Python can work with numbers. Use +, -, *, and / to calculate.',
        notes: ['Numbers do not need quotation marks when you want Python to calculate them.'],
      },
      exampleCode: 'print(2 + 3)\nprint(10 * 4)',
      starterCode: 'print(2 + 3)',
      task: 'Make Python calculate and print the answer to 12 + 8.',
      hints: [
        'Put the calculation inside print().',
        'Your code should be print(12 + 8).',
      ],
      validation: { kind: 'output', mode: 'exact', expected: ['20'] },
      status: 'ready',
    },
    {
      id: 'variables',
      order: 4,
      title: 'Remembering things',
      shortTitle: 'Variables',
      summary: 'Give a value a name so Python can remember it.',
      explanation: {
        lead: 'A variable lets Python remember something. Give the value a name using =.',
        notes: ['Then use the name inside print() to display the value.'],
      },
      exampleCode: 'name = "Alex"\nprint(name)',
      starterCode: 'food = "pizza"\nprint(food)',
      task: 'Create a variable containing your favourite food, then print the variable.',
      hints: [
        'Choose a name, such as favourite_food.',
        'Put your favourite food in quotation marks, then print the name you chose.',
      ],
      validation: { kind: 'ast', requirement: 'text-variable', reject: ['pizza'] },
      status: 'ready',
    },
    futureLesson(
      'values-in-sentences',
      5,
      'Putting values into sentences',
      'Use a remembered value inside a sentence.',
      'Make a sentence that includes a value stored in a variable.',
    ),
  ],
}
