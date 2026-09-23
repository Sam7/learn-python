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
      learningGoal: 'Collect a text answer and use it in program output.',
      conceptTags: ['input', 'variables', 'output'],
      steps: [{
        id: 'ask-and-greet',
        content: [
          { type: 'paragraph', text: 'The input() command pauses Python and lets someone type an answer. Save that answer in a variable so you can use it.' },
          { type: 'callout', tone: 'note', text: 'The answer starts as text, just like words inside quotation marks.' },
          { type: 'example', code: 'name = input("What is your name? ")\nprint("Hello", name)' },
        ],
        activity: {
          id: 'greet-with-an-answer',
          kind: 'code',
          title: 'Try it yourself',
          prompt: 'Ask for a name and print a greeting that uses the answer.',
          required: true,
          starterCode: 'name = input("What is your name? ")\nprint("Hello", name)',
          sampleInputs: ['Alex'],
          hints: [
            'Save input("What is your name? ") in a variable called name.',
            'Print Hello and the name variable together.',
          ],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['Ada'], requiredInputs: [{ inputIndex: 0 }] },
              { inputs: ['Grace'], requiredInputs: [{ inputIndex: 0 }] },
            ],
          },
        },
      }],
      status: 'ready',
    },
    {
      id: 'ask-more-than-one-question',
      order: 2,
      title: 'Asking more than one question',
      shortTitle: 'More than one question',
      summary: 'Collect more than one answer in the same program.',
      learningGoal: 'Collect and use more than one independent answer.',
      conceptTags: ['input', 'variables', 'sequence'],
      steps: [{
        id: 'collect-two-answers',
        content: [
          { type: 'paragraph', text: 'You can call input() more than once. Give each answer its own variable so you can use both later.' },
          { type: 'callout', tone: 'note', text: 'Python runs the questions from top to bottom.' },
          { type: 'example', code: 'name = input("What is your name? ")\nfood = input("What food do you like? ")\nprint("Hello", name)\nprint("You like", food)' },
        ],
        activity: {
          id: 'use-two-answers',
          kind: 'code',
          title: 'Try it yourself',
          prompt: 'Ask for a name and a favourite food, then print both answers.',
          required: true,
          starterCode: 'name = input("What is your name? ")\nfood = input("What food do you like? ")\nprint("Hello", name)\nprint("You like", food)',
          sampleInputs: ['Alex', 'pizza'],
          hints: [
            'Use input() once for the name and once for the food.',
            'Store the answers in two variables, then print both variables.',
          ],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['Ada', 'noodles'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
              { inputs: ['Grace', 'apples'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }] },
            ],
          },
        },
      }],
      status: 'ready',
    },
    {
      id: 'reuse-an-answer',
      order: 3,
      title: 'Using an answer more than once',
      shortTitle: 'Reuse an answer',
      summary: 'Use one answer in more than one message.',
      learningGoal: 'Reuse one stored input value across multiple output statements.',
      conceptTags: ['input', 'variables', 'reuse'],
      steps: [{
        id: 'reuse-a-response',
        content: [
          { type: 'paragraph', text: 'A variable keeps an answer ready. You can use the same variable in several lines of your program.' },
          { type: 'callout', tone: 'tip', text: 'The person only needs to answer the question once.' },
          { type: 'example', code: 'name = input("What is your name? ")\nprint("Hello", name)\nprint("Nice to meet you,", name)' },
        ],
        activity: {
          id: 'print-an-answer-twice',
          kind: 'code',
          title: 'Try it yourself',
          prompt: 'Ask for a name, then use the answer in two different messages.',
          required: true,
          starterCode: 'name = input("What is your name? ")\nprint("Hello", name)\nprint("Nice to meet you,", name)',
          sampleInputs: ['Alex'],
          hints: [
            'Store the answer in a variable.',
            'Write two print() lines that both use the variable.',
          ],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['Ada'], requiredInputs: [{ inputIndex: 0, minimumOccurrences: 2 }] },
              { inputs: ['Grace'], requiredInputs: [{ inputIndex: 0, minimumOccurrences: 2 }] },
            ],
          },
        },
      }],
      status: 'ready',
    },
    {
      id: 'get-to-know-you',
      order: 4,
      title: 'Get to know you',
      shortTitle: 'Get to know you',
      summary: 'Combine text answers in a small interactive program.',
      learningGoal: 'Build an interactive program that uses several independent answers.',
      conceptTags: ['input', 'variables', 'composition'],
      steps: [{
        id: 'make-an-introduction',
        content: [
          { type: 'paragraph', text: 'Now you can ask several questions, remember the answers, and use them to make a response that is yours.' },
          { type: 'callout', tone: 'note', text: 'This project uses text answers only. Numbers come in a later chapter.' },
          { type: 'example', code: 'name = input("What is your name? ")\nhobby = input("What do you like doing? ")\nfood = input("What food do you like? ")\nprint("Nice to meet you,", name)\nprint("You like", hobby, "and", food)' },
        ],
        activity: {
          id: 'create-an-introduction',
          kind: 'code',
          title: 'Try it yourself',
          prompt: 'Ask three questions and print a short introduction that uses every answer.',
          required: true,
          starterCode: 'name = input("What is your name? ")\nhobby = input("What do you like doing? ")\nfood = input("What food do you like? ")\nprint("Nice to meet you,", name)\nprint("You like", hobby, "and", food)',
          sampleInputs: ['Alex', 'drawing', 'pizza'],
          hints: [
            'Choose three things to ask, such as a name, hobby, and favourite food.',
            'Use each variable in at least one print() line.',
          ],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['Ada', 'reading', 'noodles'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }, { inputIndex: 2 }] },
              { inputs: ['Grace', 'music', 'apples'], requiredInputs: [{ inputIndex: 0 }, { inputIndex: 1 }, { inputIndex: 2 }] },
            ],
          },
        },
      }],
      status: 'ready',
    },
  ],
}
