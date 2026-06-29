import { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { scriptsApi } from '@/api/scripts';
import type { CompileDiagnosticDto, ScriptDto } from '@/types';

const C_SHARP_SNIPPETS = [
  { label: 'MonoBehaviour', insertText: 'public class ${1:ClassName} : MonoBehaviour\n{\n    void Start()\n    {\n        $0\n    }\n\n    void Update()\n    {\n        $0\n    }\n}', detail: 'Basic MonoBehaviour class' },
  { label: 'MonoBehaviour Full', insertText: 'using UnityEngine;\n\npublic class ${1:ClassName} : MonoBehaviour\n{\n    [Header("Settings")]\n    public float speed = 5.0f;\n    public GameObject target;\n\n    void Awake()\n    {\n        $0\n    }\n\n    void Start()\n    {\n        $0\n    }\n\n    void Update()\n    {\n        $0\n    }\n\n    void FixedUpdate()\n    {\n        $0\n    }\n\n    void OnTriggerEnter(Collider other)\n    {\n        $0\n    }\n\n    void OnCollisionEnter(Collision collision)\n    {\n        $0\n    }\n}', detail: 'Full MonoBehaviour template' },
  { label: 'Property', insertText: 'private ${1:type} _${2:name};\npublic ${1:type} ${2:name}\n{\n    get => _${2:name};\n    set { _${2:name} = value; OnPropertyChanged(); }\n}', detail: 'Property with backing field' },
  { label: 'Singleton', insertText: 'public class ${1:ClassName} : MonoBehaviour\n{\n    private static ${1:ClassName} _instance;\n    public static ${1:ClassName} Instance\n    {\n        get\n        {\n            if (_instance == null)\n                _instance = FindObjectOfType<${1:ClassName}>();\n            return _instance;\n        }\n    }\n\n    void Awake()\n    {\n        _instance = this;\n    }\n}', detail: 'Singleton pattern' },
  { label: 'Coroutine', insertText: 'IEnumerator ${1:CoroutineName}()\n{\n    while (true)\n    {\n        $0\n        yield return new WaitForSeconds(${2:1.0f});\n    }\n}', detail: 'Coroutine template' },
  { label: 'Interface', insertText: 'public interface I${1:InterfaceName}\n{\n    ${2:void MethodName()};\n}', detail: 'Interface declaration' },
  { label: 'Event', insertText: 'public delegate void ${1:EventName}Handler(${2:args});\npublic event ${1:EventName}Handler On${1:EventName};', detail: 'Event declaration' },
  { label: 'Serializable', insertText: '[System.Serializable]\npublic class ${1:ClassName}\n{\n    public ${2:type} ${3:name};\n}', detail: 'Serializable class' },
];

const templateScripts: Record<string, string> = {
  'PlayerController.cs': `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float speed = 5.0f;
    public float jumpForce = 8.0f;
    public float gravity = 20.0f;

    [Header("References")]
    public Camera playerCamera;
    public Transform groundCheck;

    private Vector3 moveDirection;
    private CharacterController controller;
    private bool isGrounded;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        if (playerCamera == null)
            playerCamera = Camera.main;
    }

    void Update()
    {
        isGrounded = Physics.CheckSphere(groundCheck.position, 0.1f);

        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 move = transform.right * h + transform.forward * v;
        controller.Move(move * speed * Time.deltaTime);

        if (Input.GetButtonDown("Jump") && isGrounded)
            moveDirection.y = jumpForce;

        moveDirection.y -= gravity * Time.deltaTime;
        controller.Move(moveDirection * Time.deltaTime);
    }
}`,
  'EnemyAI.cs': `using UnityEngine;
using System.Collections;

public class EnemyAI : MonoBehaviour
{
    public float health = 100f;
    public float moveSpeed = 3f;
    public float detectionRange = 15f;
    public float attackRange = 2f;
    public int damage = 10;
    public float attackCooldown = 1.5f;

    private Transform player;
    private float lastAttackTime;
    private Animator animator;
    private enum State { Idle, Patrol, Chase, Attack, Dead }
    private State currentState = State.Idle;

    void Start()
    {
        player = GameObject.FindGameObjectWithTag("Player")?.transform;
        animator = GetComponent<Animator>();
    }

    void Update()
    {
        switch (currentState)
        {
            case State.Idle: UpdateIdle(); break;
            case State.Patrol: UpdatePatrol(); break;
            case State.Chase: UpdateChase(); break;
            case State.Attack: UpdateAttack(); break;
        }
    }

    void UpdateIdle()
    {
        if (PlayerInRange(detectionRange))
            currentState = State.Chase;
    }

    void UpdatePatrol()
    {
        if (PlayerInRange(detectionRange))
            currentState = State.Chase;
    }

    void UpdateChase()
    {
        if (player == null) { currentState = State.Idle; return; }

        float distance = Vector3.Distance(transform.position, player.position);
        if (distance > detectionRange) { currentState = State.Patrol; return; }

        transform.LookAt(player);
        transform.position = Vector3.MoveTowards(transform.position, player.position, moveSpeed * Time.deltaTime);

        if (distance <= attackRange)
            currentState = State.Attack;
    }

    void UpdateAttack()
    {
        if (player == null) { currentState = State.Idle; return; }

        float distance = Vector3.Distance(transform.position, player.position);
        if (distance > attackRange) { currentState = State.Chase; return; }

        transform.LookAt(player);

        if (Time.time > lastAttackTime + attackCooldown)
        {
            lastAttackTime = Time.time;
            player.GetComponent<PlayerController>()?.TakeDamage(damage);
            animator?.SetTrigger("Attack");
        }
    }

    bool PlayerInRange(float range)
    {
        if (player == null) return false;
        return Vector3.Distance(transform.position, player.position) <= range;
    }

    public void TakeDamage(float damage)
    {
        health -= damage;
        if (health <= 0) Die();
    }

    void Die()
    {
        currentState = State.Dead;
        animator?.SetTrigger("Die");
        Destroy(gameObject, 2f);
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, detectionRange);
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, attackRange);
    }
}`,
  'HealthSystem.cs': `using UnityEngine;
using UnityEngine.Events;

public class HealthSystem : MonoBehaviour
{
    [Header("Health")]
    public float maxHealth = 100f;
    public float currentHealth;

    [Header("Settings")]
    public bool invincible = false;
    public float invincibilityDuration = 0.5f;

    [Header("Events")]
    public UnityEvent OnDamage;
    public UnityEvent OnHeal;
    public UnityEvent OnDeath;

    private float lastDamageTime;
    private bool isDead = false;

    void Start()
    {
        currentHealth = maxHealth;
    }

    public void TakeDamage(float amount)
    {
        if (invincible || isDead) return;

        if (Time.time - lastDamageTime < invincibilityDuration)
            return;

        lastDamageTime = Time.time;
        currentHealth = Mathf.Max(0, currentHealth - amount);
        OnDamage?.Invoke();

        if (currentHealth <= 0)
            Die();
    }

    public void Heal(float amount)
    {
        if (isDead) return;
        currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
        OnHeal?.Invoke();
    }

    public void SetHealth(float amount)
    {
        currentHealth = Mathf.Clamp(amount, 0, maxHealth);
    }

    public float GetHealthPercent()
    {
        return currentHealth / maxHealth;
    }

    void Die()
    {
        isDead = true;
        OnDeath?.Invoke();
        Destroy(gameObject, 2f);
    }
}`,
  'UIManager.cs': `using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class UIManager : MonoBehaviour
{
    [Header("HUD")]
    public Slider healthSlider;
    public TextMeshProUGUI healthText;
    public TextMeshProUGUI scoreText;
    public TextMeshProUGUI ammoText;

    [Header("Menus")]
    public GameObject pauseMenu;
    public GameObject gameOverMenu;
    public GameObject settingsMenu;

    [Header("Settings")]
    public KeyCode pauseKey = KeyCode.Escape;

    private bool isPaused = false;
    private int score = 0;

    void Update()
    {
        if (Input.GetKeyDown(pauseKey))
            TogglePause();
    }

    public void UpdateHealth(float current, float max)
    {
        if (healthSlider) healthSlider.value = current / max;
        if (healthText) healthText.text = $"{current}/{max}";
    }

    public void UpdateScore(int newScore)
    {
        score = newScore;
        if (scoreText) scoreText.text = score.ToString("N0");
    }

    public void AddScore(int points)
    {
        score += points;
        if (scoreText) scoreText.text = score.ToString("N0");
    }

    public void UpdateAmmo(int current, int max)
    {
        if (ammoText) ammoText.text = $"{current}/{max}";
    }

    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0 : 1;

        if (pauseMenu) pauseMenu.SetActive(isPaused);
        Cursor.lockState = isPaused ? CursorLockMode.None : CursorLockMode.Locked;
        Cursor.visible = isPaused;
    }

    public void ShowGameOver()
    {
        if (gameOverMenu) gameOverMenu.SetActive(true);
        Time.timeScale = 0;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    public void RestartGame()
    {
        Time.timeScale = 1;
        UnityEngine.SceneManagement.SceneManager.LoadScene(
            UnityEngine.SceneManagement.SceneManager.GetActiveScene().name);
    }

    public void QuitGame()
    {
        Application.Quit();
    }
}`,
};

interface Breakpoint {
  line: number;
  enabled: boolean;
  condition: string;
}

interface DebugState {
  isRunning: boolean;
  isPaused: boolean;
  currentLine: number | null;
  callStack: { function: string; file: string; line: number }[];
  variables: { name: string; value: string; type: string }[];
  watchExpressions: { expression: string; value: string }[];
}

export default function ScriptEditor() {
  const [source, setSource] = useState(templateScripts['PlayerController.cs']);
  const [scriptName, setScriptName] = useState('PlayerController.cs');
  const [diagnostics, setDiagnostics] = useState<CompileDiagnosticDto[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeBreakpoints, setActiveBreakpoints] = useState<Breakpoint[]>([]);
  const [debugTab, setDebugTab] = useState<'breakpoints' | 'callstack' | 'watch' | 'variables'>('breakpoints');
  const [debugState, setDebugState] = useState<DebugState>({
    isRunning: false, isPaused: false, currentLine: null,
    callStack: [], variables: [], watchExpressions: [],
  });
  const [hotReload, setHotReload] = useState(true);
  const [autoCompile, setAutoCompile] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [snippetSearch, setSnippetSearch] = useState('');
  const editorRef = useRef<any>(null);
  const compileTimer = useRef<number | null>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Register custom snippets
    editor.getModel()?.updateOptions({ tabSize: 4 });

    // Add breakpoint gutter click
    editor.onMouseDown((e: any) => {
      if (e.target.type === 2) { // GUTTER_GLYPH_MARGIN
        const line = e.target.position.lineNumber;
        toggleBreakpoint(line);
      }
    });
  };

  const toggleBreakpoint = (line: number) => {
    setActiveBreakpoints((prev) => {
      const existing = prev.find((b) => b.line === line);
      if (existing) return prev.filter((b) => b.line !== line);
      return [...prev, { line, enabled: true, condition: '' }];
    });
  };

  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    try {
      const { data } = await scriptsApi.updateSource('new', source);
      setDiagnostics(data.diagnostics || []);
    } catch (err) {
      console.error('Compile error:', err);
    } finally {
      setIsCompiling(false);
    }
  }, [source]);

  // Auto compile on change
  useEffect(() => {
    if (autoCompile && source) {
      if (compileTimer.current) clearTimeout(compileTimer.current);
      compileTimer.current = window.setTimeout(() => handleCompile(), 1500);
    }
    return () => { if (compileTimer.current) clearTimeout(compileTimer.current); };
  }, [source, autoCompile]);

  const markers = diagnostics.map((d) => ({
    message: d.message,
    startLineNumber: d.startLine + 1,
    startColumn: d.startColumn + 1,
    endLineNumber: d.endLine + 1,
    endColumn: d.endColumn + 1,
    severity: d.severity === 'Error' ? 8 : d.severity === 'Warning' ? 4 : 1,
  }));

  // Add breakpoint markers
  const breakpointMarkers = activeBreakpoints.filter((b) => b.enabled).map((b) => ({
    message: `Breakpoint${b.condition ? ` (${b.condition})` : ''}`,
    startLineNumber: b.line,
    startColumn: 1,
    endLineNumber: b.line,
    endColumn: 1,
    severity: 3, // Info
  }));

  const allMarkers = [...markers, ...breakpointMarkers];
  const errorCount = diagnostics.filter((d) => d.severity === 'Error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'Warning').length;

  const filteredSnippets = C_SHARP_SNIPPETS.filter(
    (s) => snippetSearch === '' || s.label.toLowerCase().includes(snippetSearch.toLowerCase())
  );

  const loadTemplate = (name: string) => {
    const content = templateScripts[name];
    if (content) {
      setSource(content);
      setScriptName(name);
      setDiagnostics([]);
      setShowTemplates(false);
    }
  };

  const startDebug = () => {
    setDebugState({
      isRunning: true, isPaused: false, currentLine: null,
      callStack: [
        { function: 'PlayerController.Update()', file: scriptName, line: 22 },
      ],
      variables: [
        { name: 'speed', value: '5.0', type: 'float' },
        { name: 'horizontal', value: '0.3', type: 'float' },
        { name: 'vertical', value: '-0.1', type: 'float' },
        { name: 'moveDirection', value: '(0.3, 0.0, -0.1)', type: 'Vector3' },
        { name: 'controller', value: '{CharacterController}', type: 'CharacterController' },
      ],
      watchExpressions: [
        { expression: 'Time.deltaTime', value: '0.016' },
        { expression: 'transform.position', value: '(1.2, 0.0, -0.5)' },
      ],
    });
  };

  const stepDebug = () => {
    setDebugState((prev) => ({
      ...prev,
      currentLine: (prev.currentLine || 21) + 1,
      variables: prev.variables.map((v) => ({
        ...v,
        value: v.name === 'horizontal' ? (Math.random() * 2 - 1).toFixed(2) : v.value,
      })),
    }));
  };

  const stopDebug = () => {
    setDebugState({ isRunning: false, isPaused: false, currentLine: null, callStack: [], variables: [], watchExpressions: [] });
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a1a]">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-1 shrink-0">
        <input value={scriptName} onChange={(e) => setScriptName(e.target.value)} className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[10px] text-[#e8e8f0] font-medium w-36" />

        <div className="relative">
          <button onClick={() => setShowTemplates(!showTemplates)} className="px-1.5 py-0.5 rounded text-[9px] text-[#6a6a8a] hover:text-white border border-[#2a2a4a]">Templates</button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl p-1 z-50 max-h-60 overflow-y-auto">
              {Object.keys(templateScripts).map((name) => (
                <button key={name} onClick={() => loadTemplate(name)} className="w-full text-left px-2 py-1 rounded text-[10px] text-[#e8e8f0] hover:bg-white/10 truncate">{name}</button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-[#2a2a4a] mx-0.5" />

        <button onClick={handleCompile} disabled={isCompiling} className="px-2 py-0.5 bg-[#e94560] text-white text-[10px] rounded hover:bg-red-600 disabled:opacity-50">
          {isCompiling ? '⏳' : '⚡ Compile'}
        </button>

        <label className="flex items-center gap-1 text-[9px] text-[#6a6a8a] cursor-pointer">
          <input type="checkbox" checked={hotReload} onChange={(e) => setHotReload(e.target.checked)} className="accent-[#e94560] w-2.5 h-2.5" />
          Hot Reload
        </label>

        <label className="flex items-center gap-1 text-[9px] text-[#6a6a8a] cursor-pointer">
          <input type="checkbox" checked={autoCompile} onChange={(e) => setAutoCompile(e.target.checked)} className="accent-[#e94560] w-2.5 h-2.5" />
          Auto
        </label>

        <div className="w-px h-4 bg-[#2a2a4a] mx-0.5" />

        {!debugState.isRunning ? (
          <button onClick={startDebug} className="px-2 py-0.5 rounded text-[10px] bg-[#44cc44] text-white hover:bg-green-600">
            ▶ Debug
          </button>
        ) : (
          <>
            <button onClick={stepDebug} className="px-1.5 py-0.5 rounded text-[10px] bg-[#4488ff] text-white hover:bg-blue-600">⏭ Step</button>
            <button onClick={() => setDebugState((s) => ({ ...s, isPaused: !s.isPaused }))} className="px-1.5 py-0.5 rounded text-[10px] bg-[#ffaa00] text-white hover:bg-yellow-600">
              {debugState.isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button onClick={stopDebug} className="px-1.5 py-0.5 rounded text-[10px] bg-[#ff4444] text-white hover:bg-red-600">⏹ Stop</button>
          </>
        )}

        <div className="flex-1" />

        {errorCount > 0 && <span className="text-[10px] text-red-400">● {errorCount} errors</span>}
        {warningCount > 0 && <span className="text-[10px] text-yellow-400">● {warningCount} warnings</span>}
        {errorCount === 0 && warningCount === 0 && source && (
          <span className="text-[10px] text-green-400">✓ OK</span>
        )}

        <div className="w-px h-4 bg-[#2a2a4a] mx-0.5" />

        <div className="relative">
          <input value={snippetSearch} onChange={(e) => setSnippetSearch(e.target.value)} placeholder="Snippets..."
            className="w-20 px-1.5 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#6a6a8a] placeholder-[#3a3a5a]"
            onFocus={() => setSnippetSearch(' ')} onBlur={() => setSnippetSearch('')}
          />
          {snippetSearch && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl p-1 z-50 max-h-60 overflow-y-auto">
              {filteredSnippets.map((snippet) => (
                <button key={snippet.label} className="w-full text-left px-2 py-1 rounded text-[10px] text-[#e8e8f0] hover:bg-white/10"
                  onClick={() => {
                    editorRef.current?.trigger('snippet', 'type', { insertText: snippet.insertText });
                    setSnippetSearch('');
                  }}
                >
                  <div className="font-medium">{snippet.label}</div>
                  <div className="text-[8px] text-[#6a6a8a] truncate">{snippet.detail}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main editor + debug panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 relative">
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
              glyphMargin: true,
              folding: true,
              foldingHighlight: true,
              links: true,
              colorDecorators: true,
              selectionHighlight: true,
              occurrencesHighlight: 'multiFile',
              renderLineHighlight: 'all',
            }}
          />

          {/* Current debug line indicator */}
          {debugState.currentLine && (
            <div className="absolute left-0 top-0 w-full pointer-events-none">
              <div className="absolute bg-yellow-500/30 w-full" style={{ height: 18, top: (debugState.currentLine - 1) * 18 + 35 }}>
                <div className="absolute left-0 w-2.5 h-2.5 bg-yellow-500 rounded-full" style={{ top: 7, left: 4 }} />
              </div>
            </div>
          )}
        </div>

        {/* Debug panel */}
        {(debugState.isRunning || activeBreakpoints.length > 0) && (
          <div className="w-56 border-l border-[#2a2a4a] flex flex-col bg-[#0f0f25]">
            <div className="flex items-center h-6 border-b border-[#2a2a4a] bg-[#1a1a35]">
              {(['breakpoints', 'callstack', 'variables', 'watch'] as const).map((tab) => (
                <button key={tab} onClick={() => setDebugTab(tab)}
                  className={`flex-1 h-full text-[8px] uppercase tracking-wider transition-colors ${
                    debugTab === tab ? 'bg-[#12122a] text-[#e94560]' : 'text-[#6a6a8a] hover:text-white'
                  }`}
                >{tab}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              {debugTab === 'breakpoints' && (
                <div className="space-y-0.5">
                  {activeBreakpoints.length === 0 && <div className="text-[9px] text-[#6a6a8a] p-2">Click the gutter to add breakpoints</div>}
                  {activeBreakpoints.map((bp) => (
                    <div key={bp.line} className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/5 text-[9px]">
                      <input type="checkbox" checked={bp.enabled} onChange={() => setActiveBreakpoints((prev) => prev.map((b) => b.line === bp.line ? { ...b, enabled: !b.enabled } : b))} className="accent-[#e94560] w-2.5 h-2.5" />
                      <span className="text-[#e94560] font-mono">● Line {bp.line}</span>
                      <button onClick={() => setActiveBreakpoints((prev) => prev.filter((b) => b.line !== bp.line))} className="ml-auto text-[#ff4444] text-[7px]">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {debugTab === 'callstack' && (
                <div className="space-y-0.5">
                  {debugState.callStack.map((frame, i) => (
                    <div key={i} className={`px-1.5 py-1 rounded text-[9px] font-mono ${i === 0 ? 'bg-[#4488ff]/10 text-[#4488ff]' : 'text-[#6a6a8a]'}`}>
                      <div>{frame.function}</div>
                      <div className="text-[7px] text-white/30">{frame.file}:{frame.line}</div>
                    </div>
                  ))}
                </div>
              )}

              {debugTab === 'variables' && (
                <div className="space-y-0.5">
                  {debugState.variables.map((v, i) => (
                    <div key={i} className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-white/5">
                      <div>
                        <span className="text-[9px] text-[#e8e8f0] font-mono">{v.name}</span>
                        <span className="text-[7px] text-[#6a6a8a] ml-1">{v.type}</span>
                      </div>
                      <span className="text-[9px] text-[#44cc44] font-mono">{v.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {debugTab === 'watch' && (
                <div className="space-y-0.5">
                  {debugState.watchExpressions.map((w, i) => (
                    <div key={i} className="px-1.5 py-1 rounded hover:bg-white/5">
                      <div className="text-[8px] text-[#6a6a8a] font-mono">{w.expression}</div>
                      <div className="text-[9px] text-[#44cc44] font-mono">{w.value}</div>
                    </div>
                  ))}
                  <input placeholder="Add watch..."
                    className="w-full px-1.5 py-1 bg-transparent border border-dashed border-[#2a2a4a] rounded text-[9px] text-[#6a6a8a] placeholder-[#3a3a5a] mt-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        setDebugState((s) => ({ ...s, watchExpressions: [...s.watchExpressions, { expression: e.currentTarget.value, value: '?' }] }));
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diagnostics panel at bottom */}
      {diagnostics.length > 0 && (
        <div className="h-24 border-t border-[#2a2a4a] overflow-y-auto shrink-0">
          {diagnostics.map((d, i) => (
            <div key={i} className={`px-3 py-1 text-[10px] font-mono border-b border-[#2a2a4a]/50 flex items-center gap-2 ${
              d.severity === 'Error' ? 'text-red-400' : d.severity === 'Warning' ? 'text-yellow-400' : 'text-blue-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.severity === 'Error' ? 'bg-red-400' : d.severity === 'Warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
              <span className="text-[8px] text-white/30 w-16 shrink-0 font-mono">L{d.startLine + 1}</span>
              <span className="flex-1">{d.message}</span>
              <span className="text-[8px] text-white/30">{d.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
