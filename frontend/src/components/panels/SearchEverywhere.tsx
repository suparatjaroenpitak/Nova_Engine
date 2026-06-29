import { useState, useEffect, useRef, useMemo } from 'react';
import { useUiStore } from '@/stores/uiStore';

interface SearchResult {
  id: string;
  label: string;
  description: string;
  category: 'GameObject' | 'Asset' | 'Script' | 'Component' | 'Setting' | 'Command' | 'Scene';
  icon: string;
  action: () => void;
}

export default function SearchEverywhere() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allResults: SearchResult[] = useMemo(() => [
    { id: 'scene-1', label: 'MainScene', description: 'Scenes/MainScene.nova', category: 'Scene', icon: '🎬', action: () => {} },
    { id: 'scene-2', label: 'UIScene', description: 'Scenes/UIScene.nova', category: 'Scene', icon: '🎬', action: () => {} },
    { id: 'go-1', label: 'Player', description: 'GameObject', category: 'GameObject', icon: '◇', action: () => {} },
    { id: 'go-2', label: 'Enemy', description: 'GameObject', category: 'GameObject', icon: '◇', action: () => {} },
    { id: 'go-3', label: 'Main Camera', description: 'GameObject', category: 'GameObject', icon: '◇', action: () => {} },
    { id: 'asset-1', label: 'PlayerController.cs', description: 'Scripts/', category: 'Script', icon: '📄', action: () => useUiStore.getState().togglePanel('script') },
    { id: 'asset-2', label: 'EnemyAI.cs', description: 'Scripts/', category: 'Script', icon: '📄', action: () => {} },
    { id: 'asset-3', label: 'Ground.mat', description: 'Materials/', category: 'Asset', icon: '🎨', action: () => {} },
    { id: 'asset-4', label: 'coin.fbx', description: 'Models/', category: 'Asset', icon: '📦', action: () => {} },
    { id: 'asset-5', label: 'background.png', description: 'Textures/', category: 'Asset', icon: '🖼', action: () => {} },
    { id: 'comp-1', label: 'Rigidbody', description: 'Physics component', category: 'Component', icon: '⚙', action: () => {} },
    { id: 'comp-2', label: 'Box Collider', description: 'Physics component', category: 'Component', icon: '▣', action: () => {} },
    { id: 'comp-3', label: 'Camera', description: 'Rendering component', category: 'Component', icon: '📷', action: () => {} },
    { id: 'cmd-1', label: 'Build Project', description: 'Build settings', category: 'Command', icon: '🔨', action: () => useUiStore.getState().togglePanel('build') },
    { id: 'cmd-2', label: 'Toggle Console', description: 'Show/hide console', category: 'Command', icon: '⌨', action: () => useUiStore.getState().togglePanel('console') },
    { id: 'cmd-3', label: 'Toggle Profiler', description: 'Show/hide profiler', category: 'Command', icon: '📊', action: () => useUiStore.getState().togglePanel('profiler') },
    { id: 'cmd-4', label: 'Play Mode', description: 'Start/stop game', category: 'Command', icon: '▶', action: () => useUiStore.getState().startPlaying() },
    { id: 'setting-1', label: 'Render Pipeline', description: 'URP/HDRP/Built-in', category: 'Setting', icon: '⚡', action: () => {} },
    { id: 'setting-2', label: 'Physics Settings', description: 'Gravity, layers, etc.', category: 'Setting', icon: '🌍', action: () => {} },
  ], []);

  const results = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 20);
    const q = query.toLowerCase();
    return allResults.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [query, allResults]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      useUiStore.getState().setCommandPalette(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      results[selectedIndex].action();
      useUiStore.getState().setCommandPalette(false);
    }
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [results]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]">
      <div
        className="w-full max-w-2xl bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-[#2a2a4a]">
          <span className="text-sm text-[#6a6a8a] mr-2">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything... (GameObjects, Assets, Components, Commands)"
            className="flex-1 py-3 bg-transparent border-0 outline-none text-sm text-[#e8e8f0] placeholder-[#6a6a8a]/50"
          />
          <kbd className="text-[10px] text-[#6a6a8a] bg-[#0a0a1a] px-1.5 py-0.5 rounded border border-[#2a2a4a]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1 text-[10px] text-[#6a6a8a] uppercase tracking-wider font-medium bg-[#0f0f25]">
                {category}
              </div>
              {items.map((result, i) => {
                const globalIndex = results.indexOf(result);
                return (
                  <div
                    key={result.id}
                    onClick={() => { result.action(); useUiStore.getState().setCommandPalette(false); }}
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      globalIndex === selectedIndex
                        ? 'bg-[#e94560]/20 text-white'
                        : 'text-[#e8e8f0] hover:bg-[#1a1a35]'
                    }`}
                  >
                    <span className="text-sm">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{result.label}</div>
                      <div className="text-[10px] text-[#6a6a8a] truncate">{result.description}</div>
                    </div>
                    <span className="text-[9px] text-[#6a6a8a] bg-[#0a0a1a] px-1.5 py-0.5 rounded border border-[#2a2a4a]">
                      {result.category}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#6a6a8a]">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#0f0f25] border-t border-[#2a2a4a]">
          <span className="text-[10px] text-[#6a6a8a] flex items-center gap-1">
            <kbd className="text-[9px] bg-[#1a1a35] px-1 py-0.5 rounded border border-[#3a3a5a]">↑↓</kbd> Navigate
          </span>
          <span className="text-[10px] text-[#6a6a8a] flex items-center gap-1">
            <kbd className="text-[9px] bg-[#1a1a35] px-1 py-0.5 rounded border border-[#3a3a5a]">↵</kbd> Open
          </span>
          <span className="text-[10px] text-[#6a6a8a] flex items-center gap-1">
            <kbd className="text-[9px] bg-[#1a1a35] px-1 py-0.5 rounded border border-[#3a3a5a]">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
