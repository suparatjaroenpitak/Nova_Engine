import { useUiStore } from '@/stores/uiStore';

export default function Console() {
  const { console: entries, clearConsole } = useUiStore();

  const typeColors = {
    log: 'text-gray-300',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center h-7 gap-1 px-2 border-b border-nova-border bg-nova-surface2/30">
        <button className="px-2 py-1 text-xs text-nova-muted hover:text-nova-text rounded hover:bg-nova-hover">Clear</button>
        <button onClick={clearConsole} className="px-2 py-1 text-xs text-nova-muted hover:text-nova-text rounded hover:bg-nova-hover">Collapse</button>
        <div className="flex-1" />
        <span className="text-xs text-nova-muted">{entries.length} entries</span>
        <span className="w-px h-3 bg-nova-border mx-1" />
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {entries.map((entry) => (
          <div key={entry.id} className={`px-3 py-1 border-b border-nova-border/50 hover:bg-nova-hover/50 ${typeColors[entry.type]}`}>
            <span className="opacity-50 mr-2">[{entry.timestamp.toLocaleTimeString()}]</span>
            {entry.message}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="px-3 py-4 text-nova-muted text-xs">No messages</div>
        )}
      </div>
    </div>
  );
}
