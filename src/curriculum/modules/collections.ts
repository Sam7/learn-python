import type { Module } from '../types'
import { futureLesson } from './future-lesson'

export const collectionsModule: Module = {
  id: 'collections',
  order: 5,
  title: 'Working with collections',
  description: 'Keep groups of values together and work with them.',
  lessons: [
    futureLesson('create-lists', 1, 'Creating lists', 'Put several values in one list.', 'Create a list of favourite things.'),
    futureLesson('read-list-items', 2, 'Reading list items', 'Choose an item from a list.', 'Read one item from a list.'),
    futureLesson('add-list-items', 3, 'Adding items', 'Add a new value to a list.', 'Add an item to a list.'),
    futureLesson('loop-through-lists', 4, 'Looping through lists', 'Visit each item in a list.', 'Print every item in a list.'),
    futureLesson('check-list-items', 5, 'Checking for an item', 'Find out whether a list contains something.', 'Check whether an item exists.'),
    futureLesson('favourite-things', 6, 'A favourite-things list', 'Use lists in a small project.', 'Build a favourite-things list.'),
  ],
}
