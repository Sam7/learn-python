import type { AstRequirement } from '../../../curriculum/types'

type StructuredDataAstRequirement = Extract<AstRequirement,
  | 'dictionary-literal'
  | 'dictionary-field-read'
  | 'dictionary-field-update'
  | 'list-of-records'
  | 'record-iteration'
  | 'record-filter'
  | 'record-total'
>

interface StructuredDataAstRule {
  check: string
  passed: string
  hint: string
}

const rules: Record<StructuredDataAstRequirement, StructuredDataAstRule> = {
  'dictionary-literal': {
    check: `
if not any(
    isinstance(node, ast.Assign)
    and isinstance(node.value, ast.Dict)
    and bool(node.value.keys)
    and all(isinstance(key, ast.Constant) and isinstance(key.value, str) for key in node.value.keys)
    and any(isinstance(target, ast.Name) for target in node.targets)
    for node in ast.walk(tree)
):
    raise AssertionError("Give a dictionary a name and add values using text keys.")
`,
    passed: 'Great work — you grouped related information in a dictionary.',
    hint: 'Create a named dictionary and give its values meaningful text keys.',
  },
  'dictionary-field-read': {
    check: `
if not any(
    isinstance(node, ast.Subscript)
    and isinstance(node.ctx, ast.Load)
    and isinstance(node.value, ast.Name)
    and isinstance(node.slice, ast.Constant)
    and isinstance(node.slice.value, str)
    for node in ast.walk(tree)
):
    raise AssertionError('Read a value using its dictionary key, such as student["name"].')
`,
    passed: 'Great work — you found a value using its dictionary key.',
    hint: 'Use square brackets with a text key, such as student["name"].',
  },
  'dictionary-field-update': {
    check: `
if not any(
    isinstance(node, ast.Subscript)
    and isinstance(node.ctx, ast.Store)
    and isinstance(node.value, ast.Name)
    and isinstance(node.slice, ast.Constant)
    and isinstance(node.slice.value, str)
    for node in ast.walk(tree)
):
    raise AssertionError("Change a named dictionary field using square brackets and its key.")
`,
    passed: 'Great work — you updated a value inside the record.',
    hint: 'Assign a new value to a field, for example student["score"] = 91.',
  },
  'list-of-records': {
    check: `
if not any(
    isinstance(node, ast.Assign)
    and isinstance(node.value, ast.List)
    and len(node.value.elts) >= 2
    and all(isinstance(item, ast.Dict) for item in node.value.elts)
    and any(isinstance(target, ast.Name) for target in node.targets)
    for node in ast.walk(tree)
):
    raise AssertionError("Put at least two dictionary records into a named list.")
`,
    passed: 'Great work — your list keeps several structured records together.',
    hint: 'Make a list containing a dictionary for each person or item.',
  },
  'record-iteration': {
    check: `
record_list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.List)
    and all(isinstance(item, ast.Dict) for item in node.value.elts)
    for target in node.targets
    if isinstance(target, ast.Name)
}
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in record_list_names
    and any(
        isinstance(field, ast.Subscript)
        and isinstance(field.ctx, ast.Load)
        and isinstance(field.value, ast.Name)
        and field.value.id == loop.target.id
        and isinstance(field.slice, ast.Constant)
        and isinstance(field.slice.value, str)
        for statement in loop.body
        for field in ast.walk(statement)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Loop through the list and read a named field from each record.")
`,
    passed: 'Great work — your loop reads named fields from each record.',
    hint: 'Use for record in records, then read a field from record inside the loop.',
  },
  'record-filter': {
    check: `
record_list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.List)
    and all(isinstance(item, ast.Dict) for item in node.value.elts)
    for target in node.targets
    if isinstance(target, ast.Name)
}
def record_fields(node, record_name):
    return {
        item.slice.value
        for item in ast.walk(node)
        if isinstance(item, ast.Subscript)
        and isinstance(item.ctx, ast.Load)
        and isinstance(item.value, ast.Name)
        and item.value.id == record_name
        and isinstance(item.slice, ast.Constant)
        and isinstance(item.slice.value, str)
    }
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in record_list_names
    and any(
        isinstance(decision, ast.If)
        and bool(record_fields(decision.test, loop.target.id))
        and any(record_fields(statement, loop.target.id) for statement in decision.body)
        for statement in loop.body
        for decision in ast.walk(statement)
        if isinstance(decision, ast.If)
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Check a record field in an if statement, then use a field for matching records.")
`,
    passed: 'Great work — you selected records by checking one of their fields.',
    hint: 'Check a field such as record["score"] inside the if, then show a field from matching records.',
  },
  'record-total': {
    check: `
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
record_list_names = {
    target.id
    for node in ast.walk(tree)
    if isinstance(node, ast.Assign)
    and isinstance(node.value, ast.List)
    and all(isinstance(item, ast.Dict) for item in node.value.elts)
    for target in node.targets
    if isinstance(target, ast.Name)
}
def adds_record_value(loop, record_name, total_name):
    for node in ast.walk(loop):
        if isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id == total_name for target in node.targets
        ) and isinstance(node.value, ast.BinOp) and isinstance(node.value.op, ast.Add):
            sides = (node.value.left, node.value.right)
            if any(isinstance(side, ast.Name) and side.id == total_name for side in sides) and any(
                isinstance(side, ast.Subscript)
                and isinstance(side.ctx, ast.Load)
                and isinstance(side.value, ast.Name)
                and side.value.id == record_name
                and isinstance(side.slice, ast.Constant)
                and isinstance(side.slice.value, str)
                for side in sides
            ):
                return True
        if isinstance(node, ast.AugAssign) and isinstance(node.target, ast.Name) and node.target.id == total_name:
            if isinstance(node.op, ast.Add) and isinstance(node.value, ast.Subscript):
                if isinstance(node.value.value, ast.Name) and node.value.value.id == record_name:
                    return isinstance(node.value.slice, ast.Constant) and isinstance(node.value.slice.value, str)
    return False
if not any(
    isinstance(loop, ast.For)
    and isinstance(loop.target, ast.Name)
    and isinstance(loop.iter, ast.Name)
    and loop.iter.id in record_list_names
    and any(
        total_name in zero_names
        and zero_names[total_name] < loop.lineno
        and adds_record_value(loop, loop.target.id, total_name)
        for total_name in zero_names
    )
    for loop in ast.walk(tree)
):
    raise AssertionError("Start a total at 0 and add a named field from each record.")
`,
    passed: 'Great work — you added a field from each record to a running total.',
    hint: 'Start total at 0, loop through the records, and add each record’s score field.',
  },
}

export function buildStructuredDataAstCheck(source: string, requirement: AstRequirement): string | undefined {
  const rule = rules[requirement as StructuredDataAstRequirement]
  if (!rule) return undefined
  return `import ast\nsource = ${JSON.stringify(source)}\ntree = ast.parse(source)\n${rule.check}`
}

export function getStructuredDataAstMessage(requirement: AstRequirement, passed: boolean): string | undefined {
  const rule = rules[requirement as StructuredDataAstRequirement]
  if (!rule) return undefined
  return passed ? rule.passed : rule.hint
}
