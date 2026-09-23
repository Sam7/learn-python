# Lesson authoring guide

The curriculum is data; React provides a generic renderer and workflow. A normal lesson should not need a page component, a lesson-specific hook, or a Python-runner change.

## Shape and ordering

Curriculum data lives in `src/curriculum/modules/`. `curriculum.ts` orders modules and lessons by their numeric `order` fields, so source-file placement is not the progression contract. Keep order values unique within their level and keep IDs stable after release: completion and saved answers use activity IDs, while the current step is saved by lesson/step ID.

A lesson is a sequence of small steps. Each step has an ordered list of content blocks and at most one activity. This supports an experience such as:

```text
short explanation → example → predict → inspect output
→ explanation → another example → code task → feedback
```

Use another step when the learner should explicitly choose Previous/Next between tasks. Content-only steps are allowed and do not gate progression. Keep explanations close to the activity they prepare and avoid large uninterrupted text blocks.

```ts
{
  id: 'show-a-message',
  order: 1,
  title: 'Show a message',
  shortTitle: 'A message',
  summary: 'Use print() to display text.',
  conceptTags: ['output', 'sequence'],
  status: 'ready',
  steps: [{
    id: 'change-the-message',
    content: [
      { type: 'paragraph', text: 'Python follows the instruction inside print().' },
      { type: 'example', code: 'print("Hello!")', caption: 'Example' },
    ],
    activity: {
      id: 'print-a-greeting',
      kind: 'code',
      title: 'Try it yourself',
      prompt: 'Make Python print Hello Python!',
      required: true,
      starterCode: 'print("Hello!")',
      hints: ['Change the words inside the quotation marks.'],
      assessment: {
        kind: 'output',
        expectation: { mode: 'exact', lines: ['Hello Python!'] },
      },
    },
  }],
}
```

The `ContentBlock` union is intentionally small: `paragraph`, `list`, `callout`, and `example`. The learner sees these blocks in array order above that step's activity. Keep examples small and runnable-looking; they are instructional code, not submitted code.

## Reusable activity kinds

The discriminated `LearningActivity` union is in `src/curriculum/types.ts`:

- `code`: editable CodeMirror program. Run executes the program, displays output beside the editor, and immediately assesses the result. Use `required: true` for a gating task. `assessment` can check output, run behavior cases with different stdin values, or use Python's `ast` module for a concept-specific requirement.
- `predict-output`: saves a written prediction, runs the provided program, then compares the prediction with actual stdout.
- `predict-state`: saves a choice, traces real Python execution in the worker, and compares the chosen value with the captured local variable at the requested line/occurrence. Ensure `expectedValue` is among the choices.
- `choice`: deterministic, immediately assessed selection.
- `arrange-code`: deterministic ordering of supplied fragments; controls are keyboard-accessible move-up/down buttons.
- `trace`: runs a provided program with worker tracing and lets the learner step through captured line/local-value snapshots.
- `reflection`: optional, private, saved text with no correctness check. Use `required: false`; reflections never block progression.

“Modify”, “fill a gap”, “find the bug”, “complete the program”, and “build from a goal” are learning prompts/scaffolding for the `code` activity, not separate widgets. Give the learner a suitable `starterCode`, a clear prompt, and behavior/concept checks for the target. `required: false` also supports optional What If? experiments that should not become a quiz.

Each activity has one stable ID. For a new step/task, author data and tests only. If a genuinely new interaction is needed, add it deliberately across the type union, generic renderer, assessment behavior, persistence normalization if its response shape is new, and tests. Avoid switching on lesson IDs in the UI.

## Assessment and feedback

Validate what the code does, not one exact source string. For example, if the goal is to print `Hello Python!`, both a direct `print()` and assigning the text to a variable before printing it should pass. Prefer these checks:

1. `output` for a directly observable result.
2. `behavior` when the program should work for multiple inputs or cases. Cases rerun the submitted source with provided input lines and check expected output/required input use.
3. `ast` only when use of a particular construct is itself the learning objective. Parse with Python `ast` in Pyodide; don't infer Python structure with regex.

Put expected/actual evidence and a short, actionable message in `ValidationResult`. A code run is the assessment trigger—do not add a separate Check button. Predictions are assessed when their supplied program is run; choice/order tasks assess when answered. An open reflection is deliberately ungraded.

Hints are ordered from a smaller nudge to a more explicit clue. Reveal one at a time. Avoid placing the entire solution in the first hint.

## Progress and compatibility

`src/features/progress/progress-store.ts` is the only localStorage boundary. Version 2 stores:

- current lesson and step ID;
- completed required activity IDs;
- per-activity code, response, and revealed-hint count.

Do not save runtime instances, stdout, or interactive input answers. If changing the progress schema, normalize unknown/corrupt values and add a migration test. V1 lesson completion and saved code currently migrate to the corresponding v2 activities.

An activity may only be marked complete when it is required and its assessment passes. Lesson completion, module progress, unlocks, and previous/next targets derive from the curriculum's required activities. The session restores only an available and unlocked current lesson; future/removed data is filtered safely.

## Tests and visual review

When adding content:

1. Add curriculum integrity/progression tests and focused assessor tests in `src/features/lessons/lessons.test.ts`.
2. Add persistence tests if IDs, response shapes, or migration behavior change.
3. Add a Playwright journey when the learner-facing interaction changes. Include the expected result, failure case, and progression gate.
4. Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e`.
5. Inspect screenshots at desktop, iPad landscape, and iPad portrait sizes after layout changes. The WebKit checks cover focus/scroll/rotation but cannot reproduce every physical iPad keyboard behavior; validate the keyboard on a real device before release.

Keep the app shell curriculum-agnostic and the Python worker education-agnostic. The worker accepts typed Python requests and returns execution data; it knows no lesson names, unlock rules, or progress.
