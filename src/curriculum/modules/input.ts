import type { Module } from '../types'

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
          { inputs: ['Ada'], requiredInputs: [{ inputIndex: 0 }] },
          { inputs: ['Grace'], requiredInputs: [{ inputIndex: 0 }] },
        ],
      },
      status: 'ready',
    },
    {
      id: 'ask-more-than-one-question',
      order: 2,
      title: 'Asking more than one question',
      shortTitle: 'More than one question',
      summary: 'Collect more than one answer in the same program.',
      explanation: {
        lead: 'You can call input() more than once. Give each answer its own variable so you can use both later.',
        notes: ['Python runs the questions from top to bottom.'],
      },
      exampleCode: 'name = input("What is your name? ")\nfood = input("What food do you like? ")\nprint("Hello", name)\nprint("You like", food)',
      starterCode: 'name = input("What is your name? ")\nfood = input("What food do you like? ")\nprint("Hello", name)\nprint("You like", food)',
      task: 'Ask for a name and a favourite food, then print both answers.',
      hints: [
        'Use input() once for the name and once for the food.',
        'Store the answers in two variables, then print both variables.',
      ],
      sampleInputs: ['Alex', 'pizza'],
      validation: {
        kind: 'behavior',
        requirement: 'uses-multiple-inputs',
        cases: [
          { inputs: ['Ada', 'noodles'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
          { inputs: ['Grace', 'apples'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
        ],
      },
      status: 'ready',
    },
    {
      id: 'reuse-an-answer',
      order: 3,
      title: 'Using an answer more than once',
      shortTitle: 'Reuse an answer',
      summary: 'Use one answer in more than one message.',
      explanation: {
        lead: 'A variable keeps an answer ready. You can use the same variable in several lines of your program.',
        notes: ['The person only needs to answer the question once.'],
      },
      exampleCode: 'name = input("What is your name? ")\nprint("Hello", name)\nprint("Nice to meet you,", name)',
      starterCode: 'name = input("What is your name? ")\nprint("Hello", name)\nprint("Nice to meet you,", name)',
      task: 'Ask for a name, then use the answer in two different messages.',
      hints: [
        'Store the answer in a variable.',
        'Write two print() lines that both use the variable.',
      ],
      sampleInputs: ['Alex'],
      validation: {
        kind: 'behavior',
        requirement: 'reuses-input',
        cases: [
          { inputs: ['Ada'], requiredInputs: [{ inputIndex: 0, minimumOccurrences: 2 }] },
          { inputs: ['Grace'], requiredInputs: [{ inputIndex: 0, minimumOccurrences: 2 }] },
        ],
      },
      status: 'ready',
    },
    {
      id: 'get-to-know-you',
      order: 4,
      title: 'Get to know you',
      shortTitle: 'Get to know you',
      summary: 'Combine text answers in a small interactive program.',
      explanation: {
        lead: 'Now you can ask several questions, remember the answers, and use them to make a response that is yours.',
        notes: ['This project uses text answers only. Numbers come in a later chapter.'],
      },
      exampleCode: 'name = input("What is your name? ")\nhobby = input("What do you like doing? ")\nfood = input("What food do you like? ")\nprint("Nice to meet you,", name)\nprint("You like", hobby, "and", food)',
      starterCode: 'name = input("What is your name? ")\nhobby = input("What do you like doing? ")\nfood = input("What food do you like? ")\nprint("Nice to meet you,", name)\nprint("You like", hobby, "and", food)',
      task: 'Ask three questions and print a short introduction that uses every answer.',
      hints: [
        'Choose three things to ask, such as a name, hobby, and favourite food.',
        'Use each variable in at least one print() line.',
      ],
      sampleInputs: ['Alex', 'drawing', 'pizza'],
      validation: {
        kind: 'behavior',
        requirement: 'uses-multiple-inputs',
        cases: [
          { inputs: ['Ada', 'reading', 'noodles'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }, { inputIndex: 2 }] },
          { inputs: ['Grace', 'music', 'apples'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }, { inputIndex: 2 }] },
        ],
      },
      status: 'ready',
    },
  ],
}
