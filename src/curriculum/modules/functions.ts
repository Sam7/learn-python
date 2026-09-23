import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const functionsModule: Module = {
  id: 'functions',
  order: 7,
  title: 'Functions',
  description: 'Give useful pieces of code a name.',
  lessons: [
    futureLesson('why-functions', 1, 'Why functions help', 'See why named pieces of code are useful.', 'Spot repeated work that could become a function.'),
    futureLesson('define-function', 2, 'Defining a function', 'Create a function with def.', 'Define a simple function.'),
    futureLesson('call-function', 3, 'Calling functions', 'Run a function when you need it.', 'Call your function.'),
    futureLesson('parameters', 4, 'Parameters', 'Give a function information to use.', 'Add a parameter.'),
    futureLesson('return-values', 5, 'Return values', 'Send an answer back from a function.', 'Return a value.'),
    futureLesson('several-functions', 6, 'Several functions', 'Use functions together in a project.', 'Build a small program from functions.'),
  ],
}
