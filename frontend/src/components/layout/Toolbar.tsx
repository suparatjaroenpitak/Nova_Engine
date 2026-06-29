import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

export default function Toolbar() {
  const { gizmoMode, setGizmoMode, toggleGizmoSpace, gizmoSpace, snapping, toggleSnapping, gridVisible, toggleGrid, togglePanel, panels, setCommandPalette, showContextMenuAt } = useUiStore();
  const { copyGameObject, pasteGameObject, selectedGameObject } = useSceneStore();

  const toolButtons = [
    { mode: 'translate' as const, icon: '↕', label: 'Move' },
    { mode: 'rotate' as const, icon: '🔄', label: 'Rotate' },
    { mode: 'scale' as const, icon: '⬜', label: 'Scale' },
  ];

  return (
    <div className="h-9 bg-nova-surface border-b border-nova-border flex items-center px-2 gap-1">
      {toolButtons.map((t) => (
        <button
          key={t.mode}
          onClick={() => setGizmoMode(t.mode)}
          className={`px-2 py-1 rounded text-xs ${gizmoMode === t.mode ? 'bg-nova-accent text-white' : 'text-nova-muted hover:text-nova-text hover:bg-nova-hover'}`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-px h-5 bg-nova-border mx-1" />

      <button
        onClick={toggleGizmoSpace}
        className={`px-2 py-1 rounded text-xs ${gizmoSpace === 'local' ? 'bg-nova-active text-white' : 'text-nova-muted hover:text-nova-text'}`}
      >
        {gizmoSpace === 'world' ? '🌐' : '◻'} {gizmoSpace}
      </button>

      <button
        onClick={toggleSnapping}
        className={`px-2 py-1 rounded text-xs ${snapping ? 'bg-nova-accent text-white' : 'text-nova-muted hover:text-nova-text'}`}
      >
        ⬡ Snap
      </button>

      <button
        onClick={toggleGrid}
        className={`px-2 py-1 rounded text-xs ${gridVisible ? 'bg-nova-active text-white' : 'text-nova-muted hover:text-nova-text'}`}
      >
        ▦ Grid
      </button>

      <div className="w-px h-5 bg-nova-border mx-1" />

      <button onClick={copyGameObject} className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text hover:bg-nova-hover">
        Copy
      </button>
      <button onClick={() => selectedGameObject && pasteGameObject(selectedGameObject.sceneId)} className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text hover:bg-nova-hover">
        Paste
      </button>
      <button onClick={() => selectedGameObject && useSceneStore.getState().duplicateGameObject(selectedGameObject.id)} className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text hover:bg-nova-hover">
        Duplicate
      </button>

      <div className="flex-1" />

      <button
        onClick={() => setCommandPalette(true)}
        className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text hover:bg-nova-hover"
      >
        ⌘K
      </button>
    </div>
  );
}
