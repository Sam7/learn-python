# Python Steps

Python Steps is a small browser-based Python learning app for first-time programmers. It teaches one idea at a time through a short explanation, real Python editing, in-browser execution, and a small challenge.

There is no backend, account system, analytics, or server-side code execution. Pyodide runs inside a Web Worker, and learner progress/code are stored in versioned `localStorage` on the current device.

## Run locally

```bash
npm install
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

The Playwright suite starts Vite automatically when needed. It covers the first learner journey, the five fundamentals lessons, the first input lesson, invalid Python, timeout recovery, refresh persistence, desktop layout, and iPad portrait/landscape viewport behaviour. Screenshots are written to `artifacts/screenshots/` when the screenshot tests are run.

The automated WebKit checks cannot reproduce every physical iPad software-keyboard behaviour. Before a public launch, also test Safari on a real iPad: focus the editor, type with the keyboard open, dismiss the keyboard, run the code, and continue to the next lesson in both orientations.

## Deploy to Vercel

This is a static Vite site and needs no environment variables or backend configuration.

1. Import the repository into Vercel.
2. Use `npm run build` as the build command.
3. Use `dist` as the output directory.
4. Deploy.

The pinned Pyodide CDN URL is configured in `src/features/python/python.worker.ts`. It is isolated there so the distribution can later be self-hosted without changing the lesson or UI layers.

## Project shape

- `src/curriculum/` contains the typed curriculum, seven initial modules, and lesson definitions. The first five fundamentals lessons and the first input lesson are available; later lessons are represented as structured `coming-soon` data.
- `src/features/lessons/` contains curriculum-agnostic rendering, navigation, and validation.
- `src/features/lessons/validators/` contains pure/output/AST-backed validation strategies.
- `src/features/python/` contains the `PythonRunner` contract, worker protocol, browser runner, and runtime hook.
- `src/features/progress/` contains the versioned persistence boundary.
- `src/components/ui/` contains small shadcn/ui-style primitives used by the app.
- `e2e/` contains Playwright learner and responsive-layout coverage.
- `docs/implementation-plan.md` records milestones and implementation decisions.

## Adding a lesson

1. Add a `Lesson` object to the appropriate module file under `src/curriculum/modules/`, with an id, order, short explanation, example/starter code, task, hints, status, and a validation definition.
2. Add the module to `src/curriculum/curriculum.ts` if it is new. Navigation, ordering, progress, and previous/next behaviour are derived from the curriculum data.
3. Use an existing output validator for a straightforward output challenge, or add a named validator strategy in `src/features/lessons/validators/` when the lesson needs a new concept check. Do not compare the entire source string.
4. Add focused curriculum/validator tests in `src/features/lessons/lessons.test.ts`.
5. If the learner journey changes, extend `e2e/python-steps.spec.ts` with the behaviour a learner should see.
6. Run unit tests, lint, build, and the Playwright suite; inspect representative screenshots.

The application shell derives navigation, progress, code restoration, and completion from the lesson catalogue. A normal new lesson should not require a new page or lesson-specific React branch.
