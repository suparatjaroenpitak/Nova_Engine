import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ContextMenu } from '@/components/shared/ContextMenu';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUiStore } from '@/stores/uiStore';

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectProject, scenes } = useProjectStore();
  const { loadAssets } = useAssetStore();
  const panels = useUiStore((s) => s.panels);
  const showCommandPalette = useUiStore((s) => s.showCommandPalette);

  useKeyboardShortcuts();

  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
      loadAssets(projectId);
    }
  }, [projectId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-nova-bg overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {panels.hierarchy.visible && (
            <div className="w-[280px] min-w-[200px] flex flex-col bg-nova-surface border-r border-nova-border resize-x overflow-hidden">
              <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
                <span className="text-xs font-medium text-nova-muted uppercase">Hierarchy</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <Hierarchy />
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <SceneView />
            </div>
            {panels.assets.visible && (
              <div className="h-[200px] min-h-[100px] flex flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
                <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
                  <span className="text-xs font-medium text-nova-muted uppercase">Assets</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Assets />
                </div>
              </div>
            )}
            {panels.console.visible && (
              <div className="h-[150px] min-h-[80px] flex flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
                <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
                  <span className="text-xs font-medium text-nova-muted uppercase">Console</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Console />
                </div>
              </div>
            )}
          </div>

          {panels.inspector.visible && (
            <div className="w-[320px] min-w-[240px] flex flex-col bg-nova-surface border-l border-nova-border resize-x overflow-hidden">
              <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
                <span className="text-xs font-medium text-nova-muted uppercase">Inspector</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <Inspector />
              </div>
            </div>
          )}
        </div>

        {panels.animation.visible && (
          <div className="h-[200px] min-h-[100px] flex flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
            <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
              <span className="text-xs font-medium text-nova-muted uppercase">Animation</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <AnimationPanel />
            </div>
          </div>
        )}

        {panels.timeline.visible && (
          <div className="h-[150px] min-h-[80px] flex flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
            <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
              <span className="text-xs font-medium text-nova-muted uppercase">Timeline</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <TimelinePanel />
            </div>
          </div>
        )}

        {panels.profiler.visible && (
          <div className="h-[200px] min-h-[100px] flex flex-col bg-nova-surface border-t border-nova-border resize-y overflow-hidden">
            <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border">
              <span className="text-xs font-medium text-nova-muted uppercase">Profiler</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Profiler />
            </div>
          </div>
        )}
      </div>
      <StatusBar />
      {showCommandPalette && <CommandPalette />}
      <ContextMenu />
    </div>
  );
}
