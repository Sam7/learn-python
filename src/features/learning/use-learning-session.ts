import { useCallback, useMemo, useRef, useState } from 'react'
import {
  allLessons,
  curriculum,
  getCompletedLessonIds,
  getFirstReadyLesson,
  getLessonById,
  getLessonLocation,
  getNextLesson,
  getRequiredActivityIds,
  getStepById,
  isLessonComplete,
} from '../../curriculum/curriculum'
import type { LearningActivity, LearnerResponse, ValidationResult } from '../../curriculum/types'
import { assessActivity } from '../lessons/validators/activity-validator'
import { createProgressRepository, type LearnerProgress } from '../progress/progress-store'
import { usePythonRunner } from '../python/python-runner/use-python-runner'
import type { PythonInputRequest, PythonRunRequest, PythonRunResult } from '../python/python-runner/types'
import { canOpenLesson, getAdvanceTarget, getPreviousStep, getStepProgress } from './domain/progression'

interface PendingInput {
  activityId: string
  request: PythonInputRequest
  resolve: (answer: string) => void
  reject: (error: Error) => void
}

export function useLearningSession() {
  const repository = useMemo(() => createProgressRepository(window.localStorage, allLessons), [])
  const [initialProgress] = useState(() => repository.load())
  const [progress, setProgress] = useState(initialProgress)
  const progressRef = useRef(progress)
  const [transcriptByActivity, setTranscriptByActivity] = useState<Record<string, string>>({})
  const [executionByActivity, setExecutionByActivity] = useState<Record<string, PythonRunResult | null>>({})
  const [feedbackByActivity, setFeedbackByActivity] = useState<Record<string, ValidationResult | null>>({})
  const [runningActivityId, setRunningActivityId] = useState<string | null>(null)
  const [pendingInput, setPendingInput] = useState<PendingInput | null>(null)
  const [answerValue, setAnswerValue] = useState('')
  const pendingInputRef = useRef<PendingInput | null>(null)
  const operationId = useRef(0)
  const { run, cancel, interactiveInput, runtimeStatus, runtimeError } = usePythonRunner()

  const activeLesson = getLessonById(progress.currentLessonId) ?? getFirstReadyLesson() ?? allLessons[0]
  const activeLocation = getLessonLocation(activeLesson.id)
  const activeModule = activeLocation?.module ?? curriculum.modules[0]
  const currentStepId = progress.currentStepByLesson[activeLesson.id] ?? activeLesson.steps[0]?.id ?? ''
  const activeStep = getStepById(activeLesson, currentStepId) ?? activeLesson.steps[0]
  const activity = activeStep?.activity
  const activityState = activity ? progress.activityProgress[activity.id] : undefined
  const code = activity?.kind === 'code' ? activityState?.code ?? activity.starterCode : ''
  const defaultInputs = activity && 'sampleInputs' in activity ? activity.sampleInputs ?? [] : []
  const transcriptValue = activity ? transcriptByActivity[activity.id] ?? defaultInputs.join('\n') : ''
  const execution = activity ? executionByActivity[activity.id] ?? null : null
  const savedFeedback = activity ? feedbackByActivity[activity.id] : null
  const completedActivityIds = progress.completedActivityIds
  const completedLessonIds = useMemo(() => getCompletedLessonIds(completedActivityIds), [completedActivityIds])
  const currentStepProgress = getStepProgress(activeLesson, currentStepId, completedActivityIds)
  const nextLesson = getNextLesson(activeLesson.id)
  const nextLessonLocation = nextLesson ? getLessonLocation(nextLesson.id) : undefined
  const nextModule = nextLessonLocation?.module
  const isBusy = runningActivityId !== null
  const isWaitingForInput = pendingInput?.activityId === activity?.id
  const canAdvance = currentStepProgress.canAdvance && !isBusy
  const nextLabel = currentStepProgress.nextStep
    ? 'Next step'
    : nextLesson
      ? nextModule?.id !== activeModule.id ? 'Next chapter' : 'Next lesson'
      : 'Course complete'
  const feedback = savedFeedback ?? (activity && completedActivityIds.includes(activity.id)
    ? { passed: true, message: 'This task is complete. You can revisit it any time.' }
    : null)

  const commitProgress = useCallback((update: (current: LearnerProgress) => LearnerProgress) => {
    const next = update(progressRef.current)
    progressRef.current = next
    setProgress(next)
    try {
      repository.save(next)
    } catch {
      // Keep the learning session usable if localStorage is unavailable or full.
    }
  }, [repository])

  const setActivityState = useCallback((activityId: string, update: (current: LearnerProgress['activityProgress'][string]) => LearnerProgress['activityProgress'][string]) => {
    commitProgress((current) => ({
      ...current,
      activityProgress: {
        ...current.activityProgress,
        [activityId]: update(current.activityProgress[activityId] ?? {}),
      },
    }))
  }, [commitProgress])

  const markActivityComplete = useCallback((activityId: string) => {
    commitProgress((current) => current.completedActivityIds.includes(activityId)
      ? current
      : { ...current, completedActivityIds: [...current.completedActivityIds, activityId] })
  }, [commitProgress])

  const stopRun = useCallback(() => {
    operationId.current += 1
    pendingInputRef.current?.reject(new Error('The input request was cancelled.'))
    pendingInputRef.current = null
    setPendingInput(null)
    setAnswerValue('')
    setRunningActivityId(null)
    cancel()
  }, [cancel])

  const handleCodeChange = useCallback((value: string) => {
    if (!activity || activity.kind !== 'code') return
    setActivityState(activity.id, (current) => ({ ...current, code: value }))
    setFeedbackByActivity((current) => ({ ...current, [activity.id]: null }))
  }, [activity, setActivityState])

  const handleResponseChange = useCallback((value: LearnerResponse) => {
    if (!activity) return
    setActivityState(activity.id, (current) => ({ ...current, response: value }))
    setFeedbackByActivity((current) => ({ ...current, [activity.id]: null }))
  }, [activity, setActivityState])

  const handleTranscriptChange = useCallback((value: string) => {
    if (activity) setTranscriptByActivity((current) => ({ ...current, [activity.id]: value }))
  }, [activity])

  const completeWithFeedback = useCallback((activityToComplete: LearningActivity, result: ValidationResult) => {
    setFeedbackByActivity((current) => ({ ...current, [activityToComplete.id]: result }))
    if (result.passed && activityToComplete.required) markActivityComplete(activityToComplete.id)
  }, [markActivityComplete])

  const makeInputHandler = useCallback((activityId: string) => (request: PythonInputRequest) => new Promise<string>((resolve, reject) => {
    const next = { activityId, request, resolve, reject }
    pendingInputRef.current = next
    setPendingInput(next)
    setAnswerValue('')
  }), [])

  const handleInputCancel = useCallback((message: string) => {
    pendingInputRef.current?.reject(new Error(message))
    pendingInputRef.current = null
    setPendingInput(null)
    setAnswerValue('')
  }, [])

  const submitInputAnswer = useCallback(() => {
    const pending = pendingInputRef.current
    if (!pending) return
    pendingInputRef.current = null
    setPendingInput(null)
    setAnswerValue('')
    pending.resolve(answerValue)
  }, [answerValue])

  const cancelInputRun = useCallback(() => {
    pendingInputRef.current?.reject(new Error('The input request was cancelled.'))
    pendingInputRef.current = null
    setPendingInput(null)
    setAnswerValue('')
    stopRun()
  }, [stopRun])

  const runPython = useCallback((request: PythonRunRequest) => run({
    ...request,
    input: request.input ?? { mode: 'transcript', lines: [] },
  }), [run])

  const runActivity = useCallback(async () => {
    if (!activity || activity.kind === 'choice' || activity.kind === 'arrange-code' || activity.kind === 'reflection') return
    if (runtimeStatus !== 'ready') return

    const currentActivity = activity
    const source = currentActivity.kind === 'code' ? code : currentActivity.code
    const shouldTrace = currentActivity.kind === 'trace'
      || currentActivity.kind === 'predict-state'
      || (currentActivity.kind === 'code' && currentActivity.executionMode === 'trace')
    const inputs = transcriptValue.length ? transcriptValue.split('\n') : []
    const request: PythonRunRequest = {
      code: source,
      input: interactiveInput ? { mode: 'interactive' } : { mode: 'transcript', lines: inputs },
      trace: shouldTrace,
    }

    const runToken = ++operationId.current
    setRunningActivityId(currentActivity.id)
    setExecutionByActivity((current) => ({ ...current, [currentActivity.id]: null }))
    setFeedbackByActivity((current) => ({ ...current, [currentActivity.id]: null }))

    const result = await run(request, interactiveInput
      ? { onInputRequest: makeInputHandler(currentActivity.id), onInputCancel: handleInputCancel }
      : undefined)
    if (operationId.current !== runToken) return

    setExecutionByActivity((current) => ({ ...current, [currentActivity.id]: result }))
    pendingInputRef.current = null
    setPendingInput(null)
    setRunningActivityId(null)

    if (currentActivity.kind === 'trace') return

    const response = progressRef.current.activityProgress[currentActivity.id]?.response
    const resultOfAssessment = await assessActivity(currentActivity, {
      response,
      code: currentActivity.kind === 'code' ? source : undefined,
      execution: result,
      runPython,
    })
    if (operationId.current !== runToken) return
    completeWithFeedback(currentActivity, resultOfAssessment)
  }, [activity, code, completeWithFeedback, handleInputCancel, interactiveInput, makeInputHandler, progressRef, run, runPython, runtimeStatus, transcriptValue])

  const assessResponse = useCallback(async (response: LearnerResponse) => {
    if (!activity || activity.kind === 'code' || activity.kind === 'predict-output' || activity.kind === 'predict-state' || activity.kind === 'trace' || activity.kind === 'reflection') return
    const currentActivity = activity
    handleResponseChange(response)
    const result = await assessActivity(currentActivity, {
      response,
      execution: { status: 'success', stdout: '', stderr: '', inputTranscript: [], durationMs: 0 },
      runPython,
    })
    completeWithFeedback(currentActivity, result)
  }, [activity, completeWithFeedback, handleResponseChange, runPython])

  const resetCode = useCallback(() => {
    if (!activity || activity.kind !== 'code') return
    setActivityState(activity.id, (current) => ({
      ...current,
      code: activity.starterCode,
      hintsRevealed: 0,
    }))
    setExecutionByActivity((current) => ({ ...current, [activity.id]: null }))
    setFeedbackByActivity((current) => ({ ...current, [activity.id]: null }))
  }, [activity, setActivityState])

  const revealHint = useCallback(() => {
    if (!activity) return
    setActivityState(activity.id, (current) => ({
      ...current,
      hintsRevealed: Math.min((current.hintsRevealed ?? 0) + 1, activity.hints?.length ?? 0),
    }))
  }, [activity, setActivityState])

  const goToStep = useCallback((stepId: string) => {
    if (isBusy) return
    commitProgress((current) => ({
      ...current,
      currentStepByLesson: { ...current.currentStepByLesson, [activeLesson.id]: stepId },
    }))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeLesson.id, commitProgress, isBusy])

  const goNext = useCallback(() => {
    if (!canAdvance) return
    const target = getAdvanceTarget(activeLesson, currentStepId, completedActivityIds)
    if (target.kind === 'step') {
      goToStep(target.step.id)
      return
    }
    if (target.kind === 'lesson') {
      const firstStep = target.lesson.steps[0]
      stopRun()
      commitProgress((current) => ({
        ...current,
        currentLessonId: target.lesson.id,
        currentStepByLesson: {
          ...current.currentStepByLesson,
          ...(firstStep ? { [target.lesson.id]: current.currentStepByLesson[target.lesson.id] ?? firstStep.id } : {}),
        },
      }))
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [activeLesson, canAdvance, completedActivityIds, commitProgress, currentStepId, goToStep, stopRun])

  const goPrevious = useCallback(() => {
    const previous = getPreviousStep(activeLesson, currentStepId)
    if (previous) goToStep(previous.id)
  }, [activeLesson, currentStepId, goToStep])

  const selectLesson = useCallback((lessonId: string) => {
    const selected = getLessonById(lessonId)
    if (!selected || !canOpenLesson(selected, allLessons, completedActivityIds) || isBusy) return
    stopRun()
    commitProgress((current) => ({
      ...current,
      currentLessonId: selected.id,
      currentStepByLesson: {
        ...current.currentStepByLesson,
        [selected.id]: current.currentStepByLesson[selected.id] ?? selected.steps[0]?.id ?? '',
      },
    }))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [commitProgress, completedActivityIds, isBusy, stopRun])

  const resetProgress = useCallback(() => {
    stopRun()
    const next = repository.reset()
    progressRef.current = next
    setProgress(next)
    setExecutionByActivity({})
    setFeedbackByActivity({})
    setTranscriptByActivity({})
    setAnswerValue('')
  }, [repository, stopRun])

  const currentActivityCompleted = activity ? completedActivityIds.includes(activity.id) : false
  const hintsRevealed = activity ? activityState?.hintsRevealed ?? 0 : 0
  const isLessonDone = isLessonComplete(activeLesson, completedActivityIds)
  const moduleProgress = {
    completedCount: completedLessonIds.filter((id) => activeModule.lessons.some((lesson) => lesson.id === id)).length,
    availableCount: activeModule.lessons.filter((lesson) => lesson.status === 'ready').length,
  }
  const advanceState = getAdvanceTarget(activeLesson, currentStepId, completedActivityIds)
  const previousStep = getPreviousStep(activeLesson, currentStepId)

  return {
    curriculum,
    activeLesson,
    activeModule,
    activeStep,
    activity,
    activityProgress: activityState,
    response: activityState?.response,
    code,
    transcriptValue,
    inputInteraction: {
      interactive: interactiveInput,
      transcriptValue,
      onTranscriptChange: handleTranscriptChange,
      pendingRequest: isWaitingForInput ? pendingInput?.request ?? null : null,
      answerValue,
      onAnswerChange: setAnswerValue,
      onSubmitAnswer: submitInputAnswer,
      onCancelRun: cancelInputRun,
    },
    execution,
    feedback,
    runtimeStatus,
    runtimeError,
    isRunning: runningActivityId === activity?.id,
    isBusy,
    isLessonDone,
    currentActivityCompleted,
    completedActivityIds,
    completedLessonIds,
    stepIndex: currentStepProgress.currentIndex,
    totalSteps: currentStepProgress.totalSteps,
    completedRequiredActivities: currentStepProgress.completedRequiredActivities,
    requiredActivities: currentStepProgress.requiredActivities,
    canGoPrevious: Boolean(previousStep) && !isBusy,
    canGoNext: canAdvance && advanceState.kind !== 'course-complete',
    nextLabel,
    nextLessonTitle: nextLesson?.title,
    nextModuleTitle: nextModule?.title,
    moduleProgress,
    hintsRevealed,
    goNext,
    goPrevious,
    selectLesson,
    changeCode: handleCodeChange,
    changeResponse: handleResponseChange,
    assessResponse,
    runActivity,
    resetCode,
    revealHint,
    completeTrace: () => {
      if (!activity || activity.kind !== 'trace') return
      completeWithFeedback(activity, { passed: true, message: 'You traced the program from start to finish.' })
    },
    resetProgress,
    runtimeReady: runtimeStatus === 'ready',
    currentStepId,
    activityId: activity?.id,
    targetRequiredIds: getRequiredActivityIds(activeLesson),
    currentAdvanceTarget: advanceState,
  }
}
