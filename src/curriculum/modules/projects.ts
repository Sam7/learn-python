import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const projectsModule: Module = {
  id: 'projects',
  order: 8,
  title: 'Building something',
  description: 'Combine your Python skills in a project.',
  lessons: [
    futureLesson('text-adventure', 1, 'Text adventure', 'Make choices in a story.', 'Build a tiny text adventure.'),
    futureLesson('quiz-project', 2, 'Quiz project', 'Combine questions, choices, and scores.', 'Build a quiz game.'),
    futureLesson('guessing-game', 3, 'Number guessing game', 'Use input, decisions, and loops.', 'Build a number guessing game.'),
    futureLesson('calculator-project', 4, 'Simple calculator', 'Turn maths into a useful program.', 'Build a simple calculator.'),
    futureLesson('choose-your-story', 5, 'Choose-your-own-adventure', 'Bring the course together in a story.', 'Create a choose-your-own-adventure story.'),
  ],
}
