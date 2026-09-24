# Lesson authoring guide

The curriculum is data; React provides a generic renderer and workflow. A normal lesson should not need a page component, a lesson-specific hook, or a Python-runner change.

## Shape and ordering

Curriculum data lives in `src/curriculum/stages/`. `curriculum.ts` orders stages and lessons by their numeric `order` fields, so source-file placement is not the progression contract. Keep order values unique within their level and keep IDs stable after release: completion and saved answers use activity IDs, while the current step is saved by lesson/step ID.

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

The `ContentBlock` union is intentionally small: `paragraph`, `list`, `callout`, `example`, and `evaluation`. The evaluation block shows a source expression and its ordered reductions as instructional content; it does not simulate or replace real Python execution. The learner sees these blocks in array order above that step's activity. Keep examples small and runnable-looking; they are instructional code, not submitted code.

## Reusable activity kinds

The discriminated `LearningActivity` union is in `src/curriculum/types.ts`:

- `code`: editable CodeMirror program. Run executes the program, displays output beside the editor, and immediately assesses the result. Use `required: true` for a gating task. `assessment` can check output, run behavior cases with different stdin values, use Python's `ast` module for a concept-specific requirement, combine output and AST checks, or treat a specified runtime exception as the observation being assessed (the real exception remains visible).
- `predict-output`: saves a written prediction, runs the provided program, then compares the prediction with actual stdout.
- `predict-state`: saves a choice, traces real Python execution in the worker, and compares the chosen value with the captured local variable at the requested line/occurrence. Ensure `expectedValue` is among the choices.
- `choice`: deterministic, immediately assessed selection.
- `arrange-code`: deterministic ordering of supplied fragments; controls are keyboard-accessible move-up/down buttons.
- `trace`: runs a provided program with worker tracing and lets the learner step through captured line/local-value snapshots.
- `trace-table`: collects predicted variable values at named source checkpoints, then compares every cell with the worker's real Python trace.
- `branch-trace`: collects a predicted conditional path, then runs the example in trace mode and shows which declared branch-body lines ran or were skipped. Declare exclusive, non-overlapping code line numbers; a one-way `if` uses one `otherwise` path with no body lines.
- `reflection`: optional, private, saved text with no correctness check. Use `required: false`; reflections never block progression.

“Modify”, “fill a gap”, “find the bug”, “complete the program”, and “build from a goal” are learning prompts/scaffolding for the `code` activity, not separate widgets. Give the learner a suitable `starterCode`, a clear prompt, and behavior/concept checks for the target. AST-backed requirements cover names and values, comparisons, boolean values, conditionals, `and`/`or`/`not`, `for`, `range()`, `while`, list literals, list indexing/subscripts, iteration over a sequence, `len()`, membership tests, `append()`, function definitions/calls, used parameters, multiple parameters, returned values, local-scope use, dictionary literals and named-field reads/updates, lists of dictionaries, iteration/filtering over records, adding a record field to a running total, multiple assertions, and reusing a defined function for multiple calls. Stage-specific AST checks live in focused validator modules; extend them with Python AST, not source regexes, when a later concept requires it. Python's AST normalizes `elif` into a nested `if`, so the `elif` requirement uses Python's tokenizer to distinguish that spelling from an explicitly nested `if`. Behavior assessments can declare multiple AST/token requirements alongside varied input/output cases. Expected-runtime-error assessments may also require AST evidence so the intended concept, rather than an unrelated error of the same type, is what passes. A deliberate `timeout` assessment is available for a short, clearly signposted endless-loop observation; the runner terminates and recreates the worker afterward. Captured stdout/stderr are bounded to 20,000 characters, with a visible truncation note. `required: false` also supports optional What If? experiments that should not become a quiz.

For every `code` activity presented as a challenge, check that running `starterCode` unchanged does **not** complete it. The starter should give the learner a useful foothold, but require them to add, change, repair, or meaningfully adapt code before passing. If the learning goal is to inspect a finished program without editing it, do not disguise that as a code challenge: use a prediction, trace, choice, or an explicitly observational step instead. In the browser journey, verify that the unchanged starter leaves progression gated, then verify that a learner-edited solution passes.

Output expectations support exact lines, included text, a line count, distinct non-empty lines, and non-empty output. In behavior tests, `requiredInputs` confirms each listed `input()` was answered. `mustAppearInOutput` defaults to `true`; set it to `false` when an answer is transformed before display (for example, the text `"12"` becoming the number `12`). Use varied inputs and expected outputs to prove that transformed answers affect the result.

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

An activity may only be marked complete when it is required and its assessment passes. Lesson completion, stage progress, unlocks, and previous/next targets derive from the curriculum's required activities. The session restores only an available and unlocked current lesson; future/removed data is filtered safely.

## Tests and visual review

When adding content:

1. Add curriculum integrity/progression tests and focused assessor tests in `src/features/lessons/lessons.test.ts`.
2. Add persistence tests if IDs, response shapes, or migration behavior change.
3. Add a Playwright journey when the learner-facing interaction changes. Include the expected result, failure case, and progression gate.
4. Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e`.
5. Inspect screenshots at desktop, iPad landscape, and iPad portrait sizes after layout changes. The WebKit checks cover focus/scroll/rotation but cannot reproduce every physical iPad keyboard behavior; validate the keyboard on a real device before release.

Keep the app shell curriculum-agnostic and the Python worker education-agnostic. The worker accepts typed Python requests and returns execution data; it knows no lesson names, unlock rules, or progress.
