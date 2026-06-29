import { useState, useMemo, useRef, useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import type { ConsoleEntry } from '@/types';

export default function Console() {
  const { console: entries, clearConsole } = useUiStore();
  const [filter, setFilter] = useState<'all' | 'log' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (filter !== 'all') list = list.filter((e) => e.type === filter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.message.toLowerCase().includes(q));
    }
    return list;
  }, [entries, filter, searchQuery]);

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredEntries.length, autoScroll]);

  const counts = useMemo(() => ({
    all: entries.length,
    error: entries.filter((e) => e.type === 'error').length,
    warning: entries.filter((e) => e.type === 'warning').length,
    log: entries.filter((e) => e.type === 'log').length,
  }), [entries]);

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'info': return '#4488ff';
      default: return '#e8e8f0';
    }
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '○';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#12122a] border-b border-[#2a2a4a] gap-1 shrink-0">
        {(['all', 'error', 'warning', 'log'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
              filter === type
                ? 'bg-[#e94560] text-white'
                : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
            }`}
          >
            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            {counts[type] > 0 && (
              <span className="text-[9px] opacity-70">({counts[type]})</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter..."
          className="w-24 px-1.5 py-0.5 text-[10px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#6a6a8a]/50"
        />
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-1.5 py-0.5 rounded text-[10px] ${autoScroll ? 'text-[#e94560]' : 'text-[#6a6a8a]'}`}
          title="Auto-scroll"
        >
          ↓
        </button>
        <button
          onClick={clearConsole}
          className="px-1.5 py-0.5 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]"
          title="Clear"
        >
          Clear
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto font-mono">
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 px-2 py-1 hover:bg-[#1a1a35]/50 cursor-pointer transition-colors text-xs border-b border-[#2a2a4a]/30"
            style={{ color: getEntryColor(entry.type) }}
          >
            <span className="text-[10px] mt-0.5 shrink-0">{getEntryIcon(entry.type)}</span>
            <span className="flex-1 leading-relaxed">{entry.message}</span>
            <span className="text-[9px] text-[#3a3a5a] shrink-0 mt-0.5">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="flex items-center justify-center h-full text-xs text-[#6a6a8a]">
            <div className="text-center">
              <div className="text-lg mb-1 opacity-30">◻</div>
              No messages
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
