# Python Steps

Python Steps is a small browser-based Python learning app for first-time programmers. It teaches one idea at a time through a short explanation, real Python editing, in-browser execution, and a small challenge.

There is no backend, account system, analytics, or server-side code execution. Pyodide runs inside a Web Worker, and learner progress/code are stored in versioned `localStorage` on the current device.

## Run locally

```bash
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal.

## Checks

```bash
npm test                 # Vitest unit/pure logic tests
npm run lint             # Oxlint
npm run build            # TypeScript check and production build
npm run test:e2e         # Playwright: Chromium + WebKit tablet projects
```

The Playwright suite starts Vite automatically when needed. It covers the learner journey, multi-step lessons, immediate assessment, saved code/progress, real Python state tracing, live multiple inputs, syntax errors, timeout recovery, and WebKit iPad portrait/landscape layout. Representative viewport screenshots are written to `artifacts/screenshots/`.

The automated WebKit checks cannot reproduce every physical iPad software-keyboard behaviour. Before a public launch, also test Safari on a real iPad: focus the editor, type with the keyboard open, dismiss the keyboard, run the code, and continue to the next lesson in both orientations.

## Deploy to Vercel

This is a static Vite site and needs no environment variables or backend configuration.

1. Import the repository into Vercel.
2. Use `npm run build` as the build command.
3. Use `dist` as the output directory.
4. Deploy.

The deployment includes `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers so modern browsers can use live input prompts from the worker. Browsers that cannot provide cross-origin isolation automatically use the multiline transcript input instead.

The pinned Pyodide CDN URL is configured in `src/features/python/python.worker.ts`. It is isolated there so the distribution can later be self-hosted without changing the lesson or UI layers.

## Project shape

- `src/curriculum/` contains the typed Stage 0–11 curriculum outline from `docs/curriculum-01.md`: 12 stages and 109 micro-lessons. Stages 0–8 (81 lessons) are fully available; later lessons remain structured as `coming-soon` data until authored and tested.
- `src/features/learning/` renders generic activity types and owns the learner session/progression workflow. Lesson-specific rules stay in curriculum data and validation strategies.
- `src/features/lessons/validators/` contains output, behavior, and Python-AST-backed code assessment.
- `src/features/python/` contains the `PythonRunner` contract, worker protocol, browser runner, and runtime hook.
- `src/features/progress/` contains the versioned persistence boundary and v1-to-v2 migration. Progress v2 stores the current step, completed activity IDs, and saved response/code per activity.
- `src/components/ui/` contains small shadcn/ui-style primitives used by the app.
- `e2e/` contains Playwright learner and responsive-layout coverage.
- `docs/implementation-plan.md` records milestones and implementation decisions; `docs/lesson-authoring.md` documents the content model and author workflow.

## Adding a lesson

1. Add a `Lesson` to the corresponding file in `src/curriculum/stages/`. Give the lesson, every step, and every activity a stable unique ID; saved progress is keyed by those IDs.
2. Set its stage/lesson `order`, summary, concept tags, and `status`. Navigation derives order from these values. Use `coming-soon` until a lesson has a complete, tested journey.
3. Add ordered `LessonStep` records. Each step can interleave short `content` blocks (paragraph, list, callout, example, expression evaluation) and one optional activity. A step without an activity is a short reading/observation stop. Required activities gate moving on; optional activities and reflections do not.
4. Choose an existing generic interaction: editable code, predict output/state, choice, arrange code, step-through trace, or optional reflection. Code can be assessed by output, behavior, Python AST, or an expected runtime error. A code challenge should require a meaningful edit before its solution can pass; do not provide a complete, already-correct starter and ask the learner only to press Run. If the goal is to observe finished code, use prediction, trace, choice, or a clearly described observation. A code task is assessed automatically when Run is pressed—there is no separate Check action.
5. Choose behavior rather than exact-source validation: output expectations for visible results, behavior cases for varied inputs, and Python AST checks only when a concept itself is required. Behavior tests can require an answer to be echoed, or only require it to be consumed when it is transformed. Existing examples and JSON shapes are in [the lesson-authoring guide](docs/lesson-authoring.md).
6. Add focused curriculum/validator tests. Add or update Playwright coverage when the learner journey or interaction changes.
7. Run unit tests, lint, build, and Playwright; inspect desktop and tablet screenshots.

The application shell derives stage navigation, progress, code restoration, and completion from the curriculum. A normal new lesson should require data and tests, not a new page or lesson-specific React branch. Adding a new interaction kind is a deliberate engine change: update the discriminated union, renderer, assessor (where appropriate), persistence normalization, and unit/browser tests together.

## Python input

The Python runner supports any number of sequential `input()` calls. In a cross-origin-isolated browser, the worker pauses at each prompt and the learner answers it in the UI. In fallback mode, enter one answer per line in the Program input box; blank lines are preserved. `sys.stdin.readline()` consumes the same sequential input source. Input answers are kept in memory for the current run and are not saved to localStorage.
