import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { EditorView } from '@codemirror/view'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  const editorTheme = useMemo(
    () => EditorView.theme({
      '&': {
        backgroundColor: '#172323',
        color: '#eff8f3',
        fontSize: '15px',
      },
      '.cm-content': {
        caretColor: '#bce6d6',
        padding: '18px 0 22px',
        minHeight: '142px',
        backgroundColor: '#172323',
      },
      '.cm-scroller': { backgroundColor: '#172323' },
      '.cm-line': { color: '#eff8f3' },
      '.cm-gutters': {
        backgroundColor: '#172323',
        color: '#718785',
        border: 'none',
        paddingLeft: '12px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(188, 230, 214, 0.06)',
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(188, 230, 214, 0.24) !important',
      },
      '.cm-focused': {
        outline: 'none',
      },
    }),
    [],
  )

  return (
    <div className="overflow-x-auto rounded-xl bg-ink shadow-inner" data-testid="code-editor">
      <CodeMirror
        value={value}
        height="auto"
        minHeight="142px"
        extensions={[python(), EditorView.lineWrapping, editorTheme]}
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
