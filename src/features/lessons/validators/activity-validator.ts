import type {
  ArrangeCodeActivity,
  AstRequirement,
  BranchTraceActivity,
  CodeActivity,
  LearningActivity,
  LearnerResponse,
  OutputExpectation,
  PredictStateActivity,
  TraceTableActivity,
  ValidationResult,
} from '../../../curriculum/types'
import type { PythonRunRequest, PythonRunResult, PythonTraceValue } from '../../python/python-runner/types'
import { resolveBranchPath } from '../../learning/domain/branch-trace'

export interface ActivityAssessmentContext {
  response?: LearnerResponse
  code?: string
  execution: PythonRunResult
  runPython: (request: PythonRunRequest) => Promise<PythonRunResult>
}

function normalizedOutput(value: string): string {
  return value.replace(/\r\n/g, '\n').trimEnd()
}

function countOccurrences(text: string, value: string): number {
  if (!value) return 0
  let count = 0
  let offset = 0
  while (offset <= text.length - value.length) {
    const index = text.indexOf(value, offset)
    if (index < 0) break
    count += 1
    offset = index + value.length
  }
  return count
}

function expectationMatches(expectation: OutputExpectation, stdout: string): boolean {
  const output = normalizedOutput(stdout)
  if (expectation.mode === 'exact') return output === expectation.lines.join('\n')
  if (expectation.mode === 'contains') return expectation.values.every((value) => output.includes(value))
  const lines = outputLines(stdout)
  if (expectation.mode === 'line-count') return lines.length === expectation.count
  if (expectation.mode === 'distinct-lines') {
    const values = lines.map((line) => line.trim())
    return values.length === expectation.count && values.every(Boolean) && new Set(values).size === expectation.count
  }
  return lines.some((line) => line.trim().length > 0)
}

function outputLines(stdout: string): string[] {
  const output = stdout.replace(/\r\n/g, '\n')
  if (output.length === 0) return []
  return (output.endsWith('\n') ? output.slice(0, -1) : output).split('\n')
}

function expectationDescription(expectation: OutputExpectation): string {
  if (expectation.mode === 'exact') return expectation.lines.join('\n')
  if (expectation.mode === 'contains') return `Output includes: ${expectation.values.join(', ')}`
  if (expectation.mode === 'line-count') return `${expectation.count} output line${expectation.count === 1 ? '' : 's'}`
  if (expectation.mode === 'distinct-lines') return `${expectation.count} different non-empty output lines`
  return 'some non-empty output'
}

function failedExecution(result: PythonRunResult): ValidationResult {
  return {
    passed: false,
    message: result.status === 'timeout'
      ? 'Your program took too long. It may be stuck in an endless loop.'
      : 'Python could not run this yet. Take a look at the error below.',
  }
}

function validateOutputActivity(activity: CodeActivity, stdout: string): ValidationResult {
  const assessment = activity.assessment
  if (assessment.kind !== 'output') return { passed: false, message: 'This code task needs a different assessment.' }
  const output = normalizedOutput(stdout)
  if (assessment.rejectExact?.some((rejected) => output === rejected)) {
    return { passed: false, message: 'That is still the example answer. Change it to make it your own.' }
  }
  return expectationMatches(assessment.expectation, stdout)
    ? { passed: true, message: 'Great work — your program behaves as requested.' }
    : {
        passed: false,
        message: 'The result is not quite right yet. Compare your output with the task and try again.',
        evidence: { expected: expectationDescription(assessment.expectation), actual: output || '(no output)' },
      }
}

function pythonAstCheck(source: string, requirement: AstRequirement): string {
  const literal = JSON.stringify(source)
const conceptCheck = requirement === 'comparison' ? `
if not any(isinstance(node, ast.Compare) for node in ast.walk(tree)):
    raise AssertionError("Use a comparison such as >, <, ==, or >=.")
` : requirement === 'boolean-value' ? `
boolean_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Constant)
    and type(node.value.value) is bool
    for target in node.targets
    if isinstance(target, ast.Name)
}
printed_names = {
    child.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    for argument in node.args
    for child in ast.walk(argument)
    if isinstance(child, ast.Name)
}
if not boolean_names.intersection(printed_names):
    raise AssertionError("Save True or False in a name, then print that name.")
` : requirement === 'conditional' ? `
if not any(isinstance(node, ast.If) for node in ast.walk(tree)):
    raise AssertionError("Use an if statement to make a decision.")
` : requirement === 'if-else' ? `
if not any(isinstance(node, ast.If) and bool(node.orelse) for node in ast.walk(tree)):
    raise AssertionError("Add an else path so both outcomes have an instruction.")
` : requirement === 'elif' ? `
import io
import tokenize
has_elif = any(
    token.type == tokenize.NAME and token.string == "elif"
    for token in tokenize.generate_tokens(io.StringIO(source).readline)
)
if not has_elif:
    raise AssertionError("Use elif to add another path between if and else.")
` : requirement === 'logical-and' ? `
if not any(isinstance(node, ast.BoolOp) and isinstance(node.op, ast.And) for node in ast.walk(tree)):
    raise AssertionError("Use and to require both conditions to be true.")
` : requirement === 'logical-or' ? `
if not any(isinstance(node, ast.BoolOp) and isinstance(node.op, ast.Or) for node in ast.walk(tree)):
    raise AssertionError("Use or when either condition can be enough.")
` : requirement === 'logical-not' ? `
if not any(isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not) for node in ast.walk(tree)):
    raise AssertionError("Use not to check the opposite of a True or False value.")
` : requirement === 'for-loop' ? `
if not any(isinstance(node, ast.For) for node in ast.walk(tree)):
    raise AssertionError("Use a for loop to repeat the instruction.")
` : requirement === 'range-call' ? `
if not any(
    isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "range"
    for node in ast.walk(tree)
):
    raise AssertionError("Use range() to choose how many repetitions to make.")
` : requirement === 'while-loop' ? `
if not any(isinstance(node, ast.While) for node in ast.walk(tree)):
    raise AssertionError("Use while to repeat as long as a question stays True.")
` : requirement === 'list-literal' ? `
list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not list_names:
    raise AssertionError("Create a list and give it a name.")
if not any(
    isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    and any(isinstance(child, ast.Name) and child.id in list_names for arg in node.args for child in ast.walk(arg))
    for node in ast.walk(tree)
):
    raise AssertionError("Print the name of your list.")
` : requirement === 'list-index' ? `
list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(node, ast.Subscript) and isinstance(node.value, ast.Name) and node.value.id in list_names
    for node in ast.walk(tree)
):
    raise AssertionError("Use square brackets to get an item from your list by its position.")
` : requirement === 'subscript' ? `
if not any(isinstance(node, ast.Subscript) for node in ast.walk(tree)):
    raise AssertionError("Use square brackets to get an item by its position.")
` : requirement === 'sequence-loop' ? `
sequence_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    and (isinstance(node.value, ast.List) or (isinstance(node.value, ast.Constant) and isinstance(node.value.value, str)))
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(node, ast.For) and isinstance(node.iter, ast.Name) and node.iter.id in sequence_names
    for node in ast.walk(tree)
):
    raise AssertionError("Use for item in your_list to visit each value in the collection.")
` : requirement === 'length-call' ? `
if not any(
    isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "len"
    for node in ast.walk(tree)
):
    raise AssertionError("Use len() to find how many values are in the collection.")
` : requirement === 'membership-test' ? `
if not any(
    isinstance(node, ast.Compare) and any(isinstance(operator, ast.In) for operator in node.ops)
    for node in ast.walk(tree)
):
    raise AssertionError("Use in to check whether a value is in the collection.")
` : requirement === 'append-call' ? `
list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(node, ast.Call)
    and isinstance(node.func, ast.Attribute)
    and node.func.attr == "append"
    and isinstance(node.func.value, ast.Name)
    and node.func.value.id in list_names
    for node in ast.walk(tree)
):
    raise AssertionError("Use shopping.append(item) to add an item to the list.")
` : requirement === 'variable-in-sentence' ? `
variable_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    for target in node.targets
    if isinstance(target, ast.Name)
    and isinstance(node.value, ast.Constant)
    and isinstance(node.value.value, str)
    and len(node.value.value.strip()) > 0
}

def has_variable(node):
    return any(isinstance(child, ast.Name) and child.id in variable_names for child in ast.walk(node))

def has_sentence_text(node):
    return any(
        isinstance(child, ast.Constant) and isinstance(child.value, str) and child.value.strip()
        for child in ast.walk(node)
    )

if not any(
    isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    and any(has_variable(argument) for argument in node.args)
    and any(has_sentence_text(argument) for argument in node.args)
    for node in ast.walk(tree)
):
    raise AssertionError("Put your text variable inside a sentence that you print.")
` : requirement === 'named-value' ? `
assigned_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    for target in node.targets
    if isinstance(target, ast.Name)
}
printed_names = {
    child.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    for argument in node.args
    for child in ast.walk(argument)
    if isinstance(child, ast.Name)
}
if not assigned_names.intersection(printed_names):
    raise AssertionError("Give a value a name, then print that name.")
` : requirement === 'variable-reassignment' ? `
assignment_counts = {}
for node in ast.walk(tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                assignment_counts[target.id] = assignment_counts.get(target.id, 0) + 1
printed_names = {
    child.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    for argument in node.args
    for child in ast.walk(argument)
    if isinstance(child, ast.Name)
}
if not any(count >= 2 and name in printed_names for name, count in assignment_counts.items()):
    raise AssertionError("Change the same named value, then print it.")
` : requirement === 'variable-increment' ? `
incremented_names = set()
for node in ast.walk(tree):
    if not isinstance(node, ast.Assign) or not isinstance(node.value, ast.BinOp):
        continue
    if not isinstance(node.value.op, ast.Add) or not isinstance(node.value.left, ast.Name):
        continue
    if not isinstance(node.value.right, ast.Constant) or node.value.right.value != 1:
        continue
    for target in node.targets:
        if isinstance(target, ast.Name) and target.id == node.value.left.id:
            incremented_names.add(target.id)
printed_names = {
    child.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    for argument in node.args
    for child in ast.walk(argument)
    if isinstance(child, ast.Name)
}
if not incremented_names.intersection(printed_names):
    raise AssertionError("Add 1 to the value the same name already holds, then print it.")
` : ''

  const textVariableCheck = requirement === 'text-variable' || requirement === 'variable-in-sentence'
    ? `
if not has_text_variable:
    raise AssertionError("Create a variable containing some text first.")`
    : ''

  return `
import ast
source = ${literal}
tree = ast.parse(source)
has_text_variable = any(
    isinstance(node, ast.Assign)
    and any(isinstance(target, ast.Name) for target in node.targets)
    and isinstance(node.value, ast.Constant)
    and isinstance(node.value.value, str)
    and len(node.value.value.strip()) > 0
    for node in ast.walk(tree)
)
${textVariableCheck}
${conceptCheck}
`
}

function astAssessmentMessage(requirement: AstRequirement, passed: boolean): string {
  if (passed) {
    const messages: Record<AstRequirement, string> = {
      'text-variable': 'Great work — you created and used a text variable.',
      'variable-in-sentence': 'Great work — your sentence uses the text value.',
      'named-value': 'Great work — you gave a value a name and used it.',
      'variable-reassignment': 'Great work — the same named value changes as the program runs.',
      'variable-increment': 'Great work — you added 1 to the value the name already held.',
      comparison: 'Great work — your program asks Python to compare values.',
      'boolean-value': 'Great work — you used a True or False value.',
      conditional: 'Great work — your program uses an if statement.',
      'if-else': 'Great work — your program handles both paths with if and else.',
      elif: 'Great work — your program uses elif for an extra path.',
      'logical-and': 'Great work — your program combines conditions with and.',
      'logical-or': 'Great work — your program combines conditions with or.',
      'logical-not': 'Great work — your program checks the opposite with not.',
      'for-loop': 'Great work — your program repeats instructions with for.',
      'range-call': 'Great work — range() controls the repetitions.',
      'while-loop': 'Great work — your program repeats while its question stays True.',
      'list-literal': 'Great work — your program creates and prints a list.',
      'list-index': 'Great work — you used a position to get an item from the list.',
      subscript: 'Great work — you used a position to get an item.',
      'sequence-loop': 'Great work — your loop visits each value in the collection.',
      'length-call': 'Great work — len() counts the values in the collection.',
      'membership-test': 'Great work — your program checks whether a value is in the collection.',
      'append-call': 'Great work — append() adds an item to the list.',
    }
    return messages[requirement]
  }

  const messages: Record<AstRequirement, string> = {
    'text-variable': 'Create a variable containing text, then use its name in your program.',
    'variable-in-sentence': 'Put your text variable inside a sentence that you print.',
    'named-value': 'Give a value a name, then use that name in print().',
    'variable-reassignment': 'Assign a new value to the same name, then print the name.',
    'variable-increment': 'Use the current value on the right side: score = score + 1.',
    comparison: 'Use a comparison such as >, <, ==, or >=.',
    'boolean-value': 'Use the Python value True or False.',
    conditional: 'Use an if statement to make a decision.',
    'if-else': 'Add an else path so both outcomes have an instruction.',
    elif: 'Use elif to add another path between if and else.',
    'logical-and': 'Use and to require both conditions to be true.',
    'logical-or': 'Use or when either condition can be enough.',
    'logical-not': 'Use not to check the opposite of a True or False value.',
    'for-loop': 'Use a for loop to repeat the instruction.',
    'range-call': 'Use range() to choose how many repetitions to make.',
    'while-loop': 'Use while to repeat as long as a question stays True.',
    'list-literal': 'Create a list, give it a name, and print that name.',
    'list-index': 'Use square brackets and a position to get an item from the list.',
    subscript: 'Use square brackets and a position to get an item.',
    'sequence-loop': 'Use for item in your_list to visit each value in the collection.',
    'length-call': 'Use len() to find how many values are in the collection.',
    'membership-test': 'Use in to check whether a value is in the collection.',
    'append-call': 'Use list_name.append(item) to add an item to the list.',
  }
  return messages[requirement]
}

async function validateCodeActivity(
  activity: CodeActivity,
  context: ActivityAssessmentContext,
): Promise<ValidationResult> {
  const assessment = activity.assessment
  if (assessment.kind === 'timeout') {
    if (context.execution.status === 'timeout') {
      return { passed: true, message: 'Good observation — Python stopped this run at the time limit.' }
    }
    if (context.execution.status === 'success') {
      return { passed: false, message: 'This program finished before the time limit. Make the loop condition stay True.' }
    }
    return failedExecution(context.execution)
  }
  if (assessment.kind === 'runtime-error') {
    const errorLines = context.execution.error?.split('\n').map((line) => line.trimStart()) ?? []
    const expectedError = errorLines.some((line) => line.startsWith(`${assessment.exceptionName}:`))
    if (context.execution.status === 'error' && expectedError) {
      return { passed: true, message: `Good observation — Python raised the expected ${assessment.exceptionName}.` }
    }
    if (context.execution.status === 'success') {
      return {
        passed: false,
        message: 'Python ran this program, but this task is about noticing an error.',
        evidence: { expected: assessment.exceptionName, actual: 'The program ran successfully.' },
      }
    }
    if (context.execution.status === 'error') {
      return {
        passed: false,
        message: 'Python showed a different error. Read the message and try the example again.',
        evidence: { expected: assessment.exceptionName, actual: context.execution.error ?? 'An unknown error occurred.' },
      }
    }
    return failedExecution(context.execution)
  }

  if (context.execution.status !== 'success') return failedExecution(context.execution)
  const source = context.code ?? activity.starterCode

  if (assessment.kind === 'output') return validateOutputActivity(activity, context.execution.stdout)

  if (assessment.kind === 'output-and-ast' && !expectationMatches(assessment.expectation, context.execution.stdout)) {
    return {
      passed: false,
      message: 'The output is not quite right yet. Compare it with the task and try again.',
      evidence: { expected: expectationDescription(assessment.expectation), actual: normalizedOutput(context.execution.stdout) || '(no output)' },
    }
  }

  if (assessment.kind === 'ast' || assessment.kind === 'output-and-ast') {
    if (assessment.kind === 'ast' && assessment.rejectOutput?.some((rejected) => normalizedOutput(context.execution.stdout).includes(rejected))) {
      return { passed: false, message: 'Change the example value to something of your own.' }
    }
    const result = await context.runPython({ code: pythonAstCheck(source, assessment.requirement) })
    return {
      passed: result.status === 'success',
      message: astAssessmentMessage(assessment.requirement, result.status === 'success'),
    }
  }

  for (const testCase of assessment.cases) {
    const result = await context.runPython({
      code: source,
      input: { mode: 'transcript', lines: testCase.inputs },
    })
    if (result.status !== 'success') {
      return { passed: false, message: 'Python could not test that yet. Make sure your input() calls have answers.' }
    }

    const stdout = normalizedOutput(result.stdout)
    const requiredInputs = testCase.requiredInputs ?? []
    const inputTranscriptHasAnswers = requiredInputs.every(({ inputIndex }) =>
      result.inputTranscript.some((entry) => entry.inputIndex === inputIndex),
    )
    const echoedAnswersUsed = requiredInputs.filter(({ mustAppearInOutput = true }) => mustAppearInOutput).every(({ inputIndex, minimumOccurrences = 1 }) => {
      const answer = testCase.inputs[inputIndex]
      return typeof answer === 'string' && countOccurrences(stdout, answer) >= minimumOccurrences
    })
    const outputIsCorrect = !testCase.output || expectationMatches(testCase.output, result.stdout)

    if (!inputTranscriptHasAnswers) {
      return { passed: false, message: `Ask for all ${requiredInputs.length} answers before your program finishes.` }
    }
    if (!echoedAnswersUsed || !outputIsCorrect) {
      return {
        passed: false,
        message: requiredInputs.length > 0
          ? 'Use the answers where they affect your program, then compare the result with the task.'
          : 'The result is not quite right yet. Compare your output with the task and try again.',
        evidence: testCase.output
          ? { expected: expectationDescription(testCase.output), actual: stdout || '(no output)' }
          : undefined,
      }
    }
  }

  for (const requirement of assessment.requirements ?? []) {
    const result = await context.runPython({ code: pythonAstCheck(source, requirement) })
    if (result.status !== 'success') {
      return { passed: false, message: astAssessmentMessage(requirement, false) }
    }
  }

  return { passed: true, message: 'Great work — your program works with different answers.' }
}

function responseText(response: LearnerResponse | undefined): string | undefined {
  return typeof response === 'string' ? response : undefined
}

function formatTraceValue(value: PythonTraceValue | undefined): string {
  if (value === undefined) return '(not set)'
  if (value === null) return 'None'
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function stateAfterLine(
  line: number,
  occurrence: number,
  variable: string,
  frames: NonNullable<PythonRunResult['traceFrames']>,
) {
  const matchingIndices = frames.flatMap((frame, index) => frame.event === 'line' && frame.line === line ? [index] : [])
  const matchingIndex = matchingIndices[occurrence - 1]
  if (matchingIndex === undefined) return undefined
  const nextLocals = frames[matchingIndex + 1]?.locals
  if (nextLocals && Object.hasOwn(nextLocals, variable)) return nextLocals[variable]
  return frames[matchingIndex].locals[variable]
}

function predictStateAfterLine(activity: PredictStateActivity, frames: NonNullable<PythonRunResult['traceFrames']>) {
  return stateAfterLine(activity.line, activity.occurrence ?? 1, activity.variable, frames)
}

function validateTraceTable(activity: TraceTableActivity, context: ActivityAssessmentContext): ValidationResult {
  if (context.execution.status !== 'success') return failedExecution(context.execution)
  const frames = context.execution.traceFrames ?? []
  if (frames.length === 0) return { passed: false, message: 'Python did not record the program state. Run the trace again.' }
  if (!context.response || Array.isArray(context.response) || typeof context.response !== 'object') {
    return { passed: false, message: 'Fill in every cell of the table before running it.' }
  }

  for (const checkpoint of activity.checkpoints) {
    for (const variable of activity.variables) {
      const key = `${checkpoint.id}:${variable}`
      const prediction = context.response[key]?.trim()
      if (!prediction) return { passed: false, message: 'Fill in every cell of the table before running it.' }
      const value = stateAfterLine(checkpoint.line, checkpoint.occurrence ?? 1, variable, frames)
      const expected = value === undefined ? '—' : formatTraceValue(value)
      if (prediction !== expected) {
        return {
          passed: false,
          message: `At ${checkpoint.label}, ${variable} is ${expected}. Update that cell and run the trace again.`,
          evidence: { expected, actual: prediction },
        }
      }
    }
  }
  return { passed: true, message: 'Your table matches the values Python had at every checkpoint.' }
}

function validateBranchTrace(activity: BranchTraceActivity, context: ActivityAssessmentContext): ValidationResult {
  if (context.execution.status !== 'success') return failedExecution(context.execution)
  const prediction = responseText(context.response)
  if (!prediction) return { passed: false, message: 'Choose the path you think Python will take, then run it.' }

  const resolution = resolveBranchPath(activity.paths, context.execution)
  if (resolution.kind === 'unresolved') {
    return { passed: false, message: 'Python’s trace did not match one clear path. This example needs a content review.' }
  }
  if (prediction !== resolution.path.id) {
    return {
      passed: false,
      message: `Python took the “${resolution.path.label}” path. Compare the lines that ran and try again.`,
      evidence: {
        expected: resolution.path.label,
        actual: activity.paths.find((path) => path.id === prediction)?.label ?? 'No path selected',
      },
    }
  }
  return { passed: true, message: `Correct — Python took the “${resolution.path.label}” path.` }
}

function validateArrangeCode(activity: ArrangeCodeActivity, response: LearnerResponse | undefined): ValidationResult {
  if (!Array.isArray(response)) return { passed: false, message: 'Put the code lines in order to continue.' }
  const correct = response.length === activity.correctOrder.length
    && response.every((id, index) => id === activity.correctOrder[index])
  return correct
    ? { passed: true, message: 'That is the right order. Nice tracing!' }
    : { passed: false, message: 'Not quite yet. Think about which instruction needs to happen first.' }
}

export async function assessActivity(
  activity: LearningActivity,
  context: ActivityAssessmentContext,
): Promise<ValidationResult> {
  switch (activity.kind) {
    case 'code':
      return validateCodeActivity(activity, context)
    case 'predict-output': {
      if (context.execution.status !== 'success') return failedExecution(context.execution)
      const expected = normalizedOutput(activity.expectedOutput.join('\n'))
      const actual = normalizedOutput(context.execution.stdout)
      if (actual !== expected) {
        return { passed: false, message: 'The example did not produce the expected result. This task needs a content review.' }
      }
      const prediction = responseText(context.response)
      if (prediction === undefined) return { passed: false, message: 'Write your prediction before running the example.' }
      return normalizedOutput(prediction) === actual
        ? { passed: true, message: `Correct — Python printed ${actual || '(nothing)'}.` }
        : {
            passed: false,
            message: `Python printed ${actual || '(nothing)'}. Compare that with your prediction and try another step.`,
            evidence: { expected: actual || '(nothing)', actual: prediction || '(no prediction)' },
          }
    }
    case 'predict-state': {
      if (context.execution.status !== 'success') return failedExecution(context.execution)
      const actual = predictStateAfterLine(activity, context.execution.traceFrames ?? [])
      if (actual === undefined) return { passed: false, message: `Python did not reach line ${activity.line}. Check the example.` }
      const prediction = responseText(context.response)
      if (prediction === undefined) return { passed: false, message: 'Choose what you think the value will be.' }
      const actualText = formatTraceValue(actual)
      if (actualText !== activity.expectedValue) {
        return { passed: false, message: 'This example does not match its expected value. The lesson needs a content review.' }
      }
      return prediction === actualText
        ? { passed: true, message: `Yes — ${activity.variable} is ${actualText} after line ${activity.line}.` }
        : {
            passed: false,
            message: `After line ${activity.line}, ${activity.variable} is ${actualText}.`,
            evidence: { expected: actualText, actual: prediction },
          }
    }
    case 'choice':
      return context.response === activity.correctOptionId
        ? { passed: true, message: activity.correctFeedback ?? 'That is right. You spotted the idea.' }
        : { passed: false, message: activity.incorrectFeedback ?? 'Not quite. Reread the example and try another answer.' }
    case 'arrange-code':
      return validateArrangeCode(activity, context.response)
    case 'trace':
      if (context.execution.status !== 'success') return failedExecution(context.execution)
      return context.execution.traceFrames?.length
        ? { passed: true, message: 'You traced the program from start to finish.' }
        : { passed: false, message: 'Python did not record any steps for this program.' }
    case 'trace-table':
      return validateTraceTable(activity, context)
    case 'branch-trace':
      return validateBranchTrace(activity, context)
    case 'reflection':
      return { passed: false, message: 'This reflection is for your own thinking and is not graded.' }
  }
}
