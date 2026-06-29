import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { useAssetStore } from '@/stores/assetStore';
import EditorShell from '@/components/layout/EditorShell';
import Toolbar from '@/components/layout/Toolbar';
import StatusBar from '@/components/layout/StatusBar';
import Hierarchy from '@/components/panels/Hierarchy';
import Inspector from '@/components/panels/Inspector';
import SceneView from '@/components/panels/SceneView';
import GameView from '@/components/windows/GameView';
import Assets from '@/components/panels/Assets';
import Console from '@/components/panels/Console';
import Profiler from '@/components/panels/Profiler';
import AnimationPanel from '@/components/panels/Animation';
import TimelinePanel from '@/components/panels/Timeline';
import ScriptEditor from '@/components/panels/ScriptEditor';
import ShaderEditor from '@/components/panels/ShaderEditor';
import MaterialEditor from '@/components/panels/MaterialEditor';
import TerrainEditor from '@/components/panels/TerrainEditor';
import AIAssistant from '@/components/panels/AIAssistant';
import Lighting from '@/components/panels/Lighting';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ContextMenu } from '@/components/shared/ContextMenu';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUiStore } from '@/stores/uiStore';

function PanelHeader({ title, onToggle }: { title: string; onToggle?: () => void }) {
  return (
    <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border shrink-0">
      <span className="text-xs font-medium text-nova-muted uppercase tracking-wider">{title}</span>
      <div className="flex-1" />
      {onToggle && (
        <button onClick={onToggle} className="text-nova-muted hover:text-nova-text text-xs px-1">&times;</button>
      )}
    </div>
  );
}

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { selectProject, scenes, currentProject } = useProjectStore();
  const { loadAssets } = useAssetStore();
  const panels = useUiStore((s) => s.panels);
  const showCommandPalette = useUiStore((s) => s.showCommandPalette);
  const togglePanel = useUiStore((s) => s.togglePanel);
  const [mobilePanel, setMobilePanel] = useState<string | null>(null);

  useKeyboardShortcuts();

  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
      loadAssets(projectId);
    }
  }, [projectId]);

  if (!currentProject) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-nova-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-nova-accent/30 border-t-nova-accent rounded-full animate-spin" />
          <span className="text-sm text-nova-muted">Loading project...</span>
        </div>
      </div>
    );
  }

  const leftPanel = panels.hierarchy.visible;
  const rightPanel = panels.inspector.visible;

  return (
    <EditorShell>
      <div className="h-screen w-screen flex flex-col bg-nova-bg overflow-hidden">
        <Toolbar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left panel */}
            {leftPanel && (
              <div className="hidden md:flex w-[260px] lg:w-[280px] min-w-[180px] flex-col bg-nova-surface border-r border-nova-border resize-x overflow-hidden">
                <PanelHeader title="Hierarchy" />
                <div className="flex-1 overflow-hidden">
                  <Hierarchy />
                </div>
              </div>
            )}

            {/* Center - Scene View */}
            <div className="flex-1 flex flex-col overflow-hidden relative scene-grid-bg">
              <div className="flex-1 overflow-hidden relative">
                <SceneView />
                {/* Mobile panel buttons */}
                <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  <button
                    onClick={() => setMobilePanel(mobilePanel === 'hierarchy' ? null : 'hierarchy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
                      mobilePanel === 'hierarchy' ? 'bg-nova-accent text-white' : 'bg-nova-surface/80 border border-nova-border text-nova-muted'
                    }`}
                  >
                    Hierarchy
                  </button>
                  <button
                    onClick={() => setMobilePanel(mobilePanel === 'inspector' ? null : 'inspector')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
                      mobilePanel === 'inspector' ? 'bg-nova-accent text-white' : 'bg-nova-surface/80 border border-nova-border text-nova-muted'
                    }`}
                  >
                    Inspector
                  </button>
                  <button
                    onClick={() => setMobilePanel(mobilePanel === 'assets' ? null : 'assets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all ${
                      mobilePanel === 'assets' ? 'bg-nova-accent text-white' : 'bg-nova-surface/80 border border-nova-border text-nova-muted'
                    }`}
                  >
                    Assets
                  </button>
                </div>
              </div>

              {/* Bottom panels */}
              {panels.assets.visible && (
                <div className="hidden md:flex h-[180px] lg:h-[200px] min-h-[80px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
                  <PanelHeader title="Assets" onToggle={() => togglePanel('assets')} />
                  <div className="flex-1 overflow-hidden">
                    <Assets />
                  </div>
                </div>
              )}
              {panels.console.visible && !panels.assets.visible && (
                <div className="hidden md:flex h-[130px] lg:h-[150px] min-h-[60px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
                  <PanelHeader title="Console" onToggle={() => togglePanel('console')} />
                  <div className="flex-1 overflow-hidden">
                    <Console />
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            {rightPanel && (
              <div className="hidden md:flex w-[280px] lg:w-[320px] min-w-[200px] flex-col bg-nova-surface border-l border-nova-border resize-x overflow-hidden">
                <PanelHeader title="Inspector" />
                <div className="flex-1 overflow-hidden">
                  <Inspector />
                </div>
              </div>
            )}
          </div>

          {/* Bottom panels (full width) */}
          {panels.animation.visible && (
            <div className="hidden md:flex h-[180px] lg:h-[200px] min-h-[80px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
              <PanelHeader title="Animation" onToggle={() => togglePanel('animation')} />
              <div className="flex-1 overflow-hidden">
                <AnimationPanel />
              </div>
            </div>
          )}
          {panels.timeline.visible && !panels.animation.visible && (
            <div className="hidden md:flex h-[130px] lg:h-[150px] min-h-[60px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
              <PanelHeader title="Timeline" onToggle={() => togglePanel('timeline')} />
              <div className="flex-1 overflow-hidden">
                <TimelinePanel />
              </div>
            </div>
          )}
          {panels.profiler.visible && !panels.animation.visible && !panels.timeline.visible && !panels.ai.visible && !panels.lighting.visible && (
            <div className="hidden md:flex h-[180px] lg:h-[200px] min-h-[80px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
              <PanelHeader title="Profiler" onToggle={() => togglePanel('profiler')} />
              <div className="flex-1 overflow-hidden">
                <Profiler />
              </div>
            </div>
          )}
          {panels.ai.visible && (
            <div className="hidden md:flex h-[220px] lg:h-[260px] min-h-[120px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
              <PanelHeader title="AI Assistant" onToggle={() => togglePanel('ai')} />
              <div className="flex-1 overflow-hidden">
                <AIAssistant />
              </div>
            </div>
          )}
          {panels.lighting.visible && !panels.ai.visible && (
            <div className="hidden md:flex h-[220px] lg:h-[260px] min-h-[120px] flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
              <PanelHeader title="Lighting" onToggle={() => togglePanel('lighting')} />
              <div className="flex-1 overflow-hidden">
                <Lighting />
              </div>
            </div>
          )}
        </div>

        <StatusBar />
        {showCommandPalette && <CommandPalette />}
        <ContextMenu />

        {/* Mobile panel overlays */}
        {mobilePanel && (
          <div className="md:hidden fixed inset-0 z-50 animate-fade-in" onClick={() => setMobilePanel(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm glass border-r border-nova-border animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center h-9 px-3 bg-nova-surface2 border-b border-nova-border">
                <span className="text-sm font-medium text-nova-text capitalize">{mobilePanel}</span>
                <div className="flex-1" />
                <button onClick={() => setMobilePanel(null)} className="text-nova-muted hover:text-nova-text">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto h-[calc(100%-36px)]">
                {mobilePanel === 'hierarchy' && <Hierarchy />}
                {mobilePanel === 'inspector' && <Inspector />}
                {mobilePanel === 'assets' && <Assets />}
              </div>
            </div>
          </div>
        )}
      </div>
    </EditorShell>
  );
}
