# Python Steps — Agent Guidance

Keep this file specific to project decisions that are easy to regress. Read linked docs only when the task touches their subject; do not load the whole repo map for routine edits.

## Architecture boundaries

- **Curriculum (`src/curriculum/`) is declarative content.** Keep lesson, step, and activity definitions independent of React, browser storage, and Pyodide. A normal lesson addition should primarily change curriculum data and focused tests.
- **Learning (`src/features/learning/`) owns the learner workflow and rendering composition.** Keep progression/state-transition logic pure in `domain/`; keep curriculum-specific validation in `src/features/lessons/validators/`, not in page components.
- **UI renders inputs and state; it does not own infrastructure.** Components receive data and callbacks. Do not access `localStorage`, construct Python workers, or call Pyodide from UI components.
- **Python (`src/features/python/`) owns execution only.** `PythonRunner` is the app-facing contract; the browser runner and typed worker protocol adapt it to the worker. Keep Pyodide/CDN details inside `python.worker.ts`; the runtime must not know about lessons, curriculum, or progress.
- **Progress (`src/features/progress/`) owns persistence.** Route reads/writes and schema migration through the progress repository; do not scatter storage access through hooks or components.
- Keep dependencies one-way: the learning workflow composes curriculum, assessment, the Python runner, and progress repository; curriculum data and Python execution stay independent of UI. UI components depend on props/callbacks, not concrete worker or storage APIs.

## Components and reuse

- Before creating a component, inspect `src/components/ui/`, the relevant `src/features/**/components/`, and `package.json` for an existing component, composition pattern, or dependency that fits. Reuse or extend it when semantics match; do not duplicate it under a new name.
- Put app-wide primitives in `src/components/ui/`; keep learning-, lesson-, and Python-specific components beside their feature. Follow existing examples such as `ActivityRenderer`, `CodeActivity`, `ExecutionOutput`, `CurriculumNavigator`, `LessonActionBar`, and `CodeEditor`.
- Extract a component when it has a cohesive responsibility, meaningful behavior/state, or a useful reuse boundary—not merely to wrap a few JSX elements. Keep large screens as composition, not as a home for domain rules.
- Keep state at the closest owner that needs to coordinate it; pass values and event callbacks explicitly. Use a focused custom hook when stateful browser/infrastructure logic needs separation or reuse.
- Check existing dependencies before adding one. Prefer the current UI primitives, Tailwind utilities, and Lucide icons when they satisfy the need; add a library only for a concrete gap.

## Extending learning activities

- Prefer existing activity kinds and validator strategies. Do not add lesson-specific React branches for ordinary content.
- A new activity kind is an engine change: update the curriculum type, generic renderer, assessment path, progress normalization if needed, and focused tests together.
- Keep assessment aligned with the learning goal. Use behavior/output checks for behavior; use Python AST checks only when a specific construct is itself required. An editable challenge must not pass unchanged unless explicitly classified as an observation.
- For curriculum edits, consult `docs/lesson-authoring.md`; preserve stable IDs because saved learner progress uses them.

## Verification policy

- Run the smallest relevant test by default (for example, `npx vitest run <relevant-test-file>`). Run focused lint/build checks when the changed surface warrants them.
- For browser-facing changes, run the narrowest Playwright case and project that covers the behavior (for example, `npx playwright test e2e/<file> --project=chromium --grep "<case>"`). For responsive UI, choose the relevant WebKit tablet project.
- Do not run `npm run test:e2e` as routine verification. Run the full browser suite only when explicitly requested or for a release-level check; state its expected cost before starting.
- The timeout-recovery E2E and `curriculum-starter-audit.spec.ts` execute the intentional non-stopping-loop activity. Run them only when changing timeout, cancellation, worker recovery, or curriculum-wide assessment behavior, or when explicitly requested.
- Preserve real Pyodide coverage where it verifies the runner contract, but avoid repeating it for UI-only changes. The app prepares Pyodide on mount and reuses its worker for subsequent runs.
- UI changes must be checked at the affected desktop/tablet viewport; retain natural scrolling, touch targets, editor reachability, and keyboard-safe layout.
- Report exactly which checks ran and their outcomes. Do not imply that a broader suite passed when only targeted checks ran.
