# Python Steps implementation plan

## Milestones

- [x] Foundation: React, TypeScript, Vite, Tailwind, local UI primitives, test harness
- [x] Python execution spike: Pyodide in a typed Web Worker
- [x] Python runner: loading, output, errors, timeout recovery
- [x] Lesson engine: data-driven definitions, validation, first vertical slice
- [x] Persistence: versioned localStorage repository, restore, reset, migration safety
- [x] iPad refinement: portrait/landscape layout, scrolling, touch-sized controls
- [x] Polish and regression: screenshots, accessibility, full test/build/lint review
- [x] Replace the redundant eight-module catalogue with the canonical 12-stage/109-micro-lesson outline
- [x] Stage 0 — The Computer Follows Instructions (six complete lessons)
- [x] Python input infrastructure: repeated interactive prompts and transcript fallback (course introduction is Stage 2)
- [ ] Stage 1 — Values and Expressions (eight lessons)
- [ ] Stage 2 — Names, State, and Input (ten lessons)
- [ ] Stage 3 — Decisions (ten lessons)
- [ ] Stage 4 — Repetition and Time (ten lessons)
- [ ] Stage 5 — Collections (nine lessons)
- [ ] Stage 6 — Functions and Abstraction (ten lessons)
- [ ] Stage 7 — Reusable Algorithmic Patterns (ten lessons)
- [ ] Stage 8 — Representing Information (eight lessons)
- [ ] Stage 9 — Debugging and Correctness (ten lessons)
- [ ] Stage 10 — Designing Programs (ten lessons)
- [ ] Stage 11 — Connecting Programming to the Real World (eight lessons)
- [x] Activity-based lesson engine: ordered steps, content blocks, reusable activities, automatic assessment, and per-activity progress
- [x] Integrated workspace: code and output together, nearby feedback, and sticky task progress/navigation
- [x] Authoring guide and curriculum integrity tests

## Working decisions

- Pyodide is loaded from a pinned CDN URL behind the `PythonRunner` boundary so it can be self-hosted later.
- Curriculum content is plain data: ordered lessons contain ordered steps, short content blocks, and at most one reusable activity per step. The application shell does not know lesson-specific rules.
- Curriculum stages and lesson data are owned by `src/curriculum/stages/`; generic learning components render activities while progression and assessment operate on typed definitions. Stage 0 is ready. Future stage/lesson IDs and titles mirror the source specification and remain unavailable until their full learning journeys are authored.
- The progress repository accepts the complete curriculum so saved code remains compatible with future lessons while current/completed navigation only uses available lessons.
- The page uses natural document scrolling with `min-height: 100dvh` rather than trapping the learner in a fixed-height editor workspace.
- Local UI primitives follow shadcn/ui conventions and are deliberately small for this focused product.
- Python input is a runner capability, not lesson-specific UI. Cross-origin-isolated browsers use a shared-memory prompt bridge; other browsers use one transcript line per stdin read.
- Code activities are assessed on Run; deterministic choice and arrange-code activities assess on response. Prediction and trace activities use real worker execution. Optional reflections are saved but never gate progression.
- Progress schema v2 stores lesson/step position and each activity's code, response, hint count, and completion. V1 lesson completion/code is migrated to the matching v2 activity IDs.
- The curriculum now uses `Stage`/`Curriculum.stages` rather than the redundant pre-specification module taxonomy. The aligned original first lesson retains its lesson, step, and activity IDs so existing local progress for that item can still restore.
- Stage 0 uses existing generic activity primitives. Planned capability work is deliberately staged: learner-filled trace tables before Stage 2; richer AST structural requirements before lessons that assess taught syntax; project requirements and acceptance-test authoring before Stage 10; and a minimal multi-file editor plus durable virtual files before Stage 11.

## Evidence log

- Initial repository was empty; Vite React/TypeScript scaffold created on 2026-09-23.
- Initial Vite 8 build failed because the workspace Node version is 20.18.0 and the Rolldown native optional dependency was unavailable; Vite 6 is pinned for compatibility.
- Pyodide 0.27.5 runs in a module Web Worker; the browser suite proves stdout, validation, syntax errors, timeout recovery, and a fresh run after timeout.
- A controlled-editor lesson reset effect initially overwrote multiline edits; it was replaced with event-driven lesson selection/reset handling.
- Pyodide's batched stdout callback omits line separators; the worker restores them so multi-line `print()` challenges validate correctly.
- Chromium and WebKit tablet screenshots were inspected for desktop, iPad landscape, and iPad portrait layouts.
- The curriculum navigator uses a compact sidebar at desktop/tablet landscape widths and a bottom-sheet lesson chooser at portrait widths. Playwright covers opening and closing the portrait navigator without introducing page overflow.
- The input runner uses Pyodide's pinned stdin support for repeated line reads and transcript fallback. Stage 2 will introduce input as curriculum content; prior prototype input lessons were removed with the redundant module catalogue.
- The learning workspace keeps code beside its output and assessment feedback; Reset code stays with the editor. The sticky footer communicates required-task progress and provides Previous/Next step navigation.
- Python input remains fully supported, but entered values are intentionally not rendered in Output; the output area shows program stdout, errors, duration, and validation feedback only.
- The worker can capture real Python line snapshots and local values. The earlier prototype's variable lesson was removed; Stage 2 will use this runner capability in its authored state/trace activities.
- Stage 0 assessment uses exact-baseline rejection for the open experiment (so duplicate/reordered output is accepted) and counts actual output rows, including blank rows, for the three-line creation challenge.
- The old version-1 progress migration continues to preserve compatible first-lesson completion/code and filters removed lesson IDs safely.
- Curriculum parity tests read `docs/curriculum-01.md` and compare every Stage heading and all 109 ordered micro-lesson headings to the typed outline.
- Stage 0 verification: 32 unit tests pass; Playwright passes 6 tests with 9 intentional browser-specific skips; lint and TypeScript/build pass. Desktop, iPad landscape, and iPad portrait screenshots were captured and inspected. Vite reports a non-blocking main-chunk size advisory.

## Next stage and capability gates

Implement all eight Stage 1 lessons from `docs/curriculum-01.md`, preserving their order and using a short sequence of generic prediction, observation, and code activities. Before publishing Stage 1, add the non-interactive expression-reduction content primitive required by 1.3; do not try to represent intermediate expression values as fake Python trace frames.

Before the stage that needs them, implement and test reusable capabilities rather than lesson-specific components:

- Before Stage 2: a learner-filled trace-table activity checked against real worker trace frames, including multiple variables/checkpoints.
- Before Stage 3: structured Python-AST requirements and a branch/path trace presentation for executed versus skipped lines.
- Before Stages 9–10: evidence-oriented debugging interactions and a reusable project brief/acceptance-case flow; open explanations must remain learner-owned, not auto-graded as semantic truth.
- Before Stage 11: scoped multi-file editing and persistent virtual files, with explicit run/reset/recovery boundaries. Prove Pyodide filesystem persistence before authoring the disk lesson.

Author one complete stage at a time. Tests must cover data integrity, every task's completion contract, behavior validators, persistence, and at least one real-browser Python journey per stage. Mark a stage ready only after its full chapter test and desktop/iPad visual review pass.
