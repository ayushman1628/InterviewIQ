import { useEffect, useRef, useState } from 'react'
import { Spinner } from '../ui'

// Loads Monaco Editor via CDN (no npm install needed)
export function CodeEditor({ value, onChange, language = 'javascript', height = 320 }) {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load Monaco from CDN if not already loaded
    if (window.monaco) {
      initEditor()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js'
    script.onload = () => {
      window.require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
      })
      window.require(['vs/editor/editor.main'], () => initEditor())
    }
    document.head.appendChild(script)

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  }, [])

  const initEditor = () => {
    if (!containerRef.current || editorRef.current) return

    // Define dark theme matching our app
    window.monaco.editor.defineTheme('interviewiq', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c5cfc' },
        { token: 'string', foreground: '00e5a0' },
        { token: 'number', foreground: 'ffb547' },
        { token: 'type', foreground: '00d4ff' },
      ],
      colors: {
        'editor.background': '#111118',
        'editor.foreground': '#e8e8f0',
        'editorLineNumber.foreground': '#3a3a4a',
        'editorLineNumber.activeForeground': '#7c5cfc',
        'editor.lineHighlightBackground': '#16161f',
        'editorCursor.foreground': '#7c5cfc',
        'editor.selectionBackground': '#7c5cfc33',
        'editorGutter.background': '#0a0a0f',
        'editor.inactiveSelectionBackground': '#7c5cfc1a',
      }
    })

    editorRef.current = window.monaco.editor.create(containerRef.current, {
      value: value || getDefaultCode(language),
      language,
      theme: 'interviewiq',
      fontSize: 14,
      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      fontLigatures: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    })

    editorRef.current.onDidChangeModelContent(() => {
      onChange?.(editorRef.current.getValue())
    })

    setLoading(false)
  }

  // Sync language changes
  useEffect(() => {
    if (!editorRef.current || !window.monaco) return
    const model = editorRef.current.getModel()
    if (model) window.monaco.editor.setModelLanguage(model, language)
  }, [language])

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', height }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', zIndex: 10, gap: 10 }}>
          <Spinner size={18} color="var(--accent)" />
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading editor…</span>
        </div>
      )}
      <div ref={containerRef} style={{ height: '100%' }} />
    </div>
  )
}

function getDefaultCode(language) {
  const defaults = {
    javascript: `// Write your solution here
function solution() {
  
}`,
    python: `# Write your solution here
def solution():
    pass`,
    java: `// Write your solution here
public class Solution {
    public void solve() {
        
    }
}`,
    cpp: `// Write your solution here
#include <bits/stdc++.h>
using namespace std;

int main() {
    
    return 0;
}`,
    typescript: `// Write your solution here
function solution(): void {
  
}`,
  }
  return defaults[language] || '// Write your solution here\n'
}
