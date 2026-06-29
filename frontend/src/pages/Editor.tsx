import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAssetStore } from '@/stores/assetStore';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';
import type { PanelId } from '@/types';
import MenuBar from '@/components/layout/MenuBar';
import Toolbar from '@/components/layout/Toolbar';
import StatusBar from '@/components/layout/StatusBar';
import { DockPanel, DockTabBar } from '@/components/layout/DockPanel';
import Hierarchy from '@/components/panels/Hierarchy';
import Inspector from '@/components/panels/Inspector';
import SceneView from '@/components/panels/SceneView';
import GameView from '@/components/windows/GameView';
import Assets from '@/components/panels/Assets';
import Console from '@/components/panels/Console';
import Profiler from '@/components/panels/Profiler';
import AnimationPanel from '@/components/panels/Animation';
import TimelinePanel from '@/components/panels/Timeline';
import MaterialEditor from '@/components/panels/MaterialEditor';
import ShaderEditor from '@/components/panels/ShaderEditor';
import TerrainEditor from '@/components/panels/TerrainEditor';
import ShaderGraph from '@/components/panels/ShaderGraph';
import AIAssistant from '@/components/panels/AIAssistant';
import Lighting from '@/components/panels/Lighting';
import BuildSettings from '@/components/panels/BuildSettings';
import VersionControl from '@/components/panels/VersionControl';
import Terminal from '@/components/panels/Terminal';
import Navigation from '@/components/panels/Navigation';
import PhysicsDebugger from '@/components/panels/PhysicsDebugger';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ContextMenu } from '@/components/shared/ContextMenu';
import { useKeyboardShortcuts, globalShortcuts } from '@/hooks/useKeyboardShortcuts';
import ScriptEditor from '@/components/panels/ScriptEditor';
import PackageManager from '@/components/windows/PackageManager';
import SearchEverywhere from '@/components/panels/SearchEverywhere';

type PanelEntry = {
  id: string;
  component: React.ReactNode;
  title: string;
  icon?: string;
};

const ALL_PANELS: Record<string, PanelEntry> = {
  hierarchy: { id: 'hierarchy', component: <Hierarchy />, title: 'Hierarchy', icon: '⊞' },
  inspector: { id: 'inspector', component: <Inspector />, title: 'Inspector', icon: '☰' },
  scene: { id: 'scene', component: <SceneView />, title: 'Scene', icon: '◈' },
  game: { id: 'game', component: <GameView />, title: 'Game', icon: '▶' },
  assets: { id: 'assets', component: <Assets />, title: 'Project', icon: '📁' },
  console: { id: 'console', component: <Console />, title: 'Console', icon: '⌨' },
  profiler: { id: 'profiler', component: <Profiler />, title: 'Profiler', icon: '📊' },
  animation: { id: 'animation', component: <AnimationPanel />, title: 'Animation', icon: '▶' },
  timeline: { id: 'timeline', component: <TimelinePanel />, title: 'Timeline', icon: '⏱' },
  ai: { id: 'ai', component: <AIAssistant />, title: 'AI Assistant', icon: '🤖' },
  lighting: { id: 'lighting', component: <Lighting />, title: 'Lighting', icon: '☀' },
  materialEditor: { id: 'materialEditor', component: <MaterialEditor />, title: 'Material Editor', icon: '🎨' },
  shader: { id: 'shader', component: <ShaderEditor />, title: 'Shader Editor', icon: '💻' },
  shaderGraph: { id: 'shaderGraph', component: <ShaderGraph />, title: 'Shader Graph', icon: '🔗' },
  terrain: { id: 'terrain', component: <TerrainEditor />, title: 'Terrain', icon: '⛰' },
  script: { id: 'script', component: <ScriptEditor />, title: 'Script', icon: '📄' },
  build: { id: 'build', component: <BuildSettings />, title: 'Build Settings', icon: '🔨' },
  versionControl: { id: 'versionControl', component: <VersionControl />, title: 'Version Control', icon: '⎇' },
  terminal: { id: 'terminal', component: <Terminal />, title: 'Terminal', icon: '⬛' },
  navigationWindow: { id: 'navigationWindow', component: <Navigation />, title: 'Navigation', icon: '🗺' },
  physicsDebugger: { id: 'physicsDebugger', component: <PhysicsDebugger />, title: 'Physics Debugger', icon: '⚙' },
  packageManager: { id: 'packageManager', component: <PackageManager />, title: 'Package Manager', icon: '📦' },
  searchEverywhere: { id: 'searchEverywhere', component: <SearchEverywhere />, title: 'Search Everywhere', icon: '🔍' },
};

const PANEL_ORDER = [
  'hierarchy', 'scene', 'inspector', 'game', 'assets', 'console',
  'profiler', 'animation', 'timeline', 'ai', 'lighting', 'materialEditor',
  'shader', 'shaderGraph', 'terrain', 'script', 'build', 'versionControl', 'terminal',
  'navigationWindow', 'physicsDebugger', 'packageManager', 'searchEverywhere',
];

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectProject, scenes, currentProject } = useProjectStore();
  const { loadAssets } = useAssetStore();
  const currentScene = useProjectStore((s) => s.currentScene);
  const panels = useUiStore((s) => s.panels);
  const showCommandPalette = useUiStore((s) => s.showCommandPalette);
  const showContextMenu = useUiStore((s) => s.showContextMenu);
  const contextMenuPosition = useUiStore((s) => s.contextMenuPosition);
  const contextMenuItems = useUiStore((s) => s.contextMenuItems);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const [mobilePanel, setMobilePanel] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(200);
  const [showAllPanels, setShowAllPanels] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
      loadAssets(projectId);
    }
  }, [projectId]);

  if (!currentProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e94560]/30 border-t-[#e94560] rounded-full animate-spin" />
          <span className="text-sm text-[#6a6a8a]">Loading project...</span>
        </div>
      </div>
    );
  }

  const visiblePanels = PANEL_ORDER.filter((id) => panels[id as PanelId]?.visible);

  const renderPanel = (id: string, customTitle?: string) => {
    const panel = ALL_PANELS[id];
    if (!panel) return null;

    const panelState = panels[id as PanelId];
    const isVisible = panelState?.visible !== false;

    if (!isVisible) return null;

    return (
      <DockPanel
        key={id}
        panelId={id as any}
        title={customTitle || panel.title}
        icon={panel.icon}
        onClose={() => togglePanel(id as any)}
      >
        {panel.component}
      </DockPanel>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a1a] overflow-hidden">
      {/* Menu Bar */}
      <MenuBar />

      {/* Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANELS: Hierarchy */}
          {panels.hierarchy?.visible && (
            <div
              className="hidden md:flex flex-col bg-[#12122a] border-r border-[#2a2a4a] overflow-hidden shrink-0"
              style={{ width: leftWidth }}
            >
              <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
                <span className="text-xs font-medium text-[#e8e8f0] uppercase tracking-wider">Hierarchy</span>
                <div className="flex-1" />
                <input
                  placeholder="Search..."
                  className="w-20 px-1.5 py-0.5 text-[10px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#6a6a8a]/50"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <Hierarchy />
              </div>
              {/* Resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#e94560]/50 transition-colors"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = leftWidth;
                  const handleMouseMove = (e: MouseEvent) => {
                    setLeftWidth(Math.max(150, Math.min(500, startWidth + e.clientX - startX)));
                  };
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            </div>
          )}

          {/* CENTER: Scene View + Bottom Panels */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Scene View / Game View tab */}
            <div className="flex-1 overflow-hidden relative">
              <DockPanel
                panelId="scene"
                title="Scene"
                icon="◈"
                onClose={() => togglePanel('scene')}
              >
                <SceneView />
              </DockPanel>

              {/* Panel quick-tabs */}
              <div className="absolute top-0 right-0 flex gap-0.5 z-10 p-1">
                {(['game', 'animation', 'timeline', 'materialEditor', 'terrain', 'shader'] as PanelId[]).filter((id) => !panels[id]?.visible).map((id) => {
                  const p = ALL_PANELS[id];
                  return (
                    <button
                      key={id}
                      onClick={() => togglePanel(id as any)}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-[#12122a]/80 border border-[#2a2a4a] text-[#6a6a8a] hover:text-white hover:border-[#e94560]/50 transition-all"
                      title={p?.title}
                    >
                      {p?.icon} {p?.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM PANELS: Assets / Console / etc with tabs */}
            {[
              { id: 'assets', title: 'Project' },
              { id: 'console', title: 'Console' },
              { id: 'profiler', title: 'Profiler' },
              { id: 'terminal', title: 'Terminal' },
              { id: 'ai', title: 'AI Assistant' },
              { id: 'lighting', title: 'Lighting' },
              { id: 'versionControl', title: 'Version Control' },
              ].filter(({ id }) => panels[id as PanelId]?.visible).length > 0 && (
              <div
                className="hidden md:flex flex-col bg-[#12122a] border-t border-[#2a2a4a] overflow-hidden shrink-0"
                style={{ height: bottomHeight }}
              >
                {/* Tab bar for bottom panels */}
                <div className="flex items-center h-7 bg-[#1a1a35] border-b border-[#2a2a4a] overflow-x-auto shrink-0">
                  {[
                    { id: 'assets', title: 'Project', icon: '📁' },
                    { id: 'console', title: 'Console', icon: '⌨' },
                    { id: 'profiler', title: 'Profiler', icon: '📊' },
                    { id: 'terminal', title: 'Terminal', icon: '⬛' },
                    { id: 'ai', title: 'AI Assistant', icon: '🤖' },
                    { id: 'lighting', title: 'Lighting', icon: '☀' },
                    { id: 'versionControl', title: 'Version Control', icon: '⎇' },
                  ].filter(({ id }) => panels[id as PanelId]?.visible).map(({ id, title, icon }) => {
                    const isActive = id === 'assets' || id === 'console' || id === 'terminal';
                    return (
                      <button
                        key={id}
                        className={`flex items-center gap-1 px-2 h-full text-[10px] whitespace-nowrap transition-colors border-r border-[#2a2a4a] ${
                          isActive ? 'bg-[#12122a] text-white' : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePanel(id as any); }}
                          className="ml-1 text-[8px] opacity-0 hover:opacity-100 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </button>
                    );
                  })}
                  <div className="flex-1" />
                  {/* Resize handle */}
                  <div
                    className="w-4 h-full cursor-row-resize flex items-center justify-center text-[8px] text-[#3a3a5a] hover:text-[#6a6a8a]"
                    onMouseDown={(e) => {
                      const startY = e.clientY;
                      const startHeight = bottomHeight;
                      const handleMouseMove = (e: MouseEvent) => {
                        setBottomHeight(Math.max(80, Math.min(600, startHeight - (e.clientY - startY))));
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    ⋮
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                  {panels.assets?.visible && <Assets />}
                  {!panels.assets?.visible && panels.console?.visible && <Console />}
                  {!panels.assets?.visible && !panels.console?.visible && panels.profiler?.visible && <Profiler />}
                  {!panels.assets?.visible && !panels.console?.visible && !panels.profiler?.visible && panels.terminal?.visible && <Terminal />}
                  {!panels.assets?.visible && !panels.console?.visible && !panels.profiler?.visible && !panels.terminal?.visible && panels.ai?.visible && <AIAssistant />}
                  {!panels.assets?.visible && !panels.console?.visible && !panels.profiler?.visible && !panels.terminal?.visible && !panels.ai?.visible && panels.lighting?.visible && <Lighting />}
                  {!panels.assets?.visible && !panels.console?.visible && !panels.profiler?.visible && !panels.terminal?.visible && !panels.ai?.visible && !panels.lighting?.visible && panels.versionControl?.visible && <VersionControl />}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Inspector */}
          {panels.inspector?.visible && (
            <div
              className="hidden md:flex flex-col bg-[#12122a] border-l border-[#2a2a4a] overflow-hidden shrink-0"
              style={{ width: rightWidth }}
            >
              {/* Resize handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#e94560]/50 transition-colors"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = rightWidth;
                  const handleMouseMove = (e: MouseEvent) => {
                    setRightWidth(Math.max(200, Math.min(600, startWidth - (e.clientX - startX))));
                  };
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
                <span className="text-xs font-medium text-[#e8e8f0] uppercase tracking-wider">Inspector</span>
                <div className="flex-1" />
                <button
                  onClick={() => togglePanel('inspector')}
                  className="text-[10px] text-[#6a6a8a] hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Inspector />
              </div>
            </div>
          )}
        </div>

        {/* Extra panels that appear at the bottom of the full layout */}
        <div className="hidden md:flex flex-col">
          {/* Animation/Timeline section */}
          {panels.animation?.visible && (
            <div className="h-[180px] min-h-[80px] bg-[#12122a] border-t border-[#2a2a4a] flex flex-col">
              <div className="flex items-center h-6 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
                <span className="text-[10px] font-medium text-[#e8e8f0]">Animation</span>
                <div className="flex-1" />
                <button onClick={() => togglePanel('animation')} className="text-[10px] text-[#6a6a8a] hover:text-white">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AnimationPanel />
              </div>
            </div>
          )}
          {!panels.animation?.visible && panels.timeline?.visible && (
            <div className="h-[180px] min-h-[80px] bg-[#12122a] border-t border-[#2a2a4a] flex flex-col">
              <div className="flex items-center h-6 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
                <span className="text-[10px] font-medium text-[#e8e8f0]">Timeline</span>
                <div className="flex-1" />
                <button onClick={() => togglePanel('timeline')} className="text-[10px] text-[#6a6a8a] hover:text-white">✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TimelinePanel />
              </div>
            </div>
          )}
        </div>

        {/* Floating panels for special editors */}
        <FloatingPanelOverlay />
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Global overlays */}
      {showCommandPalette && <CommandPalette />}
      {showContextMenu && <ContextMenu />}

      {/* Mobile panel overlays */}
      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobilePanel(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-[#12122a] border-r border-[#2a2a4a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center h-7 px-3 bg-[#1a1a35] border-b border-[#2a2a4a]">
              <span className="text-xs font-medium text-[#e8e8f0] uppercase">{mobilePanel}</span>
              <div className="flex-1" />
              <button onClick={() => setMobilePanel(null)} className="text-[#6a6a8a] hover:text-white">✕</button>
            </div>
            <div className="h-[calc(100%-36px)] overflow-y-auto">
              {mobilePanel === 'hierarchy' && <Hierarchy />}
              {mobilePanel === 'inspector' && <Inspector />}
              {mobilePanel === 'assets' && <Assets />}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut info */}
      <div className="hidden fixed bottom-0 right-0 m-2 z-40">
        <ShortcutHint />
      </div>
    </div>
  );
}

function FloatingPanelOverlay() {
  const panels = useUiStore((s) => s.panels);
  const togglePanel = useUiStore((s) => s.togglePanel);

  const floatingPanels = [
    { id: 'game', title: 'Game View', icon: '▶', component: <GameView /> },
    { id: 'build', title: 'Build Settings', icon: '🔨', component: <BuildSettings /> },
    { id: 'packageManager', title: 'Package Manager', icon: '📦', component: <PackageManager /> },
    { id: 'navigationWindow', title: 'Navigation', icon: '🗺', component: <Navigation /> },
    { id: 'physicsDebugger', title: 'Physics Debugger', icon: '⚙', component: <PhysicsDebugger /> },
  ];

  return (
    <>
      {floatingPanels.filter((p) => panels[p.id as PanelId]?.visible).map((p) => (
        <div
          key={p.id}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => togglePanel(p.id as any)}
        >
          <div
            className="w-[90vw] h-[85vh] max-w-6xl bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center h-8 px-3 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
              <span className="text-xs font-medium text-[#e8e8f0]">{p.icon} {p.title}</span>
              <div className="flex-1" />
              <button onClick={() => togglePanel(p.id as any)} className="text-xs text-[#6a6a8a] hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {p.component}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function ShortcutHint() {
  const [visible, setVisible] = useState(false);
  const shortcuts = globalShortcuts.getAllShortcuts().slice(0, 20);

  return (
    <div className="relative">
      <button
        onClick={() => setVisible(!visible)}
        className="text-[10px] text-[#3a3a5a] hover:text-[#6a6a8a] bg-[#12122a]/80 border border-[#2a2a4a] rounded px-2 py-1"
      >
        ⌨
      </button>
      {visible && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl p-2 max-h-80 overflow-y-auto">
          <div className="text-[10px] font-medium text-[#6a6a8a] mb-1">Keyboard Shortcuts</div>
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-0.5">
              <span className="text-[10px] text-[#e8e8f0]">{s.description}</span>
              <kbd className="text-[9px] text-[#6a6a8a] bg-[#0a0a1a] px-1 py-0.5 rounded border border-[#2a2a4a]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
