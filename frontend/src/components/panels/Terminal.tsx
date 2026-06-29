import { useState, useRef, useEffect, useCallback } from 'react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'info';
}

const WELCOME = [
  { text: 'Nova Engine Terminal v1.0.0', type: 'info' as const },
  { text: 'Type "help" for available commands', type: 'info' as const },
  { text: '', type: 'info' as const },
];

const COMMANDS: Record<string, { desc: string; run: () => TerminalLine[] }> = {
  help: {
    desc: 'Show available commands',
    run: () => [
      { text: 'Available commands:', type: 'info' },
      ...Object.entries({
        help: 'Show this help',
        clear: 'Clear terminal',
        echo: 'Print text',
        ls: 'List project files',
        build: 'Build current project',
        run: 'Run the game',
        status: 'Show project status',
        version: 'Show engine version',
      }).map(([cmd, desc]) => ({ text: `  ${cmd.padEnd(15)}${desc}`, type: 'output' as const })),
    ],
  },
  clear: {
    desc: 'Clear terminal',
    run: () => [],
  },
  version: {
    desc: 'Show engine version',
    run: () => [{ text: 'Nova Engine v1.0.0 (Build 2024)', type: 'output' }],
  },
  status: {
    desc: 'Show project status',
    run: () => [
      { text: 'Project: Awesome Game', type: 'output' },
      { text: 'Scene: MainScene', type: 'output' },
      { text: 'Scripts: 5 (0 errors)', type: 'output' },
      { text: 'Assets: 42', type: 'output' },
      { text: 'Build: Ready', type: 'output' },
    ],
  },
  ls: {
    desc: 'List files',
    run: () => [
      { text: 'Assets/', type: 'output' },
      { text: '  Scenes/', type: 'output' },
      { text: '  Scripts/', type: 'output' },
      { text: '  Materials/', type: 'output' },
      { text: '  Prefabs/', type: 'output' },
      { text: '  Textures/', type: 'output' },
    ],
  },
};

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      { text: `$ ${trimmed}`, type: 'input' },
    ];

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (command === 'echo') {
      newLines.push({ text: args.join(' '), type: 'output' });
    } else if (COMMANDS[command]) {
      newLines.push(...COMMANDS[command].run());
    } else {
      newLines.push({ text: `Command not found: ${command}. Type "help" for available commands.`, type: 'error' });
    }

    if (command === 'clear') {
      setLines([]);
    } else {
      setLines((prev) => [...prev, ...newLines]);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-[#0a0a1a] font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-2">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed whitespace-pre-wrap ${
              line.type === 'error' ? 'text-red-400' :
              line.type === 'input' ? 'text-[#44cc44]' :
              line.type === 'info' ? 'text-[#4488cc]' :
              'text-[#e8e8f0]'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-center px-2 py-1.5 border-t border-[#2a2a4a]">
        <span className="text-xs text-[#44cc44] mr-1">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-[#e8e8f0] font-mono"
          placeholder="Type a command..."
          spellCheck={false}
          autoComplete="off"
        />
        <div className="text-[10px] text-[#6a6a8a]">
          {lines.length} lines
        </div>
      </div>
    </div>
  );
}
