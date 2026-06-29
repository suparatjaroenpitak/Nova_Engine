import { useState, useEffect, useRef } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useNavigate } from 'react-router-dom';

const commands = [
  { id: 'new-scene', label: 'New Scene', category: 'Scene' },
  { id: 'new-gameobject', label: 'Create Empty GameObject', category: 'GameObject' },
  { id: 'new-cube', label: 'Create Cube', category: 'GameObject' },
  { id: 'new-sphere', label: 'Create Sphere', category: 'GameObject' },
  { id: 'new-camera', label: 'Create Camera', category: 'GameObject' },
  { id: 'new-light', label: 'Create Directional Light', category: 'GameObject' },
  { id: 'save', label: 'Save Scene', category: 'File' },
  { id: 'undo', label: 'Undo', category: 'Edit' },
  { id: 'redo', label: 'Redo', category: 'Edit' },
  { id: 'toggle-console', label: 'Toggle Console', category: 'View' },
  { id: 'toggle-profiler', label: 'Toggle Profiler', category: 'View' },
  { id: 'toggle-assets', label: 'Toggle Assets', category: 'View' },
  { id: 'toggle-inspector', label: 'Toggle Inspector', category: 'View' },
  { id: 'toggle-hierarchy', label: 'Toggle Hierarchy', category: 'View' },
  { id: 'toggle-animation', label: 'Toggle Animation', category: 'View' },
  { id: 'toggle-timeline', label: 'Toggle Timeline', category: 'View' },
  { id: 'play', label: 'Play', category: 'Game' },
  { id: 'pause', label: 'Pause', category: 'Game' },
  { id: 'stop', label: 'Stop', category: 'Game' },
];

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const setCommandPalette = useUiStore((s) => s.setCommandPalette);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPalette(false);
    } else if (e.key === 'ArrowDown') {
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      executeCommand(filtered[selectedIndex].id);
    }
  };

  const executeCommand = (id: string) => {
    switch (id) {
      case 'toggle-console': togglePanel('console'); break;
      case 'toggle-profiler': togglePanel('profiler'); break;
      case 'toggle-assets': togglePanel('assets'); break;
      case 'toggle-inspector': togglePanel('inspector'); break;
      case 'toggle-hierarchy': togglePanel('hierarchy'); break;
      case 'toggle-animation': togglePanel('animation'); break;
      case 'toggle-timeline': togglePanel('timeline'); break;
    }
    setCommandPalette(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setCommandPalette(false)}>
      <div className="w-full max-w-lg bg-nova-surface border border-nova-border rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="w-full px-4 py-3 bg-nova-bg border-b border-nova-border text-nova-text placeholder-nova-muted outline-none"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              onClick={() => executeCommand(cmd.id)}
              className={`px-4 py-2 flex items-center justify-between cursor-pointer text-sm ${i === selectedIndex ? 'bg-nova-active text-white' : 'text-nova-text hover:bg-nova-hover'}`}
            >
              <span>{cmd.label}</span>
              <span className="text-xs text-nova-muted">{cmd.category}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-nova-muted text-sm">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
}
