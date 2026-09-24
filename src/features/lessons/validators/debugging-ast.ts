import type { AstRequirement } from '../../../curriculum/types'

type DebuggingAstRequirement = Extract<AstRequirement, 'multiple-assertions' | 'reused-function'>

interface DebuggingAstRule {
  check: string
  passed: string
  hint: string
}

const rules: Record<DebuggingAstRequirement, DebuggingAstRule> = {
  'multiple-assertions': {
    check: `
assertions = [node for node in ast.walk(tree) if isinstance(node, ast.Assert)]
if len(assertions) < 3:
    raise AssertionError("Write at least three assert statements for the three examples.")
`,
    passed: 'Great work — you checked several examples with assertions.',
    hint: 'Write three assert statements: one for 3, one for 0, and one for -2.',
  },
  'reused-function': {
    check: `
function_names = {node.name for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
calls = [
    node for node in ast.walk(tree)
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in function_names
]
if len(calls) < 2:
    raise AssertionError("Call the function you defined for both examples.")
`,
    passed: 'Great work — the same function now handles both examples.',
    hint: 'Call your new function once for each score.',
  },
}

export function buildDebuggingAstCheck(source: string, requirement: AstRequirement): string | undefined {
  const rule = rules[requirement as DebuggingAstRequirement]
  if (!rule) return undefined
  return `import ast\nsource = ${JSON.stringify(source)}\ntree = ast.parse(source)\n${rule.check}`
}

export function getDebuggingAstMessage(requirement: AstRequirement, passed: boolean): string | undefined {
  const rule = rules[requirement as DebuggingAstRequirement]
  if (!rule) return undefined
  return passed ? rule.passed : rule.hint
}
