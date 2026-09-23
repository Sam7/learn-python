import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#142321',
    color: '#e8f3ef',
    fontSize: '15px',
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  },
  '.cm-scroller': {
    backgroundColor: '#142321',
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: '#ffd166',
    padding: '18px 0 22px',
    minHeight: '142px',
    backgroundColor: '#142321',
  },
  '.cm-line': { color: '#e8f3ef' },
  '.cm-gutters': {
    backgroundColor: '#142321',
    color: '#6f8981',
    borderRight: '1px solid #2c4540',
    paddingLeft: '12px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(126, 231, 200, 0.08)',
    color: '#b6d4ca',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(126, 231, 200, 0.09)',
  },
  '.cm-selectionBackground, .cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(126, 231, 200, 0.28) !important',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#ffd166',
    borderLeftWidth: '2px',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(255, 209, 102, 0.22)',
    outline: '1px solid rgba(255, 209, 102, 0.6)',
  },
  '.cm-focused': {
    outline: 'none',
  },
}, { dark: true })

const syntaxTheme = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.comment, color: '#8eaaa1', fontStyle: 'italic' },
  { tag: tags.keyword, color: '#ff9f7a', fontWeight: '600' },
  { tag: tags.operatorKeyword, color: '#ff9f7a', fontWeight: '600' },
  { tag: tags.bool, color: '#ffd166' },
  { tag: tags.number, color: '#ffd166' },
  { tag: tags.string, color: '#a8e6a1' },
  { tag: tags.regexp, color: '#a8e6a1' },
  { tag: tags.escape, color: '#7ee7c8' },
  { tag: tags.function(tags.variableName), color: '#72d7ff' },
  { tag: tags.definition(tags.variableName), color: '#b9f1d8' },
  { tag: tags.variableName, color: '#e8f3ef' },
  { tag: tags.propertyName, color: '#7ee7c8' },
  { tag: tags.typeName, color: '#c7b7ff' },
  { tag: tags.className, color: '#c7b7ff' },
  { tag: tags.operator, color: '#f3a6c7' },
  { tag: tags.punctuation, color: '#d5e6e0' },
  { tag: tags.bracket, color: '#ffd166' },
  { tag: tags.meta, color: '#ffd166' },
]))

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <div className="overflow-x-auto rounded-xl bg-ink shadow-inner" data-testid="code-editor">
      <CodeMirror
        value={value}
        height="auto"
        minHeight="142px"
        extensions={[python(), EditorView.lineWrapping, editorTheme, syntaxTheme]}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
        }}
        aria-label="Python code editor"
      />
    </div>
  )
}
