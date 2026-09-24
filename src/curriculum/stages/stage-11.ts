import type { Stage } from '../types'

const scoreWorkspace = {
  'main.py': 'print("Your score file is ready.")',
  'score.txt': '0',
}

const quizFiles = {
  'main.py': `import json

with open("questions.json") as question_file:
    questions = json.load(question_file)

score = 0
for question in questions:
    answer = input(question["question"] + " ")
    # Check the answer and update the score.

print("Quiz finished.")`,
  'questions.json': `[
  {"question": "What is 3 + 4?", "answer": "7"},
  {"question": "What is the capital of France?", "answer": "Paris"}
]`,
}

export const stageEleven: Stage = {
  id: 'stage-11',
  order: 11,
  title: 'Connecting Programming to the Real World',
  description: 'Use libraries, files, and modules to build and explain larger programs.',
  lessons: [
    {
      id: 'stage-11-lesson-1',
      order: 1,
      title: 'Libraries are reusable capabilities',
      shortTitle: 'Use a library',
      summary: 'A library gives your program useful tools that someone else has already built.',
      learningGoal: 'Import the random library and use its public function to choose a whole number.',
      conceptTags: ['libraries', 'imports', 'randomness'],
      steps: [
        {
          id: 'choose-a-library-tool',
          content: [
            { type: 'paragraph', text: 'A library is a collection of useful capabilities. You import one, then use the names it makes available.' },
            { type: 'example', code: 'import random\nnumber = random.randint(1, 10)', caption: 'Import the module, then call one of its functions.' },
            { type: 'callout', tone: 'note', text: 'The dot connects a module name to one of its public tools: random.randint.' },
          ],
          activity: {
            id: 'identify-random-library-use',
            kind: 'choice',
            title: 'Recognise the library interface',
            prompt: 'Which line asks the random module to choose a whole number from 1 through 10?',
            required: true,
            options: [
              { id: 'fixed', text: 'number = 7' },
              { id: 'random-range', text: 'number = random.randint(1, 10)' },
              { id: 'display', text: 'print("1 to 10")' },
            ],
            correctOptionId: 'random-range',
            correctFeedback: 'Yes — random.randint is a tool provided by the imported random module.',
            incorrectFeedback: 'Look for the call that uses the module name, a dot, and a function that chooses a number.',
          },
        },
        {
          id: 'make-a-random-number',
          content: [
            { type: 'paragraph', text: 'The starter already displays a number. Change how that value is made so each run can choose a different whole number.' },
            { type: 'list', items: ['The lower end is 1.', 'The upper end is 10, and randint includes it.'] },
          ],
          activity: {
            id: 'choose-a-number-with-random',
            kind: 'code',
            title: 'Use a library tool',
            prompt: 'Replace the fixed number with a random whole number from 1 through 10, then print it.',
            required: true,
            starterCode: 'import random\n\nnumber = 4\nprint(number)',
            assessment: {
              kind: 'behavior',
              cases: [
                { inputs: [], randomSeed: 0, output: { mode: 'integer-range', minimum: 1, maximum: 10 } },
                { inputs: [], randomSeed: 42, output: { mode: 'integer-range', minimum: 1, maximum: 10 } },
              ],
              requirements: ['random-integer'],
            },
            hints: [
              'Keep the import and the print. Change the value assigned to number.',
              'Call a function on random and give it the smallest and largest allowed numbers.',
              'Use random.randint(1, 10).',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-2',
      order: 2,
      title: 'Randomness project',
      shortTitle: 'Random guessing game',
      summary: 'Replace a fixed secret with a random one, then give useful clues about each guess.',
      learningGoal: 'Use randomness with existing input and conditional skills to build a small guessing game.',
      conceptTags: ['randomness', 'input', 'conditionals'],
      steps: [
        {
          id: 'predict-what-random-changes',
          content: [
            { type: 'paragraph', text: 'A guessing game is less predictable when the program chooses its secret number at the start.' },
            { type: 'example', code: 'secret = random.randint(1, 10)\nguess = int(input("Your guess: "))', caption: 'The secret is chosen before the person guesses.' },
          ],
          activity: {
            id: 'identify-random-game-state',
            kind: 'choice',
            title: 'Think about the secret',
            prompt: 'What should be different between fresh runs of the game?',
            required: true,
            options: [
              { id: 'secret-changes', text: 'The secret number can change.' },
              { id: 'input-stops', text: 'The player can no longer enter a guess.' },
              { id: 'range-changes', text: 'The allowed range must change each time.' },
            ],
            correctOptionId: 'secret-changes',
            correctFeedback: 'Right — the number is unpredictable, while the rules stay understandable.',
            incorrectFeedback: 'Randomness changes the selected secret; it does not remove the input or the range.',
          },
        },
        {
          id: 'upgrade-the-guessing-game',
          content: [
            { type: 'paragraph', text: 'The game already accepts a guess. Upgrade it so the secret is random and the player learns whether to guess higher or lower.' },
            { type: 'callout', tone: 'tip', text: 'A hidden test sets a repeatable random seed. That lets us check several game paths without making the learner’s own game predictable.' },
          ],
          activity: {
            id: 'build-random-guessing-game',
            kind: 'code',
            title: 'Improve the game',
            prompt: 'Choose a secret from 1 to 10. Ask for one guess and print “Correct”, “Too low”, or “Too high”.',
            required: true,
            sampleInputs: ['7'],
            starterCode: 'secret = 7\nguess = int(input("Guess from 1 to 10: "))\nif guess == secret:\n    print("Correct")\nelse:\n    print("Not this time")',
            assessment: {
              kind: 'behavior',
              cases: [
                { inputs: ['7'], randomSeed: 0, output: { mode: 'exact', lines: ['Correct'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
                { inputs: ['3'], randomSeed: 0, output: { mode: 'exact', lines: ['Too low'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
                { inputs: ['9'], randomSeed: 0, output: { mode: 'exact', lines: ['Too high'] }, requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }] },
              ],
              requirements: ['random-integer'],
            },
            hints: [
              'Import random and replace the fixed secret with randint(1, 10).',
              'Compare the guess with the secret. There are three possible relationships.',
              'Use if for equal, elif for a smaller guess, and else for a larger guess.',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-3',
      order: 3,
      title: 'Programs can persist information',
      shortTitle: 'Save a score',
      summary: 'A file can keep information in the project after one run of Python ends.',
      learningGoal: 'Write text to a file and read it in a later run.',
      conceptTags: ['files', 'persistence', 'state'],
      steps: [
        {
          id: 'choose-where-score-lives',
          content: [
            { type: 'paragraph', text: 'A variable belongs to one running program. A file in the project can hold information for a later run.' },
            { type: 'list', items: ['While Python runs: names can remember values.', 'After it stops: those names are gone.', 'A saved project file can be opened again next time.'] },
            { type: 'callout', tone: 'note', text: 'These are virtual project files saved with your learning progress in this browser. They are not uploaded to a server.' },
          ],
          activity: {
            id: 'identify-persistent-storage',
            kind: 'choice',
            title: 'Choose a place that lasts',
            prompt: 'The program stops and starts again. Where can it read a score saved during the earlier run?',
            required: true,
            options: [
              { id: 'old-variable', text: 'A variable from the earlier run' },
              { id: 'saved-file', text: 'A file in the project workspace' },
              { id: 'old-output', text: 'The text that was printed earlier' },
            ],
            correctOptionId: 'saved-file',
            correctFeedback: 'Yes — the next run can open the project file and read its saved text.',
            incorrectFeedback: 'When a run ends, its variables disappear. The saved file is still in the project.',
          },
        },
        {
          id: 'write-and-read-a-score',
          content: [
            { type: 'paragraph', text: 'Use “save” to replace the score file. Use “show” to read what is in it. Each run starts with the project’s saved file contents.' },
            { type: 'example', code: 'with open("score.txt", "w") as file:\n    file.write("100")', caption: 'Writing replaces the file contents.' },
          ],
          activity: {
            id: 'save-and-show-score',
            kind: 'file-workspace',
            title: 'Save it, then read it later',
            prompt: 'Complete a small score keeper: save a typed score to score.txt, or show the score that is already saved.',
            required: true,
            entryFile: 'main.py',
            starterFiles: scoreWorkspace,
            sampleInputs: ['save', '37'],
            assessment: {
              kind: 'behavior',
              cases: [
                {
                  inputs: ['save', '37'],
                  output: { mode: 'exact', lines: ['Saved 37'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                  workspaceSeed: { 'score.txt': '0' },
                  workspaceExpectations: [{ path: 'score.txt', mode: 'exact', value: '37' }],
                },
                {
                  inputs: ['save', '84'],
                  output: { mode: 'exact', lines: ['Saved 84'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                  workspaceSeed: { 'score.txt': '0' },
                  workspaceExpectations: [{ path: 'score.txt', mode: 'exact', value: '84' }],
                },
                {
                  inputs: ['show'],
                  output: { mode: 'exact', lines: ['Saved score: 12'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }],
                  workspaceSeed: { 'score.txt': '12' },
                  workspaceExpectations: [{ path: 'score.txt', mode: 'exact', value: '12' }],
                },
              ],
              requirements: ['conditional', 'file-read', 'file-write'],
            },
            hints: [
              'Ask whether the person wants to save or show a score.',
              'In the save path, ask for the score and open score.txt with "w". In the show path, open it without a writing mode.',
              'Use file.write(score) to save, and file.read() to get the saved text for printing.',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-4',
      order: 4,
      title: 'Structured persistent data',
      shortTitle: 'Read JSON',
      summary: 'JSON stores lists and dictionaries as text that another run can load again.',
      learningGoal: 'Connect Python data structures with their JSON file representation.',
      conceptTags: ['json', 'dictionaries', 'files'],
      steps: [
        {
          id: 'recognise-json-records',
          content: [
            { type: 'paragraph', text: 'A Python dictionary can describe one player. JSON writes a similar set of named values as ordinary text.' },
            { type: 'example', code: 'player = {"name": "Nova", "score": 100}\n\n{"name": "Nova", "score": 100}', caption: 'The top is a Python dictionary; the bottom is JSON text.' },
            { type: 'paragraph', text: 'The same idea works for a whole list of records. json.load() reads the text; json.dump() saves the updated Python data back to the file.' },
          ],
          activity: {
            id: 'choose-json-representation',
            kind: 'choice',
            title: 'Recognise the saved shape',
            prompt: 'Which JSON value represents a list of two player records?',
            required: true,
            options: [
              { id: 'one-dictionary', text: '{"name": "Nova", "score": 100}' },
              { id: 'two-record-list', text: '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}]' },
              { id: 'plain-label', text: 'Nova: 100, Tavi: 80' },
            ],
            correctOptionId: 'two-record-list',
            correctFeedback: 'Right — the outside square brackets make a list, and each player is a dictionary with named fields.',
            incorrectFeedback: 'Find the option with a list surrounding two separate records.',
          },
        },
        {
          id: 'load-player-records-from-json',
          content: [
            { type: 'paragraph', text: 'Use json.load() to turn the saved JSON text back into Python lists and dictionaries.' },
            { type: 'list', items: ['The file keeps the data as text.', 'json.load() recreates Python data.', 'Then use the familiar list position and dictionary key.'] },
          ],
          activity: {
            id: 'load-json-player-list',
            kind: 'file-workspace',
            title: 'Update a saved player list',
            prompt: 'Load players.json, add the new player, and save the whole list back as JSON. Show how many players are now saved.',
            required: true,
            entryFile: 'main.py',
            starterFiles: {
              'main.py': 'print("The leaderboard is ready.")',
              'players.json': '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}]',
            },
            sampleInputs: ['Ari', '9'],
            assessment: {
              kind: 'behavior',
              cases: [
                {
                  inputs: ['Ari', '9'],
                  output: { mode: 'exact', lines: ['Saved 3 players'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                  workspaceSeed: { 'players.json': '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}]' },
                  workspaceExpectations: [{
                    path: 'players.json', mode: 'exact',
                    value: '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}, {"name": "Ari", "score": 9}]',
                  }],
                },
                {
                  inputs: ['Mina', '42'],
                  output: { mode: 'exact', lines: ['Saved 3 players'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                  workspaceSeed: { 'players.json': '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}]' },
                  workspaceExpectations: [{
                    path: 'players.json', mode: 'exact',
                    value: '[{"name": "Nova", "score": 100}, {"name": "Tavi", "score": 80}, {"name": "Mina", "score": 42}]',
                  }],
                },
              ],
              requirements: ['json-load', 'json-dump', 'dictionary-literal'],
            },
            hints: [
              'Import json and load the list from players.json.',
              'Ask for a name and a score. Turn the score text into an integer.',
              'Append a dictionary with those fields, then write the whole list back with json.dump().',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-5',
      order: 5,
      title: 'Expected failures',
      shortTitle: 'Handle missing files',
      summary: 'Some problems, such as a file not existing yet, are predictable and can have a helpful response.',
      learningGoal: 'Recognise FileNotFoundError and catch it with a useful fallback.',
      conceptTags: ['exceptions', 'FileNotFoundError', 'files'],
      steps: [
        {
          id: 'predict-a-missing-score-file',
          content: [
            { type: 'paragraph', text: 'This program asks for a file that is not in the project yet.' },
            { type: 'example', code: 'with open("score.txt") as file:\n    score = file.read()', caption: 'The open call happens before Python can read.' },
          ],
          activity: {
            id: 'identify-missing-file-error',
            kind: 'choice',
            title: 'Predict the expected failure',
            prompt: 'What happens when score.txt has not been created?',
            required: true,
            options: [
              { id: 'empty-text', text: 'Python quietly makes score an empty string.' },
              { id: 'file-not-found', text: 'Python raises FileNotFoundError.' },
              { id: 'syntax-error', text: 'Python reports a SyntaxError before it runs.' },
            ],
            correctOptionId: 'file-not-found',
            correctFeedback: 'Yes — attempting to open a missing path raises FileNotFoundError.',
            incorrectFeedback: 'The Python is valid, so consider what can happen when open() looks for a path that is absent.',
          },
        },
        {
          id: 'handle-no-saved-score',
          content: [
            { type: 'paragraph', text: 'A missing score is a normal first-run situation. Catch that specific error and tell the person what is happening.' },
            { type: 'callout', tone: 'tip', text: 'Keep the try block small: put the file operation that may fail inside it.' },
          ],
          activity: {
            id: 'show-a-helpful-missing-file-message',
            kind: 'file-workspace',
            title: 'Give the first run a helpful result',
            prompt: 'Read score.txt when it exists. If it is missing, print “No saved score yet” instead of stopping with an error.',
            required: true,
            entryFile: 'main.py',
            starterFiles: { 'main.py': 'with open("score.txt") as score_file:\n    score = score_file.read()\nprint(score)' },
            assessment: {
              kind: 'behavior',
              cases: [{ inputs: [], output: { mode: 'exact', lines: ['No saved score yet'] }, workspaceSeed: {} }],
              requirements: ['file-not-found-handler'],
            },
            hints: [
              'Put the open-and-read lines inside a try block.',
              'Add except FileNotFoundError: and assign a helpful message to score.',
              'Print score after the try and except so both paths lead to the same output line.',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-6',
      order: 6,
      title: 'Modules organise larger programs',
      shortTitle: 'Use project modules',
      summary: 'Separate a reusable job into another Python file and import it from the main program.',
      learningGoal: 'Use a local module to keep a program’s responsibilities organised.',
      conceptTags: ['modules', 'imports', 'functions'],
      steps: [
        {
          id: 'split-score-description',
          content: [
            { type: 'paragraph', text: 'A project can contain more than one Python file. Keep the main flow in main.py and move a reusable job into scores.py.' },
            { type: 'example', code: 'from scores import describe_score\nprint(describe_score(37))', caption: 'Python finds scores.py in the same project.' },
            { type: 'callout', tone: 'note', text: 'A module is just a Python file. This lesson does not need package installation or project setup.' },
          ],
          activity: {
            id: 'call-a-local-score-module',
            kind: 'file-workspace',
            title: 'Give each file one clear job',
            prompt: 'Define describe_score(score) in scores.py. Import and call it from main.py so the program prints “Score: 37”.',
            required: true,
            entryFile: 'main.py',
            starterFiles: {
              'main.py': 'print("A score summary will appear here.")',
              'scores.py': '# Put a reusable score-description function here.\n',
            },
            assessment: {
              kind: 'behavior',
              cases: [{ inputs: [], output: { mode: 'exact', lines: ['Score: 37'] } }],
              requirements: ['local-module-import'],
              fileRequirements: [{ path: 'scores.py', requirements: ['function-definition', 'function-parameter', 'function-return'] }],
            },
            hints: [
              'In scores.py, define a function that receives the score and returns its description.',
              'In main.py, import that function from scores.',
              'Call the function with 37 and print the returned text.',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-7',
      order: 7,
      title: 'Guided final project',
      shortTitle: 'Build a quiz',
      summary: 'Plan a small project, use acceptance examples, and finish one working slice.',
      learningGoal: 'Use requirements, examples, data, and an implementation plan to complete a quiz.',
      conceptTags: ['guided-project', 'requirements', 'json', 'testing'],
      steps: [
        {
          id: 'plan-the-quiz',
          content: [
            { type: 'paragraph', text: 'Before editing, decide what the quiz should do and how we will recognise a working version.' },
            { type: 'list', items: ['Requirements describe what a person can do.', 'Examples make expected behavior concrete.', 'Data and functions help keep the implementation organised.'] },
          ],
          activity: {
            id: 'plan-guided-quiz',
            kind: 'planning',
            title: 'Sketch the quiz before coding',
            prompt: 'Write a small plan. These are your design notes, not answers that Python Steps grades for meaning.',
            required: true,
            submitLabel: 'Save quiz plan',
            fields: [
              { id: 'requirements', label: 'Requirements', prompt: 'What should the quiz ask, check, and show?', placeholder: 'Ask two questions, tell whether each is right…', required: true, rows: 3 },
              { id: 'examples', label: 'Example behaviors', prompt: 'Give one example run and its expected result.', placeholder: 'Answers: 7, Paris → score 2/2', required: true, rows: 3 },
              { id: 'data', label: 'Data design', prompt: 'What information belongs together in each question?', placeholder: 'A question and its correct answer…', required: true, rows: 2 },
              { id: 'jobs', label: 'Program jobs', prompt: 'Name the main jobs the program needs to do.', placeholder: 'Load questions, ask, check, count, report…', required: true, rows: 2 },
            ],
          },
        },
        {
          id: 'complete-the-quiz-slice',
          content: [
            { type: 'paragraph', text: 'The question records are already saved in JSON. Finish the loop so each answer is checked and the score changes only for a correct answer.' },
            { type: 'example', code: 'if answer == question["answer"]:\n    print("Correct")\n    score = score + 1', caption: 'One correct answer updates the running score.' },
          ],
          activity: {
            id: 'finish-guided-json-quiz',
            kind: 'file-workspace',
            title: 'Finish the quiz',
            prompt: 'Check each answer, give a response, and print the final score. It must work for both acceptance runs.',
            required: true,
            entryFile: 'main.py',
            starterFiles: quizFiles,
            sampleInputs: ['7', 'Paris'],
            assessment: {
              kind: 'behavior',
              cases: [
                {
                  inputs: ['7', 'Paris'],
                  output: { mode: 'exact', lines: ['Correct', 'Correct', 'Score: 2/2'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                },
                {
                  inputs: ['5', 'Paris'],
                  output: { mode: 'exact', lines: ['Try again', 'Correct', 'Score: 1/2'] },
                  requiredInputs: [{ inputIndex: 0, mustAppearInOutput: false }, { inputIndex: 1, mustAppearInOutput: false }],
                },
              ],
              requirements: ['json-load', 'conditional', 'variable-increment'],
            },
            hints: [
              'Compare each answer with the answer field in that question.',
              'Inside the loop, add an if/else. Increase score only in the if path.',
              'After the loop, show score out of the number of questions.',
            ],
          },
        },
      ],
      status: 'ready',
    },
    {
      id: 'stage-11-lesson-8',
      order: 8,
      title: 'Independent capstone',
      shortTitle: 'Your own project',
      summary: 'Choose a small idea, build a first version, test it, and explain how it works.',
      learningGoal: 'Plan, implement, test, improve, and explain an independently chosen program.',
      conceptTags: ['capstone', 'planning', 'testing', 'explanation'],
      steps: [
        {
          id: 'plan-independent-project',
          content: [
            { type: 'paragraph', text: 'Choose an idea small enough to build a first version. A quiz, text adventure, habit tracker, mini shop, or your own idea can work.' },
            { type: 'list', items: ['Plan the smallest useful version.', 'Choose data that fits the information.', 'Name the jobs and possible functions.', 'Write examples that will show it works.'] },
            { type: 'callout', tone: 'note', text: 'Your planning notes are saved. Python Steps does not pretend it can judge whether your idea is good.' },
          ],
          activity: {
            id: 'design-independent-project',
            kind: 'planning',
            title: 'Choose and plan your project',
            prompt: 'Answer each question in your own words. Keep the first version deliberately small.',
            required: true,
            submitLabel: 'Save project plan',
            fields: [
              { id: 'purpose', label: 'What will it do?', prompt: 'Describe the purpose in one or two sentences.', required: true, rows: 2 },
              { id: 'user', label: 'Who will use it?', required: true, rows: 1 },
              { id: 'information', label: 'What information does it need?', placeholder: 'Names, choices, scores, books…', required: true, rows: 2 },
              { id: 'changing', label: 'What information changes?', required: true, rows: 2 },
              { id: 'representation', label: 'How will you represent that information?', placeholder: 'A number, list, dictionary, or saved file…', required: true, rows: 2 },
              { id: 'responsibilities', label: 'What are the main jobs?', placeholder: 'Ask, calculate, save, report…', required: true, rows: 2 },
              { id: 'functions', label: 'What functions might help?', required: true, rows: 2 },
              { id: 'smallest-version', label: 'What is the smallest version that could work?', required: true, rows: 2 },
              { id: 'examples', label: 'What examples will show it works?', required: true, rows: 2 },
            ],
          },
        },
        {
          id: 'build-first-capstone-version',
          content: [
            { type: 'paragraph', text: 'Build the smallest version of your plan that runs and produces a visible result. Add files if they help.' },
            { type: 'callout', tone: 'tip', text: 'Run it, notice what happens, change one thing, and try again. A first version is allowed to be small.' },
          ],
          activity: {
            id: 'implement-independent-project',
            kind: 'file-workspace',
            title: 'Build your first version',
            prompt: 'Write and run a small version of your own program. The check confirms it runs and shows output; it does not grade your idea or design.',
            required: true,
            entryFile: 'main.py',
            starterFiles: { 'main.py': '' },
            assessment: { kind: 'successful-run' },
            hints: [
              'Start with one short path through the program.',
              'Use print() to make one result visible, then add the next useful behavior.',
              'You can split a helper into another .py file or save information in a text/JSON file.',
            ],
          },
        },
        {
          id: 'explain-independent-project',
          content: [
            { type: 'paragraph', text: 'A running program is only one part of this project. Explain how your version works and what you learned from testing it.' },
            { type: 'callout', tone: 'note', text: 'The explanation is required, but its meaning remains yours: the app saves it without pretending to evaluate it automatically.' },
          ],
          activity: {
            id: 'explain-project-decisions',
            kind: 'planning',
            title: 'Walk me through your program',
            prompt: 'Describe the code you wrote and the evidence from a test run. Your explanation completes this final step.',
            required: true,
            submitLabel: 'Save explanation',
            fields: [
              { id: 'walkthrough', label: 'How does your program work?', prompt: 'Walk through the important instructions in order.', required: true, rows: 4 },
              { id: 'data-choice', label: 'Why did you choose this representation?', required: true, rows: 2 },
              { id: 'test-evidence', label: 'What example did you test, and what happened?', required: true, rows: 2 },
              { id: 'next-improvement', label: 'What would you improve next?', required: true, rows: 2 },
            ],
          },
        },
      ],
      status: 'ready',
    },
  ],
}
