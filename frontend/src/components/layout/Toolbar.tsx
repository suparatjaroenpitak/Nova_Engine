import { useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

export default function Toolbar() {
  const { gizmoMode, setGizmoMode, toggleGizmoSpace, gizmoSpace, snapping, toggleSnapping, gridVisible, toggleGrid, togglePanel, panels, setCommandPalette } = useUiStore();
  const { copyGameObject, pasteGameObject, selectedGameObject } = useSceneStore();
  const [mobileMenu, setMobileMenu] = useState(false);

  const toolButtons = [
    { mode: 'translate' as const, icon: '↕', label: 'Move (W)' },
    { mode: 'rotate' as const, icon: '↻', label: 'Rotate (E)' },
    { mode: 'scale' as const, icon: '⇔', label: 'Scale (R)' },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden h-9 bg-nova-surface border-b border-nova-border flex items-center px-2 gap-1">
        {toolButtons.map((t) => (
          <button
            key={t.mode}
            onClick={() => setGizmoMode(t.mode)}
            className={`px-2 py-1 rounded text-xs ${gizmoMode === t.mode ? 'bg-nova-accent text-white' : 'text-nova-muted hover:text-nova-text hover:bg-nova-hover'}`}
          >
            {t.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text"
        >
          {mobileMenu ? '✕' : '☰'}
        </button>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden md:flex h-9 bg-nova-surface border-b border-nova-border items-center px-2 gap-1">
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
          title="Toggle space"
        >
          {gizmoSpace === 'world' ? '🌐' : '◻'} {gizmoSpace}
        </button>

        <button
          onClick={toggleSnapping}
          className={`px-2 py-1 rounded text-xs ${snapping ? 'bg-nova-accent text-white' : 'text-nova-muted hover:text-nova-text'}`}
          title="Toggle snap"
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

        {/* Panel toggles */}
        {(['hierarchy', 'inspector', 'assets', 'console', 'animation', 'timeline', 'ai', 'lighting'] as const).map((p) => (
          <button
            key={p}
            onClick={() => togglePanel(p)}
            className={`px-2 py-1 rounded text-xs ${panels[p].visible ? 'bg-nova-active text-white' : 'text-nova-muted hover:text-nova-text'}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        <div className="w-px h-5 bg-nova-border mx-2" />

        <button
          onClick={() => setCommandPalette(true)}
          className="px-2 py-1 rounded text-xs text-nova-muted hover:text-nova-text hover:bg-nova-hover border border-nova-border/50"
        >
          ⌘K
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-9 right-0 w-56 glass border border-nova-border rounded-bl-xl p-3 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <button onClick={() => { toggleGizmoSpace(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded text-xs text-nova-muted hover:bg-nova-hover hover:text-nova-text">
                Space: {gizmoSpace}
              </button>
              <button onClick={() => { toggleSnapping(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded text-xs text-nova-muted hover:bg-nova-hover hover:text-nova-text">
                Snap: {snapping ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => { toggleGrid(); setMobileMenu(false); }} className="w-full text-left px-3 py-2 rounded text-xs text-nova-muted hover:bg-nova-hover hover:text-nova-text">
                Grid: {gridVisible ? 'ON' : 'OFF'}
              </button>
              <div className="h-px bg-nova-border my-2" />
              {(['hierarchy', 'inspector', 'assets', 'console', 'ai', 'lighting'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { togglePanel(p); setMobileMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded text-xs ${panels[p].visible ? 'text-nova-accent' : 'text-nova-muted'} hover:bg-nova-hover`}
                >
                  {p === 'ai' ? 'AI Assistant' : p.charAt(0).toUpperCase() + p.slice(1)}: {panels[p].visible ? 'ON' : 'OFF'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
