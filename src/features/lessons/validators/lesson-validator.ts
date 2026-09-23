import type { Lesson, LessonValidationContext, ValidationResult } from '../types'

function outputLines(stdout: string): string[] {
  return stdout.replace(/\r\n/g, '\n').trimEnd().split('\n').filter((line) => line.length > 0)
}

function validateOutput(lesson: Lesson, context: LessonValidationContext): ValidationResult {
  const definition = lesson.validation
  if (definition.kind !== 'output') {
    return { passed: false, message: 'This lesson needs a different kind of check.' }
  }

  if (context.execution.status !== 'success') {
    return { passed: false, message: 'Run your code successfully before checking your answer.' }
  }

  const stdout = context.execution.stdout.replace(/\r\n/g, '\n').trimEnd()
  if (definition.reject?.some((rejectedOutput) => stdout.includes(rejectedOutput))) {
    return { passed: false, message: 'That is the example answer. Change the text and make it your own.' }
  }

  if (definition.mode === 'exact') {
    const expected = definition.expected?.join('\n') ?? ''
    return stdout === expected
      ? { passed: true, message: 'Great work — your output is correct.' }
      : { passed: false, message: 'The output is not quite right yet. Check the task and try again.' }
  }

  const lines = outputLines(stdout)
  if (definition.mode === 'lines') {
    return lines.length === definition.lineCount && lines.every((line) => line.trim().length > 0)
      ? { passed: true, message: 'Great work — both lines are there.' }
      : { passed: false, message: 'Make sure your program prints two non-empty lines.' }
  }

  if (definition.mode === 'contains') {
    const expected = definition.expected ?? []
    return expected.every((value) => stdout.includes(value))
      ? { passed: true, message: 'Great work — your program used the answer.' }
      : { passed: false, message: 'Make sure your program uses the answer in its greeting.' }
  }

  return lines.length > 0
    ? { passed: true, message: 'Great work — Python remembered your value.' }
    : { passed: false, message: 'Your program needs to print a value.' }
}

function astValidationProgram(source: string, requirement: 'text-variable' | 'variable-in-sentence'): string {
  const sourceLiteral = JSON.stringify(source)
  const requirementCheck = requirement === 'text-variable'
    ? `
if not has_text_variable:
    raise AssertionError("Create a variable containing some text first.")
`
    : `
if not has_text_variable:
    raise AssertionError("Create a variable containing some text first.")

text_variable_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    for target in node.targets
    if isinstance(target, ast.Name)
    and isinstance(node.value, ast.Constant)
    and isinstance(node.value.value, str)
}

def contains_text_variable(node):
    return any(
        isinstance(child, ast.Name) and child.id in text_variable_names
        for child in ast.walk(node)
    )

def contains_text_literal(node):
    return any(
        isinstance(child, ast.Constant)
        and isinstance(child.value, str)
        and len(child.value.strip()) > 0
        for child in ast.walk(node)
    )

has_variable_in_sentence = any(
    isinstance(node, ast.Call)
    and isinstance(node.func, ast.Name)
    and node.func.id == "print"
    and any(contains_text_variable(argument) for argument in node.args)
    and any(contains_text_literal(argument) for argument in node.args)
    for node in ast.walk(tree)
)
if not has_variable_in_sentence:
    raise AssertionError("Put your text variable inside a sentence that you print.")
`

  return `
import ast

source = ${sourceLiteral}
tree = ast.parse(source)
has_text_variable = any(
    isinstance(node, ast.Assign)
    and any(isinstance(target, ast.Name) for target in node.targets)
    and isinstance(node.value, ast.Constant)
    and isinstance(node.value.value, str)
    and len(node.value.value.strip()) > 0
    for node in ast.walk(tree)
)
${requirementCheck}
exec(compile(tree, "<learner>", "exec"), {})
`
}

async function validateAst(lesson: Lesson, context: LessonValidationContext): Promise<ValidationResult> {
  const definition = lesson.validation
  if (definition.kind !== 'ast') {
    return { passed: false, message: 'This lesson needs a different kind of check.' }
  }

  if (context.execution.status !== 'success') {
    return { passed: false, message: 'Run your code successfully before checking your answer.' }
  }

  const stdout = context.execution.stdout.replace(/\r\n/g, '\n').trimEnd()
  if (definition.reject?.includes(stdout)) {
    return { passed: false, message: 'Change the example value to your own favourite food.' }
  }

  const result = await context.runValidationCode(astValidationProgram(context.code, definition.requirement))
  const isSentenceOutput = definition.requirement === 'variable-in-sentence'
  return result.status === 'success'
    ? {
        passed: true,
        message: isSentenceOutput
          ? 'Great work — you put a variable inside a sentence.'
          : 'Great work — you created and used a variable.',
      }
    : {
        passed: false,
        message: result.error?.includes('Put your text variable')
          ? 'Put your text variable inside a sentence that you print.'
          : result.error?.includes('Create a variable')
          ? 'Create a variable containing text, then print its name.'
          : 'Python could not check that yet. Make sure your code runs first.',
      }
}

export async function validateLesson(
  lesson: Lesson,
  context: LessonValidationContext,
): Promise<ValidationResult> {
  if (lesson.validation.kind === 'unavailable') {
    return { passed: false, message: 'This lesson is coming soon.' }
  }
  return lesson.validation.kind === 'ast'
    ? validateAst(lesson, context)
    : validateOutput(lesson, context)
}
