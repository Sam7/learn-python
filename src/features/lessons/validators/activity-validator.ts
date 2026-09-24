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
import { buildDebuggingAstCheck, getDebuggingAstMessage } from './debugging-ast'
import { buildStructuredDataAstCheck, getStructuredDataAstMessage } from './structured-data-ast'

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
  const debuggingCheck = buildDebuggingAstCheck(source, requirement)
  if (debuggingCheck) return debuggingCheck
  const structuredDataCheck = buildStructuredDataAstCheck(source, requirement)
  if (structuredDataCheck) return structuredDataCheck
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
` : requirement === 'function-definition' ? `
function_names = {
    node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
}
if not function_names:
    raise AssertionError("Define a function using def and give it a name.")
` : requirement === 'function-call' ? `
function_names = {
    node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
}
if not any(
    isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id in function_names
    for node in ast.walk(tree)
):
    raise AssertionError("Call your function by writing its name followed by parentheses.")
` : requirement === 'function-parameter' ? `
if not any(
    isinstance(node, ast.FunctionDef)
    and bool(node.args.args)
    and any(
        isinstance(child, ast.Name)
        and isinstance(child.ctx, ast.Load)
        and child.id in {argument.arg for argument in node.args.args}
        for child in ast.walk(node)
    )
    for node in ast.walk(tree)
):
    raise AssertionError("Give the function a parameter and use that information inside it.")
` : requirement === 'multiple-parameters' ? `
if not any(
    isinstance(node, ast.FunctionDef)
    and len(node.args.args) >= 2
    and {argument.arg for argument in node.args.args}.issubset({
        child.id for child in ast.walk(node)
        if isinstance(child, ast.Name) and isinstance(child.ctx, ast.Load)
    })
    for node in ast.walk(tree)
):
    raise AssertionError("Give the function two parameters and use both inside it.")
` : requirement === 'function-return' ? `
if not any(
    isinstance(node, ast.FunctionDef)
    and any(isinstance(child, ast.Return) and child.value is not None for child in ast.walk(node))
    for node in ast.walk(tree)
):
    raise AssertionError("Use return to send a value back from the function.")
` : requirement === 'local-scope' ? `
local_names = {
    node.id
    for function in ast.walk(tree)
    if isinstance(function, ast.FunctionDef)
    for statement in function.body
    for node in ast.walk(statement)
    if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store)
}
names_used_after_definition = {
    node.id
    for statement in tree.body
    if not isinstance(statement, ast.FunctionDef)
    for node in ast.walk(statement)
    if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load)
}
if not local_names.intersection(names_used_after_definition):
    raise AssertionError("Try using a name assigned inside the function after the function finishes.")
` : requirement === 'total-accumulator' ? `
zero_names = {
    target.id: node.lineno
    for node in tree.body
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Constant)
    and type(node.value.value) in (int, float)
    and node.value.value == 0
    for target in node.targets
    if isinstance(target, ast.Name)
}
def adds_current_item(loop, item_name, counter_name):
    for node in ast.walk(loop):
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == counter_name for target in node.targets
        ) and isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.Add):
            sides = (node.value.left, node.value.right)
            if any(isinstance(side, ast.Name) and side.id == counter_name for side in sides) and any(
                isinstance(side, ast.Name) and side.id == item_name for side in sides
            ):
                return True
        if isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name) and node.target.id == counter_name:
            if isinstance(node.op, ast.Add) and isinstance(node.value, ast.Name) and node.value.id == item_name:
                return True
    return False
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and any(
        counter_name in zero_names
        and zero_names[counter_name] < loop.lineno
        and adds_current_item(loop, loop.target.id, counter_name)
        for counter_name in zero_names
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Start a total at 0, then add each loop value to it.")
` : requirement === 'count-if' ? `
zero_names = {
    target.id: node.lineno
    for node in tree.body
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Constant)
    and type(node.value.value) is int
    and node.value.value == 0
    for target in node.targets
    if isinstance(target, ast.Name)
}
def increments(node, counter_name):
    if isinstance(node, ast.AugAssign):
        return isinstance(node.target, ast.Name) and node.target.id == counter_name and isinstance(node.op, ast.Add) and isinstance(node.value, ast.Constant) and node.value.value == 1
    return (
        isinstance(node, ast.Assign)
        and any(isinstance(target, ast.Name) and target.id == counter_name for target in node.targets)
        and isinstance(node.value, ast.BinOp)
        and isinstance(node.value.op, ast.Add)
        and isinstance(node.value.left, ast.Name)
        and node.value.left.id == counter_name
        and isinstance(node.value.right, ast.Constant)
        and node.value.right.value == 1
    )
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and any(
        counter_name in zero_names
        and zero_names[counter_name] < loop.lineno
        and any(
            isinstance(decision, ast.If)
            and any(isinstance(child, ast.Name) and child.id == loop.target.id for child in ast.walk(decision.test))
            and any(increments(child, counter_name) for statement in decision.body for child in ast.walk(statement))
            for decision in ast.walk(loop)
            if isinstance(decision, ast.If)
        )
        for counter_name in zero_names
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Start a count at 0 and add 1 only when an item passes an if test.")
` : requirement === 'search-flag' ? `
false_names = {
    target.id: node.lineno
    for node in tree.body
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Constant)
    and node.value.value is False
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and any(
        isinstance(decision, ast.If)
        and any(isinstance(child, ast.Name) and child.id == loop.target.id for child in ast.walk(decision.test))
        and any(
            isinstance(update, ast.Assign)
            and isinstance(update.value, ast.Constant)
            and update.value.value is True
            and any(
                isinstance(target, ast.Name)
                and target.id in false_names
                and false_names[target.id] < loop.lineno
                for target in update.targets
            )
            for statement in decision.body
            for update in ast.walk(statement)
        )
        for decision in ast.walk(loop)
        if isinstance(decision, ast.If)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Start a found flag at False, then set it to True when the loop finds a match.")
` : requirement === 'best-so-far' ? `
list_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
best_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Subscript)
    and isinstance(node.value.value, ast.Name)
    and node.value.value.id in list_names
    and isinstance(node.value.slice, ast.Constant)
    and node.value.slice.value == 0
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in list_names
    and any(
        isinstance(decision, ast.If)
        and any(
            isinstance(child, ast.Compare)
            and any(isinstance(value, ast.Name) and value.id == loop.target.id for value in ast.walk(child))
            and any(isinstance(value, ast.Name) and value.id in best_names for value in ast.walk(child))
            for child in ast.walk(decision.test)
        )
        and any(
            isinstance(update, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id in best_names for target in update.targets)
            and isinstance(update.value, ast.Name)
            and update.value.id == loop.target.id
            for statement in decision.body
            for update in ast.walk(statement)
        )
        for decision in ast.walk(loop)
        if isinstance(decision, ast.If)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Start best with the first item, then replace it when a better item appears.")
` : requirement === 'transform-list' ? `
list_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
empty_list_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List) and not node.value.elts
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in list_names
    and any(
        isinstance(call, ast.Call)
        and isinstance(call.func, ast.Attribute)
        and call.func.attr == "append"
        and isinstance(call.func.value, ast.Name)
        and call.func.value.id in empty_list_names
        and call.func.value.id != loop.iter.id
        and any(isinstance(child, ast.Name) and child.id == loop.target.id for child in ast.walk(argument))
        and not isinstance(argument, ast.Name)
        for statement in loop.body
        for call in ast.walk(statement)
        if isinstance(call, ast.Call)
        for argument in call.args
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Make a new empty list and append a changed version of each item in a loop.")
` : requirement === 'filter-list' ? `
list_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List)
    for target in node.targets
    if isinstance(target, ast.Name)
}
empty_list_names = {
    target.id
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.value, ast.List) and not node.value.elts
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in list_names
    and any(
        isinstance(decision, ast.If)
        and any(isinstance(child, ast.Name) and child.id == loop.target.id for child in ast.walk(decision.test))
        and any(
            isinstance(call, ast.Call)
            and isinstance(call.func, ast.Attribute)
            and call.func.attr == "append"
            and isinstance(call.func.value, ast.Name)
            and call.func.value.id in empty_list_names
            and isinstance(argument, ast.Name)
            and argument.id == loop.target.id
            for statement in decision.body
            for call in ast.walk(statement)
            if isinstance(call, ast.Call)
            for argument in call.args
        )
        for decision in ast.walk(loop)
        if isinstance(decision, ast.If)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Keep a separate list, then append an item only when it passes the if test.")
` : requirement === 'input-validation-loop' ? `
if not any(
    isinstance(loop, ast.While)
    and any(
        isinstance(condition_name, ast.Name)
        and any(
            isinstance(assignment, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id == condition_name.id for target in assignment.targets)
            and any(
                isinstance(call, ast.Call)
                and isinstance(call.func, ast.Name)
                and call.func.id == "input"
                for call in ast.walk(assignment.value)
            )
            for statement in loop.body
            for assignment in ast.walk(statement)
        )
        for condition_name in ast.walk(loop.test)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Ask again for the value being checked inside the while loop.")
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
  const debuggingMessage = getDebuggingAstMessage(requirement, passed)
  if (debuggingMessage) return debuggingMessage
  const structuredDataMessage = getStructuredDataAstMessage(requirement, passed)
  if (structuredDataMessage) return structuredDataMessage
  if (passed) {
    const messages: Partial<Record<AstRequirement, string>> = {
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
      'function-definition': 'Great work — you gave a reusable action a name with def.',
      'function-call': 'Great work — you called the function you defined.',
      'function-parameter': 'Great work — your function receives and uses information.',
      'multiple-parameters': 'Great work — your function uses both pieces of information.',
      'function-return': 'Great work — your function sends a value back with return.',
      'local-scope': 'Good observation — a name created inside a function is not available outside it.',
      'total-accumulator': 'Great work — you carried a running total through the loop.',
      'count-if': 'Great work — you counted only the items that passed the test.',
      'search-flag': 'Great work — your flag remembers whether the loop found a match.',
      'best-so-far': 'Great work — you kept the best value found so far.',
      'transform-list': 'Great work — you built a new list from changed items.',
      'filter-list': 'Great work — you kept only items that passed the test.',
      'input-validation-loop': 'Great work — your program asks again until the value is acceptable.',
    }
    return messages[requirement] ?? 'Great work — you used the Python idea from this task.'
  }

  const messages: Partial<Record<AstRequirement, string>> = {
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
    'function-definition': 'Define a function using def and give it a name.',
    'function-call': 'Call your function by writing its name followed by parentheses.',
    'function-parameter': 'Give the function a parameter and use that information inside it.',
    'multiple-parameters': 'Give the function two parameters and use both inside it.',
    'function-return': 'Use return to send a value back from the function.',
    'local-scope': 'Try using a name assigned inside the function after the function finishes.',
    'total-accumulator': 'Start a total at 0, then add each loop value to it.',
    'count-if': 'Start a count at 0 and add 1 only when an item passes an if test.',
    'search-flag': 'Start a found flag at False, then set it to True when the loop finds a match.',
    'best-so-far': 'Start best with the first item, then replace it when a better item appears.',
    'transform-list': 'Make a new empty list and append a changed version of each item in a loop.',
    'filter-list': 'Keep a separate list, then append an item only when it passes the if test.',
    'input-validation-loop': 'Ask again for the value being checked inside the while loop.',
  }
  return messages[requirement] ?? 'Try using the Python idea described in the task.'
}

async function validateCodeActivity(
  activity: CodeActivity,
  context: ActivityAssessmentContext,
): Promise<ValidationResult> {
  const assessment = activity.assessment
  const source = context.code ?? activity.starterCode
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
      for (const requirement of assessment.requirements ?? []) {
        const result = await context.runPython({ code: pythonAstCheck(source, requirement) })
        if (result.status !== 'success') {
          return { passed: false, message: astAssessmentMessage(requirement, false) }
        }
      }
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
