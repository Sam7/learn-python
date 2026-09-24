import type { Stage } from '../types'

const scoreStarter = `answer = input("What is 3 + 4? ")
score = 0
print(f"Score: {score}")`

const largestStarter = `first = int(input("First number: "))
second = int(input("Second number: "))
third = int(input("Third number: "))
numbers = [first, second, third]
largest = 0
for number in numbers:
    if number > largest:
        largest = number
print(largest)`

const treasureSpec = [
  'Ask for the player’s name once. Start with 0 points.',
  'Keep asking for cave, river, or done until the player chooses done.',
  'A cave adds 2 points and prints “Cave: 2 points”. A river adds 1 point and prints “River: 1 point”.',
  'When the player chooses done, stop the loop and print “NAME: SCORE points”.',
]

export const stageTen: Stage = {
  id: 'stage-10',
  order: 10,
  title: 'Designing Programs',
  description: 'Plan from examples and build a program one useful slice at a time.',
  lessons: [
    {
      id: 'stage-10-lesson-1',
      order: 1,
      title: 'Understand through examples',
      shortTitle: 'Examples reveal rules',
      summary: 'A few carefully chosen examples make the rule easier to see.',
      learningGoal: 'Use examples, especially boundary examples, to understand a problem before coding.',
      conceptTags: ['program-design', 'examples', 'boundary'],
      steps: [{
        id: 'notice-the-delivery-rule',
        content: [
          { type: 'paragraph', text: 'Delivery costs $5, except orders of $50 or more, which are free.' },
          { type: 'list', items: ['Order $20 → delivery $5', 'Order $49 → delivery $5', 'Order $50 → delivery $0', 'Order $80 → delivery $0'] },
          { type: 'callout', tone: 'tip', text: 'The examples $49 and $50 sit on either side of the important boundary.' },
        ],
        activity: {
          id: 'spot-free-delivery-boundary',
          kind: 'choice',
          title: 'Check the boundary',
          prompt: 'Which example shows the exact order total where delivery becomes free?',
          required: true,
          options: [
            { id: 'twenty', text: '$20' },
            { id: 'forty-nine', text: '$49' },
            { id: 'fifty', text: '$50' },
            { id: 'eighty', text: '$80' },
          ],
          correctOptionId: 'fifty',
          correctFeedback: 'Yes — $50 is the boundary. The examples just below and at the boundary make that rule visible.',
          incorrectFeedback: 'Compare $49, which still costs $5, with $50, which costs $0.',
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-2',
      order: 2,
      title: 'Inputs → process → outputs',
      shortTitle: 'Plan the information',
      summary: 'Before coding, name what goes in, what the program does, and what comes out.',
      learningGoal: 'Separate a problem into its inputs, process, and outputs.',
      conceptTags: ['program-design', 'inputs', 'process', 'outputs'],
      steps: [{
        id: 'plan-delivery-cost',
        content: [
          { type: 'paragraph', text: 'Before opening the editor, ask three small questions about the delivery problem.' },
          { type: 'list', items: ['Input: What information does the program receive?', 'Process: What rule does it apply?', 'Output: What answer should it show?'] },
          { type: 'callout', tone: 'note', text: 'Your wording is yours. Python Steps checks that you filled the plan, not whether your first idea is “correct”.' },
        ],
        activity: {
          id: 'plan-input-process-output',
          kind: 'planning',
          title: 'Make a small plan',
          prompt: 'Plan the delivery-cost program in your own words.',
          required: true,
          submitLabel: 'Save plan',
          fields: [
            { id: 'input', label: 'Input', prompt: 'What information will the program receive?', placeholder: 'For example: the order total', required: true, rows: 2 },
            { id: 'process', label: 'Process', prompt: 'What decision or calculation must it make?', placeholder: 'Describe the rule in your words', required: true, rows: 3 },
            { id: 'output', label: 'Output', prompt: 'What should the program show?', placeholder: 'Name the result the person needs', required: true, rows: 2 },
          ],
          hints: ['Think about the example table: which value changes, what rule uses it, and what result appears?'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-3',
      order: 3,
      title: 'Describe the algorithm in ordinary language',
      shortTitle: 'Write the steps first',
      summary: 'Describe the instructions before translating them into Python.',
      learningGoal: 'Express a decision algorithm as ordered plain-language steps.',
      conceptTags: ['program-design', 'algorithm', 'sequence'],
      steps: [{
        id: 'describe-delivery-algorithm',
        content: [
          { type: 'paragraph', text: 'An algorithm is a set of steps that solves a problem. It can be written in everyday words before it becomes code.' },
          { type: 'example', code: 'Ask for the order total.\nIf it is at least 50, delivery costs 0.\nOtherwise, delivery costs 5.\nShow the delivery cost.', caption: 'An algorithm, before Python syntax.' },
        ],
        activity: {
          id: 'write-delivery-steps',
          kind: 'planning',
          title: 'Write your steps',
          prompt: 'Describe the delivery program from its first action to its final result. Use ordinary words, not Python code.',
          required: true,
          fields: [
            { id: 'first', label: 'First', prompt: 'What happens at the start?', required: true, rows: 2 },
            { id: 'decision', label: 'Decision', prompt: 'What should the program compare or decide?', required: true, rows: 2 },
            { id: 'when-true', label: 'When the rule is true', prompt: 'What happens in this case?', required: true, rows: 2 },
            { id: 'when-false', label: 'Otherwise', prompt: 'What happens in the other case?', required: true, rows: 2 },
            { id: 'finish', label: 'Finish', prompt: 'What result should be shown?', required: true, rows: 2 },
          ],
          hints: ['Try one short instruction per section. You can use the examples from the previous step as evidence.'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-4',
      order: 4,
      title: 'Break the problem apart',
      shortTitle: 'Find smaller jobs',
      summary: 'A bigger program becomes easier to approach when you name its smaller jobs.',
      learningGoal: 'Decompose a quiz program into responsibilities before deciding how to implement them.',
      conceptTags: ['program-design', 'decomposition', 'responsibility'],
      steps: [{
        id: 'list-quiz-jobs',
        content: [
          { type: 'paragraph', text: 'A quiz is one project, but it has several smaller jobs. Naming jobs is useful even before you choose variables or functions.' },
          { type: 'list', items: ['Ask a question', 'Check the answer', 'Update the score', 'Show the final result'] },
          { type: 'callout', tone: 'tip', text: 'First decide what jobs exist. You can decide later whether any job should become a function.' },
        ],
        activity: {
          id: 'decompose-a-quiz',
          kind: 'planning',
          title: 'Sketch the smaller jobs',
          prompt: 'List the smaller jobs you think a quiz needs. Add, remove, or rename ideas to suit your design.',
          required: true,
          fields: [{
            id: 'jobs',
            label: 'Jobs in the quiz',
            prompt: 'Write one job per line. This is your plan, not a right-or-wrong quiz.',
            placeholder: 'Ask a question…\nCheck the answer…',
            required: true,
            rows: 6,
          }],
          hints: ['Think about what happens before, during, and after a person answers.'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-5',
      order: 5,
      title: 'Build one working slice',
      shortTitle: 'One question at a time',
      summary: 'Build a small working part, then add the next part instead of writing the whole project at once.',
      learningGoal: 'Add answer checking and a score to one working quiz question.',
      conceptTags: ['program-design', 'incremental-development', 'testing'],
      steps: [{
        id: 'complete-one-quiz-question',
        content: [
          { type: 'paragraph', text: 'Start with one question that works. Then add answer checking and a score. A small working slice is easier to test than a whole quiz.' },
          { type: 'example', code: 'answer = input("What is 3 + 4? ")\nif answer == "7":\n    print("Correct!")\nelse:\n    print("Try again.")', caption: 'One question, with two possible outcomes.' },
        ],
        activity: {
          id: 'add-checking-and-score',
          kind: 'code',
          title: 'Finish this first slice',
          prompt: 'Add an if/else so answer "7" prints Correct! and any other answer prints Try again. Then set score to 1 or 0 and print Score: followed by the score.',
          required: true,
          starterCode: scoreStarter,
          sampleInputs: ['7'],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['7'], output: { mode: 'exact', lines: ['Correct!', 'Score: 1'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
              { inputs: ['8'], output: { mode: 'exact', lines: ['Try again.', 'Score: 0'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
            ],
            requirements: ['if-else'],
          },
          hints: ['The starter already asks the question and sets score to 0. Add the two answer paths before the final print.', 'Inside the if branch set score to 1 and print Correct!; inside else print Try again.'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-6',
      order: 6,
      title: 'Function contracts before implementation',
      shortTitle: 'Examples describe a function',
      summary: 'Examples can describe what a function promises before you inspect how it works.',
      learningGoal: 'Use concrete function examples as a small contract for expected behavior.',
      conceptTags: ['program-design', 'function-contract', 'examples'],
      steps: [{
        id: 'predict-answer-checker-contract',
        content: [
          { type: 'paragraph', text: 'A function contract describes what goes in and what should come back. These examples say that matching answers return True and different answers return False.' },
          { type: 'list', items: ['check_answer("Paris", "Paris") → True', 'check_answer("Paris", "London") → False'] },
          { type: 'callout', tone: 'note', text: 'The function already works. Your task is to predict its results, not edit the program.' },
        ],
        activity: {
          id: 'predict-answer-checker-contract',
          kind: 'predict-output',
          title: 'Predict both results',
          prompt: 'Write the two output lines, then run the example to compare your prediction.',
          required: true,
          code: 'def check_answer(expected, actual):\n    return expected == actual\n\nprint(check_answer("Paris", "Paris"))\nprint(check_answer("Paris", "London"))',
          expectedOutput: ['True', 'False'],
          hints: ['The first pair matches exactly. The second pair is different. Python displays Boolean values as True and False.'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-7',
      order: 7,
      title: 'Choose representation before algorithm',
      shortTitle: 'Pick a useful structure',
      summary: 'The way information is organised affects how easy it is to grow and use a program.',
      learningGoal: 'Choose a representation that can grow to hold several question-and-answer pairs.',
      conceptTags: ['program-design', 'representation', 'collections'],
      steps: [{
        id: 'choose-question-representation',
        content: [
          { type: 'paragraph', text: 'One question can use two names. A quiz with many questions needs a representation that can grow without adding another pair of variables each time.' },
          { type: 'example', code: 'question1 = "Capital of France?"\nanswer1 = "Paris"\n\nquestions = [\n    {"question": "Capital of France?", "answer": "Paris"}\n]', caption: 'Two possible ways to keep quiz information.' },
        ],
        activity: {
          id: 'choose-a-growing-question-collection',
          kind: 'choice',
          title: 'Choose for a growing quiz',
          prompt: 'Which representation is easier to extend from one question to many?',
          required: true,
          options: [
            { id: 'separate-names', text: 'Add question2, answer2, then question3 and answer3…' },
            { id: 'records', text: 'Keep question records together in a list' },
            { id: 'one-long-string', text: 'Put every question and answer into one unlabeled string' },
          ],
          correctOptionId: 'records',
          correctFeedback: 'Right — a list of records can grow while keeping each question with its answer.',
          incorrectFeedback: 'Look for a structure that can grow and keeps each answer connected to its question.',
        },
      }, {
        id: 'explain-the-choice-for-yourself',
        content: [{ type: 'paragraph', text: 'If you want, note what made this representation useful for your project. This thought is saved for you and never graded.' }],
        activity: {
          id: 'reflect-on-growing-representation',
          kind: 'reflection',
          title: 'A note for yourself',
          prompt: 'What might be easier when questions and answers stay together?',
          required: false,
          placeholder: 'Write a thought, or leave this blank and continue.',
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-8',
      order: 8,
      title: 'Recognise existing algorithm patterns',
      shortTitle: 'Spot a familiar shape',
      summary: 'A new problem may have the same underlying shape as an algorithm you already know.',
      learningGoal: 'Recognise counting matching items as the count-if pattern.',
      conceptTags: ['program-design', 'algorithm-pattern', 'count-if'],
      steps: [{
        id: 'recognise-the-quiz-score-pattern',
        content: [
          { type: 'paragraph', text: 'A quiz can look like a new problem, but “how many answers were correct?” has a familiar shape.' },
          { type: 'example', code: 'correct = 0\nfor answer in answers:\n    if answer == expected:\n        correct = correct + 1', caption: 'Count one item only when it passes a test.' },
          { type: 'list', items: ['Start a count at 0.', 'Look at each answer.', 'Add 1 only when it is correct.'] },
        ],
        activity: {
          id: 'name-the-quiz-count-pattern',
          kind: 'choice',
          title: 'Name the pattern',
          prompt: 'Which familiar algorithm shape counts only the answers that pass a condition?',
          required: true,
          options: [
            { id: 'best-so-far', text: 'Best-so-far: keep the strongest value seen' },
            { id: 'count-if', text: 'Count-if: increase a count when an item passes' },
            { id: 'transform', text: 'Transform: make one new value for each item' },
          ],
          correctOptionId: 'count-if',
          correctFeedback: 'Yes — count-if is the same shape you used for other collections.',
          incorrectFeedback: 'Look at the count changing only inside the condition that checks an answer.',
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-9',
      order: 9,
      title: 'Build from acceptance examples',
      shortTitle: 'Test the edge examples',
      summary: 'Expected examples make a project requirement concrete and expose important edge cases.',
      learningGoal: 'Use positive and negative examples to repair a largest-number algorithm.',
      conceptTags: ['program-design', 'acceptance-examples', 'edge-cases'],
      steps: [{
        id: 'repair-the-largest-number-example',
        content: [
          { type: 'paragraph', text: 'A requirement is stronger when it says what should happen for concrete inputs. These examples include an important negative-only case.' },
          { type: 'list', items: ['Inputs: 3, 8, 5 → expected largest: 8', 'Inputs: −4, −2, −9 → expected largest: −2'] },
          { type: 'callout', tone: 'tip', text: 'The starter passes the positive example but fails the negative one. Use that evidence to find the faulty assumption.' },
        ],
        activity: {
          id: 'repair-largest-for-negative-values',
          kind: 'code',
          title: 'Make both examples pass',
          prompt: 'Change how largest is first set so the loop works for both positive and negative numbers. Keep the loop and run the acceptance examples.',
          required: true,
          starterCode: largestStarter,
          sampleInputs: ['3', '8', '5'],
          assessment: {
            kind: 'behavior',
            cases: [
              { inputs: ['3', '8', '5'], output: { mode: 'exact', lines: ['8'] }, requiredInputs: [0, 1, 2].map((inputIndex) => ({ inputIndex, mustAppearInOutput: false })) },
              { inputs: ['-4', '-2', '-9'], output: { mode: 'exact', lines: ['-2'] }, requiredInputs: [0, 1, 2].map((inputIndex) => ({ inputIndex, mustAppearInOutput: false })) },
            ],
          },
          hints: ['The positive example cannot show whether 0 is a safe starting value. Look at the all-negative example.', 'Start largest with one of the numbers instead of assuming every number will be above 0.'],
        },
      }],
      status: 'ready',
    },
    {
      id: 'stage-10-lesson-10',
      order: 10,
      title: 'First mostly-independent project',
      shortTitle: 'Treasure Explorer',
      summary: 'Use a short specification and acceptance examples to plan and build a small interactive program.',
      learningGoal: 'Independently combine input, decisions, repetition, changing state, and output in a small project.',
      conceptTags: ['program-design', 'project', 'integration'],
      steps: [{
        id: 'build-treasure-explorer',
        content: [
          { type: 'paragraph', text: 'You have the specification and examples, but no implementation to copy. Plan your steps first, then build one working version.' },
          { type: 'list', items: treasureSpec },
          { type: 'example', code: 'Inputs: Sam, cave, river, done\nOutputs include:\nCave: 2 points\nRiver: 1 point\nSam: 3 points', caption: 'Acceptance example 1' },
          { type: 'example', code: 'Inputs: Ari, river, cave, cave, done\nOutputs include:\nRiver: 1 point\nCave: 2 points\nAri: 5 points', caption: 'Acceptance example 2' },
          { type: 'callout', tone: 'note', text: 'There is no starter implementation. These examples are checks for behavior, not a template to copy.' },
        ],
        activity: {
          id: 'create-treasure-explorer',
          kind: 'code',
          title: 'Build your small project',
          prompt: 'Write Treasure Explorer from the specification. It must work for both acceptance examples, not just one fixed player or path.',
          required: true,
          starterCode: '',
          sampleInputs: ['Sam', 'cave', 'river', 'done'],
          assessment: {
            kind: 'behavior',
            cases: [
              {
                inputs: ['Sam', 'cave', 'river', 'done'],
                output: { mode: 'contains', values: ['Cave: 2 points', 'River: 1 point', 'Sam: 3 points'] },
                requiredInputs: [0, 1, 2, 3].map((inputIndex) => ({ inputIndex, mustAppearInOutput: false })),
              },
              {
                inputs: ['Ari', 'river', 'cave', 'cave', 'done'],
                output: { mode: 'contains', values: ['River: 1 point', 'Cave: 2 points', 'Ari: 5 points'] },
                requiredInputs: [0, 1, 2, 3, 4].map((inputIndex) => ({ inputIndex, mustAppearInOutput: false })),
              },
            ],
            requirements: ['while-loop', 'conditional'],
          },
          hints: [
            'Start with the player name and points. Then make one choice work before adding the next choice.',
            'Put the choice prompt inside a loop. Change points for cave or river, and use done to leave the loop.',
            'After the loop, print the player name and final points. Try both examples, including repeated choices.',
          ],
        },
      }],
      status: 'ready',
    },
  ],
}
