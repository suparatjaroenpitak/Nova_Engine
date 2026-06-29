import { useState, useRef, useEffect } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSceneStore } from '@/stores/sceneStore';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
  checked?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const MENUS: MenuGroup[] = [
  {
    label: 'File',
    items: [
      { label: 'New Scene', shortcut: 'Ctrl+N', action: () => console.log('New Scene') },
      { label: 'Open Scene', shortcut: 'Ctrl+O', action: () => console.log('Open Scene') },
      { label: 'Save Scene', shortcut: 'Ctrl+S', action: () => console.log('Save') },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => console.log('Save As') },
      { separator: true, label: '' },
      { label: 'New Project', action: () => console.log('New Project') },
      { label: 'Open Project', action: () => console.log('Open Project') },
      { separator: true, label: '' },
      { label: 'Build Settings', action: () => useUiStore.getState().togglePanel('build') },
      { label: 'Build & Run', shortcut: 'Ctrl+B', action: () => console.log('Build & Run') },
      { separator: true, label: '' },
      { label: 'Exit', action: () => window.close() },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => useSceneStore.getState().undo() },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => useSceneStore.getState().redo() },
      { separator: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => {} },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => useSceneStore.getState().copyGameObject() },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => {} },
      { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => {
        const sel = useSceneStore.getState().selectedGameObject;
        if (sel) useSceneStore.getState().duplicateGameObject(sel.id);
      }},
      { separator: true, label: '' },
      { label: 'Delete', shortcut: 'Del', action: () => {
        const sel = useSceneStore.getState().selectedGameObject;
        if (sel) useSceneStore.getState().deleteGameObject(sel.id);
      }},
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => {} },
    ],
  },
  {
    label: 'GameObject',
    items: [
      { label: 'Create Empty', shortcut: 'Ctrl+Shift+N', action: () => {
        const store = useSceneStore.getState();
        if (store.currentSceneId) store.createGameObject(store.currentSceneId, 'GameObject');
      }},
      { separator: true, label: '' },
      { label: '3D Object', submenu: [
        { label: 'Cube', action: () => {} },
        { label: 'Sphere', action: () => {} },
        { label: 'Capsule', action: () => {} },
        { label: 'Cylinder', action: () => {} },
        { label: 'Plane', action: () => {} },
        { label: 'Quad', action: () => {} },
        { label: 'Terrain', action: () => {} },
      ]},
      { label: '2D Object', submenu: [
        { label: 'Sprite', action: () => {} },
        { label: 'Sprite Shape', action: () => {} },
        { label: 'Tilemap', action: () => {} },
      ]},
      { label: 'Light', submenu: [
        { label: 'Directional Light', action: () => {} },
        { label: 'Point Light', action: () => {} },
        { label: 'Spot Light', action: () => {} },
        { label: 'Area Light', action: () => {} },
      ]},
      { label: 'Audio', submenu: [
        { label: 'Audio Source', action: () => {} },
        { label: 'Audio Listener', action: () => {} },
      ]},
      { label: 'UI', submenu: [
        { label: 'Canvas', action: () => {} },
        { label: 'Image', action: () => {} },
        { label: 'Text', action: () => {} },
        { label: 'Button', action: () => {} },
        { label: 'Slider', action: () => {} },
      ]},
      { label: 'Camera', action: () => {} },
      { label: 'Particle System', action: () => {} },
      { separator: true, label: '' },
      { label: 'Group', shortcut: 'Ctrl+G', action: () => {} },
      { label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: () => {} },
    ],
  },
  {
    label: 'Component',
    items: [
      { label: 'Add Component...', action: () => {} },
      { separator: true, label: '' },
      { label: 'Mesh', submenu: [
        { label: 'Mesh Filter', action: () => {} },
        { label: 'Mesh Renderer', action: () => {} },
        { label: 'Skinned Mesh Renderer', action: () => {} },
      ]},
      { label: 'Physics', submenu: [
        { label: 'Rigidbody', action: () => {} },
        { label: 'Box Collider', action: () => {} },
        { label: 'Sphere Collider', action: () => {} },
        { label: 'Capsule Collider', action: () => {} },
        { label: 'Mesh Collider', action: () => {} },
        { label: 'Character Controller', action: () => {} },
      ]},
      { label: 'Audio', submenu: [
        { label: 'Audio Source', action: () => {} },
        { label: 'Audio Listener', action: () => {} },
        { label: 'Audio Reverb Zone', action: () => {} },
      ]},
      { label: 'Rendering', submenu: [
        { label: 'Sprite Renderer', action: () => {} },
        { label: 'Line Renderer', action: () => {} },
        { label: 'Trail Renderer', action: () => {} },
        { label: 'Canvas Renderer', action: () => {} },
      ]},
      { label: 'Script', action: () => {} },
    ],
  },
  {
    label: 'Assets',
    items: [
      { label: 'Import New Asset...', action: () => {} },
      { label: 'Import Package', submenu: [
        { label: 'Custom Package...', action: () => {} },
        { label: 'All Packages...', action: () => {} },
      ]},
      { label: 'Export Package...', action: () => {} },
      { separator: true, label: '' },
      { label: 'Show in Explorer', action: () => {} },
      { label: 'Refresh', shortcut: 'Ctrl+R', action: () => {} },
      { label: 'Reimport All', action: () => {} },
    ],
  },
  {
    label: 'Window',
    items: [
      { label: 'Layout', submenu: [
        { label: 'Default Layout', action: () => useWorkspaceStore.getState().resetLayout() },
        { label: 'Save Layout...', action: () => {} },
        { label: 'Delete Layout...', action: () => {} },
      ]},
      { separator: true, label: '' },
      { label: 'Scene', action: () => useUiStore.getState().togglePanel('scene') },
      { label: 'Game', action: () => useUiStore.getState().togglePanel('game') },
      { label: 'Hierarchy', action: () => useUiStore.getState().togglePanel('hierarchy') },
      { label: 'Inspector', action: () => useUiStore.getState().togglePanel('inspector') },
      { label: 'Project', action: () => useUiStore.getState().togglePanel('assets') },
      { label: 'Console', action: () => useUiStore.getState().togglePanel('console') },
      { label: 'Animation', action: () => useUiStore.getState().togglePanel('animation') },
      { label: 'Timeline', action: () => useUiStore.getState().togglePanel('timeline') },
      { label: 'Profiler', action: () => useUiStore.getState().togglePanel('profiler') },
      { label: 'Lighting', action: () => useUiStore.getState().togglePanel('lighting') },
      { label: 'Material Editor', action: () => useUiStore.getState().togglePanel('materialEditor') },
      { label: 'Shader Graph', action: () => useUiStore.getState().togglePanel('shaderGraph') },
      { label: 'Terrain', action: () => useUiStore.getState().togglePanel('terrain') },
      { label: 'Navigation', action: () => useUiStore.getState().togglePanel('navigationWindow') },
      { label: 'Physics Debugger', action: () => useUiStore.getState().togglePanel('physicsDebugger') },
      { label: 'Build Settings', action: () => useUiStore.getState().togglePanel('build') },
      { label: 'Version Control', action: () => useUiStore.getState().togglePanel('versionControl') },
      { label: 'Terminal', action: () => useUiStore.getState().togglePanel('terminal') },
      { label: 'Package Manager', action: () => useUiStore.getState().togglePanel('packageManager') },
      { separator: true, label: '' },
      { label: 'AI Assistant', action: () => useUiStore.getState().togglePanel('ai') },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'AI Assistant', action: () => useUiStore.getState().togglePanel('ai') },
      { label: 'Search Everywhere', shortcut: 'Ctrl+Shift+F', action: () => useUiStore.getState().setCommandPalette(true) },
      { separator: true, label: '' },
      { label: 'Generate Documentation', action: () => {} },
      { label: 'Run Performance Test', action: () => {} },
      { label: 'Check for Updates', action: () => {} },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'About Nova Engine', action: () => {} },
      { label: 'Documentation', action: () => window.open('https://nova-engine.dev/docs', '_blank') },
      { label: 'Report a Bug', action: () => {} },
      { label: 'Community Forums', action: () => {} },
      { separator: true, label: '' },
      { label: 'Check for Updates', action: () => {} },
      { label: 'License', action: () => {} },
    ],
  },
];

function MenuDropdown({ menu, onClose }: { menu: MenuGroup; onClose: () => void }) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <div
      className="absolute top-full left-0 min-w-[200px] bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl py-1 z-[9999] animate-scale-in"
      onMouseEnter={() => setActiveSubmenu(null)}
    >
      {menu.items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="h-px bg-[#2a2a4a] my-1" />;
        }

        return (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
            onMouseLeave={() => item.submenu && setActiveSubmenu(null)}
          >
            <button
              disabled={item.disabled}
              onClick={() => {
                item.action?.();
                if (!item.submenu) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                item.disabled
                  ? 'text-[#3a3a5a] cursor-not-allowed'
                  : 'text-[#e8e8f0] hover:bg-[#e94560]/20 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.checked !== undefined && (
                  <span className="w-3 text-[10px]">{item.checked ? '✓' : ''}</span>
                )}
                {item.label}
              </span>
              <span className="flex items-center gap-1">
                {item.shortcut && (
                  <span className="text-[10px] text-[#6a6a8a] ml-4">{item.shortcut}</span>
                )}
                {item.submenu && <span className="text-[10px] text-[#6a6a8a]">▶</span>}
              </span>
            </button>

            {item.submenu && activeSubmenu === item.label && (
              <div className="absolute left-full top-0 min-w-[180px] bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl py-1 z-[9999]">
                {item.submenu.map((subItem, j) => (
                  subItem.separator ? (
                    <div key={j} className="h-px bg-[#2a2a4a] my-1" />
                  ) : (
                    <button
                      key={j}
                      disabled={subItem.disabled}
                      onClick={() => { subItem.action?.(); onClose(); }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                        subItem.disabled
                          ? 'text-[#3a3a5a] cursor-not-allowed'
                          : 'text-[#e8e8f0] hover:bg-[#e94560]/20 hover:text-white'
                      }`}
                    >
                      <span>{subItem.label}</span>
                      {subItem.shortcut && (
                        <span className="text-[10px] text-[#6a6a8a] ml-4">{subItem.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div
      ref={menuRef}
      className="flex items-center h-7 bg-[#0f0f25] border-b border-[#2a2a4a] shrink-0"
    >
      {MENUS.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
            className={`px-3 h-full text-xs transition-colors ${
              activeMenu === menu.label
                ? 'bg-[#1a1a35] text-white'
                : 'text-[#8a8aaa] hover:text-white hover:bg-[#1a1a35]/50'
            }`}
          >
            {menu.label}
          </button>
          {activeMenu === menu.label && (
            <MenuDropdown menu={menu} onClose={() => setActiveMenu(null)} />
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />
    </div>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="px-2 h-full text-xs text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]/50 transition-colors flex items-center gap-1"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
    >
      <span>{isDark ? '☀' : '🌙'}</span>
      <span className="text-[10px]">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
