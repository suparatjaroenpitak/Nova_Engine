import { useState } from 'react';
import { useUiStore, GizmoMode } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

const GIZMO_TOOLS: { mode: GizmoMode; icon: string; label: string; shortcut: string }[] = [
  { mode: 'translate', icon: '↕', label: 'Move', shortcut: 'Q' },
  { mode: 'rotate', icon: '↻', label: 'Rotate', shortcut: 'W' },
  { mode: 'scale', icon: '⇔', label: 'Scale', shortcut: 'E' },
  { mode: 'rect', icon: '▭', label: 'Rect', shortcut: 'R' },
];

const PANEL_TOOLS = [
  { id: 'hierarchy' as const, icon: '⊞', label: 'Hierarchy' },
  { id: 'inspector' as const, icon: '☰', label: 'Inspector' },
  { id: 'assets' as const, icon: '📁', label: 'Project' },
  { id: 'console' as const, icon: '⌨', label: 'Console' },
  { id: 'animation' as const, icon: '▶', label: 'Animation' },
  { id: 'timeline' as const, icon: '⏱', label: 'Timeline' },
  { id: 'ai' as const, icon: '🤖', label: 'AI' },
  { id: 'lighting' as const, icon: '☀', label: 'Lighting' },
  { id: 'profiler' as const, icon: '📊', label: 'Profiler' },
  { id: 'terrain' as const, icon: '⛰', label: 'Terrain' },
  { id: 'materialEditor' as const, icon: '🎨', label: 'Material' },
  { id: 'shaderGraph' as const, icon: '💻', label: 'Shaders' },
];

export default function Toolbar() {
  const {
    gizmoMode, setGizmoMode, toggleGizmoSpace, gizmoSpace,
    snapping, toggleSnapping, snapSize, setSnapSize,
    gridVisible, toggleGrid, setCommandPalette,
    isPlaying, startPlaying, stopPlaying,
  } = useUiStore();

  const { copyGameObject, pasteGameObject, selectedGameObject, undo, redo } = useSceneStore();
  const togglePanel = useUiStore((s) => s.togglePanel);
  const panels = useUiStore((s) => s.panels);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSnapMenu, setShowSnapMenu] = useState(false);

  return (
    <>
      {/* Mobile toolbar */}
      <div className="md:hidden h-9 bg-[#12122a] border-b border-[#2a2a4a] flex items-center px-2 gap-1">
        {GIZMO_TOOLS.slice(0, 3).map((t) => (
          <button
            key={t.mode}
            onClick={() => setGizmoMode(t.mode)}
            className={`px-2 py-1 rounded text-xs ${gizmoMode === t.mode ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
          >
            {t.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setMobileMenu(!mobileMenu)} className="px-2 py-1 rounded text-xs text-[#6a6a8a]">
          {mobileMenu ? '✕' : '☰'}
        </button>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden md:flex h-9 bg-[#12122a] border-b border-[#2a2a4a] items-center px-2 gap-0.5">
        {/* Gizmo tools */}
        {GIZMO_TOOLS.map((t) => (
          <button
            key={t.mode}
            onClick={() => setGizmoMode(t.mode)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              gizmoMode === t.mode
                ? 'bg-[#e94560] text-white shadow-sm shadow-[#e94560]/30'
                : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
            }`}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-[#2a2a4a] mx-1.5" />

        {/* Transform controls */}
        <button
          onClick={toggleGizmoSpace}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            gizmoSpace === 'local' ? 'bg-[#1a1a35] text-white' : 'text-[#6a6a8a] hover:text-white'
          }`}
          title="Toggle coordinate space"
        >
          {gizmoSpace === 'world' ? 'Global' : 'Local'}
        </button>

        {/* Snap controls */}
        <div className="relative">
          <button
            onClick={() => setShowSnapMenu(!showSnapMenu)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              snapping ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-[#6a6a8a] hover:text-white'
            }`}
          >
            Snap {snapSize.toFixed(1)}
          </button>
          {showSnapMenu && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-xl p-1 z-50">
              {[0.1, 0.25, 0.5, 1, 2.5, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => { setSnapSize(size); setShowSnapMenu(false); }}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] ${snapSize === size ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-[#6a6a8a] hover:text-white'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleGrid}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${gridVisible ? 'bg-[#1a1a35] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
        >
          Grid
        </button>

        <div className="w-px h-5 bg-[#2a2a4a] mx-1.5" />

        {/* Edit operations */}
        <button onClick={() => copyGameObject()} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]">
          Copy
        </button>
        <button onClick={() => selectedGameObject && pasteGameObject(selectedGameObject.sceneId)} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]">
          Paste
        </button>
        <button onClick={() => selectedGameObject && useSceneStore.getState().duplicateGameObject(selectedGameObject.id)} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]">
          Dup
        </button>
        <button onClick={() => selectedGameObject && useSceneStore.getState().deleteGameObject(selectedGameObject.id)} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]">
          Del
        </button>

        <div className="w-px h-5 bg-[#2a2a4a] mx-1.5" />

        {/* Undo/Redo */}
        <button onClick={undo} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]" title="Undo (Ctrl+Z)">
          ↩
        </button>
        <button onClick={redo} className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]" title="Redo (Ctrl+Shift+Z)">
          ↪
        </button>

        <div className="flex-1" />

        {/* Play controls */}
        <div className="flex items-center gap-0.5 border-r border-[#2a2a4a] pr-1.5 mr-1.5">
          <button
            onClick={startPlaying}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${isPlaying ? 'bg-green-500 text-white' : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'}`}
            title="Play"
          >
            ▶
          </button>
          <button
            onClick={stopPlaying}
            className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]"
            title="Stop"
          >
            ⏹
          </button>
        </div>

        {/* Panel toggles */}
        {PANEL_TOOLS.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePanel(p.id)}
            className={`px-1.5 py-1 rounded text-[10px] transition-colors ${
              panels[p.id]?.visible ? 'text-white bg-[#1a1a35]' : 'text-[#6a6a8a] hover:text-white'
            }`}
            title={p.label}
          >
            {p.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-[#2a2a4a] mx-1.5" />

        {/* Search */}
        <button
          onClick={() => setCommandPalette(true)}
          className="px-2 py-1 rounded text-[10px] text-[#6a6a8a] hover:text-white border border-[#2a2a4a] hover:border-[#3a3a5a] transition-colors flex items-center gap-1"
        >
          🔍
          <kbd className="text-[9px] bg-[#0a0a1a] px-1 rounded">Ctrl+K</kbd>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute top-9 right-0 w-56 bg-[#12122a] border border-[#2a2a4a] rounded-bl-xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-0.5">
              {PANEL_TOOLS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { togglePanel(p.id); setMobileMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded text-xs ${panels[p.id]?.visible ? 'text-[#e94560]' : 'text-[#6a6a8a]'}`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
