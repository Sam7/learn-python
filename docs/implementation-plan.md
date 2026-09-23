# Python Steps implementation plan

## Milestones

- [x] Foundation: React, TypeScript, Vite, Tailwind, local UI primitives, test harness
- [x] Python execution spike: Pyodide in a typed Web Worker
- [x] Python runner: loading, output, errors, timeout recovery
- [x] Lesson engine: data-driven definitions, validation, first vertical slice
- [x] Additional lessons: text, maths, and variables through definitions
- [x] Persistence: versioned localStorage repository, restore, reset, migration safety
- [x] iPad refinement: portrait/landscape layout, scrolling, touch-sized controls
- [x] Polish and regression: screenshots, accessibility, full test/build/lint review
- [x] Curriculum refactor: typed curriculum/module model, eight-module pathway, and responsive curriculum navigator
- [x] General Python input: live worker prompts, transcript fallback, cancellation, and behavior validation
- [x] Activity-based curriculum engine: ordered lesson steps, interleaved content blocks, reusable activity types, immediate assessment, and per-activity progress
- [x] Integrated learning workspace: code and output together, nearby assessment feedback, and sticky task progress/navigation
- [x] Documentation and authoring workflow for adding lessons without lesson-specific UI
- [ ] Author and validate the full Curriculum 1 pathway from `docs/curriculum-01.md`

## Working decisions

- Pyodide is loaded from a pinned CDN URL behind the `PythonRunner` boundary so it can be self-hosted later.
- Curriculum content is plain data: ordered lessons contain ordered steps, short content blocks, and at most one reusable activity per step. The application shell does not know lesson-specific rules.
- The curriculum is owned by `src/curriculum/`; generic learning components render activity kinds while pure progression and assessment logic operate on typed definitions. Five fundamentals lessons and four text-input lessons are available; remaining pathway content is structured as future data.
- The progress repository accepts the complete curriculum so saved code remains compatible with future lessons while current/completed navigation only uses available lessons.
- The page uses natural document scrolling with `min-height: 100dvh` rather than trapping the learner in a fixed-height editor workspace.
- Local UI primitives follow shadcn/ui conventions and are deliberately small for this focused product.
- Python input is a runner capability, not lesson-specific UI. Cross-origin-isolated browsers use a shared-memory prompt bridge; other browsers use one transcript line per stdin read.
- Code activities are assessed on Run; deterministic choice and arrange-code activities assess on response. Prediction and trace activities use real worker execution. Optional reflections are saved but never gate progression.
- Progress schema v2 stores lesson/step position and each activity's code, response, hint count, and completion. V1 lesson completion/code is migrated to the matching v2 activity IDs.

## Evidence log

- Initial repository was empty; Vite React/TypeScript scaffold created on 2026-09-23.
- Initial Vite 8 build failed because the workspace Node version is 20.18.0 and the Rolldown native optional dependency was unavailable; Vite 6 is pinned for compatibility.
- Pyodide 0.27.5 runs in a module Web Worker; the browser suite proves stdout, validation, syntax errors, timeout recovery, and a fresh run after timeout.
- A controlled-editor lesson reset effect initially overwrote multiline edits; it was replaced with event-driven lesson selection/reset handling.
- Pyodide's batched stdout callback omits line separators; the worker restores them so multi-line `print()` challenges validate correctly.
- Chromium and WebKit tablet screenshots were inspected for desktop, iPad landscape, and iPad portrait layouts.
- The curriculum navigator uses a compact sidebar at desktop/tablet landscape widths and a bottom-sheet lesson chooser at portrait widths. Playwright covers opening and closing the portrait navigator without introducing page overflow.
- The input runner uses Pyodide's pinned stdin support for repeated line reads, captures prompts separately from program stdout, and behavior-checks input lessons with hidden answers, multiple-input requirements, and answer reuse.
- The learning workspace keeps code beside its output and assessment feedback; Reset code stays with the editor. The sticky footer communicates required-task progress and provides Previous/Next step navigation.
- Python input remains fully supported, but entered values are intentionally not rendered in Output; the output area shows program stdout, errors, duration, and validation feedback only.
- The variable lesson's state prediction/trace tasks read actual line snapshots and local values captured by Pyodide in the worker, rather than simulating Python behavior in TypeScript.
- Current verification: 28 unit tests pass; the full Playwright matrix passed with 6 tests and 9 expected browser-specific skips; TypeScript and production build pass; lint passes. Desktop, iPad landscape, and iPad portrait screenshots were captured and inspected in `artifacts/screenshots/`.

## Next curriculum authoring

Translate the learning sequence in `docs/curriculum-01.md` into short, ordered steps and generic activities. Begin with the next ready module/lesson; author one lesson at a time with assessment cases and tests before marking it available. Keep the user-facing explanation/task brief, and make completion criteria explicit. Do not add a new React component for ordinary lesson content.
