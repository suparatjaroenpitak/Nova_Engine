import { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { scriptsApi } from '@/api/scripts';
import type { CompileDiagnosticDto, ScriptDto } from '@/types';

const defaultScript = `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 5.0f;

    void Start()
    {
        Debug.Log("PlayerController initialized");
    }

    void Update()
    {
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 movement = new Vector3(horizontal, 0, vertical);
        transform.Translate(movement * speed * Time.deltaTime);
    }

    void OnTriggerEnter(Collider other)
    {
        Debug.Log("Triggered: " + other.name);
    }
}`;

export default function ScriptEditor() {
  const [source, setSource] = useState(defaultScript);
  const [scriptName, setScriptName] = useState('PlayerController.cs');
  const [diagnostics, setDiagnostics] = useState<CompileDiagnosticDto[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    try {
      const { data } = await scriptsApi.updateSource('new', source);
      setDiagnostics(data.diagnostics);
    } catch (err) {
      console.error('Compile error:', err);
    } finally {
      setIsCompiling(false);
    }
  }, [source]);

  const markers = diagnostics.map((d) => ({
    message: d.message,
    startLineNumber: d.startLine + 1,
    startColumn: d.startColumn + 1,
    endLineNumber: d.endLine + 1,
    endColumn: d.endColumn + 1,
    severity: d.severity === 'Error' ? 8 : d.severity === 'Warning' ? 4 : 1,
  }));

  const errorCount = diagnostics.filter((d) => d.severity === 'Error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'Warning').length;

  return (
    <div className="h-full flex flex-col bg-nova-bg">
      <div className="flex items-center gap-2 px-2 py-1 bg-nova-surface border-b border-nova-border">
        <input
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
          className="px-2 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
        />
        <button
          onClick={handleCompile}
          disabled={isCompiling}
          className="px-3 py-0.5 bg-nova-accent text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isCompiling ? 'Compiling...' : 'Compile'}
        </button>
        <div className="flex-1" />
        {errorCount > 0 && <span className="text-xs text-red-400">{errorCount} errors</span>}
        {warningCount > 0 && <span className="text-xs text-yellow-400">{warningCount} warnings</span>}
        {errorCount === 0 && warningCount === 0 && source && (
          <span className="text-xs text-green-400">✓ Compiles</span>
        )}
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="csharp"
          theme="vs-dark"
          value={source}
          onChange={(val) => setSource(val ?? '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabSize: 4,
          }}
        />
      </div>

      {diagnostics.length > 0 && (
        <div className="h-24 border-t border-nova-border overflow-y-auto">
          {diagnostics.map((d, i) => (
            <div
              key={i}
              className={`px-3 py-1 text-xs font-mono border-b border-nova-border/50 ${
                d.severity === 'Error' ? 'text-red-400' : d.severity === 'Warning' ? 'text-yellow-400' : 'text-blue-400'
              }`}
            >
              <span className="opacity-50 mr-2">({d.startLine},{d.startColumn})</span>
              {d.severity}: {d.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
