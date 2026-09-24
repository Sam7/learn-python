import type { AstRequirement } from '../../../curriculum/types'

export function buildRealWorldAstCheck(
  source: string,
  requirement: AstRequirement,
  localModuleNames: string[] = [],
): string | null {
  const literal = JSON.stringify(source)
  const moduleNames = JSON.stringify(localModuleNames)
  const checks: Partial<Record<AstRequirement, string>> = {
    'random-integer': `
import ast
source = ${literal}
tree = ast.parse(source)
random_modules = {
    alias.asname or alias.name.split(".")[0]
    for node in ast.walk(tree)
    if isinstance(node, ast.Import)
    for alias in node.names
    if alias.name.split(".")[0] == "random"
}
random_functions = {
    alias.asname or alias.name
    for node in ast.walk(tree)
    if isinstance(node, ast.ImportFrom)
    if node.module == "random"
    for alias in node.names
    if alias.name == "randint"
}
random_calls = [
    node
    for node in ast.walk(tree)
    if isinstance(node, ast.Call)
    and (
        (isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name) and node.func.value.id in random_modules and node.func.attr == "randint")
        or (isinstance(node.func, ast.Name) and node.func.id in random_functions)
    )
]
if not (random_modules or random_functions) or not any(
    len(node.args) >= 2
    and all(isinstance(value, ast.Constant) and type(value.value) is int for value in node.args[:2])
    and node.args[0].value < node.args[1].value
    for node in random_calls
):
    raise AssertionError("Import random and use randint(lower, upper) to make the number unpredictable.")
`,
    'file-read': `
import ast
tree = ast.parse(${literal})
opens_file = any(isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "open" for node in ast.walk(tree))
reads_file = any(
    isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr in ("read", "read_text")
    for node in ast.walk(tree)
)
if not opens_file or not reads_file:
    raise AssertionError("Open the saved file and read its contents.")
`,
    'file-write': `
import ast
tree = ast.parse(${literal})
def opens_for_writing(node):
    if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Name) or node.func.id != "open":
        return False
    mode = node.args[1] if len(node.args) > 1 else next((item.value for item in node.keywords if item.arg == "mode"), None)
    return isinstance(mode, ast.Constant) and mode.value in ("w", "a", "x")
if not any(opens_for_writing(node) for node in ast.walk(tree)):
    raise AssertionError("Open the file in a writing mode such as 'w' or 'a'.")
if not any(isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "write" for node in ast.walk(tree)):
    raise AssertionError("Write the new information into the open file.")
`,
    'json-load': `
import ast
tree = ast.parse(${literal})
json_modules = {
    alias.asname or alias.name.split(".")[0]
    for node in ast.walk(tree) if isinstance(node, ast.Import)
    for alias in node.names if alias.name.split(".")[0] == "json"
}
json_load_names = {
    alias.asname or alias.name
    for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)
    for alias in node.names if node.module == "json" and alias.name in ("load", "loads")
}
loads_json = any(
    isinstance(node, ast.Call) and (
        (isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name) and node.func.value.id in json_modules and node.func.attr in ("load", "loads"))
        or (isinstance(node.func, ast.Name) and node.func.id in json_load_names)
    )
    for node in ast.walk(tree)
)
if not (json_modules or json_load_names) or not loads_json:
    raise AssertionError("Import json and use json.load() or json.loads() to read the structured data.")
`,
    'json-dump': `
import ast
tree = ast.parse(${literal})
json_modules = {
    alias.asname or alias.name.split(".")[0]
    for node in ast.walk(tree) if isinstance(node, ast.Import)
    for alias in node.names if alias.name.split(".")[0] == "json"
}
json_dump_names = {
    alias.asname or alias.name
    for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)
    for alias in node.names if node.module == "json" and alias.name in ("dump", "dumps")
}
writes_json = any(
    isinstance(node, ast.Call) and (
        (isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name) and node.func.value.id in json_modules and node.func.attr in ("dump", "dumps"))
        or (isinstance(node.func, ast.Name) and node.func.id in json_dump_names)
    )
    for node in ast.walk(tree)
)
if not (json_modules or json_dump_names) or not writes_json:
    raise AssertionError("Import json and use json.dump() or json.dumps() to save structured data.")
`,
    'file-not-found-handler': `
import ast
tree = ast.parse(${literal})
def handles_missing_file(handler):
    value = handler.type
    if isinstance(value, ast.Name):
        return value.id == "FileNotFoundError"
    if isinstance(value, ast.Tuple):
        return any(isinstance(item, ast.Name) and item.id == "FileNotFoundError" for item in value.elts)
    return False
if not any(isinstance(node, ast.Try) and any(handles_missing_file(handler) for handler in node.handlers) for node in ast.walk(tree)):
    raise AssertionError("Catch FileNotFoundError so a missing saved file has a useful response.")
`,
    'local-module-import': `
import ast
tree = ast.parse(${literal})
local_modules = set(${moduleNames})
imports = set()
for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        imports.update(alias.name.split(".")[0] for alias in node.names)
    elif isinstance(node, ast.ImportFrom) and node.module:
        imports.add(node.module.split(".")[0])
if not local_modules.intersection(imports):
    raise AssertionError("Import a Python file from this project so the files work together.")
`,
  }
  return checks[requirement] ?? null
}

export function getRealWorldAstMessage(requirement: AstRequirement, passed: boolean): string | null {
  const messages: Partial<Record<AstRequirement, [string, string]>> = {
    'random-integer': ['Great work — random.randint chooses a whole number within your range.', 'Use random.randint(lower, upper) to choose a whole number.'],
    'file-read': ['Great work — your program opens a saved file and reads its contents.', 'Open the saved file and read what it contains.'],
    'file-write': ['Great work — your program writes information into a file.', 'Open a file in a writing mode, then write information into it.'],
    'json-load': ['Great work — your program reads structured JSON data.', 'Import json and use json.load() to read the JSON file.'],
    'json-dump': ['Great work — your program saves structured data as JSON.', 'Import json and use json.dump() to save the data.'],
    'file-not-found-handler': ['Great work — your program handles a missing file deliberately.', 'Catch FileNotFoundError and show a useful fallback.'],
    'local-module-import': ['Great work — the main program imports code from one of its project files.', 'Import a function from another Python file in this project.'],
  }
  const message = messages[requirement]
  if (!message) return null
  return message[passed ? 0 : 1]
}
