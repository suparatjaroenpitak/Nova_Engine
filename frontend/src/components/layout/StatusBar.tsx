import { useProjectStore } from '@/stores/projectStore';
import { useSceneStore } from '@/stores/sceneStore';
export default function StatusBar() {
  const { currentProject, currentScene } = useProjectStore();
  const { selectedIds } = useSceneStore();

  return (
    <div className="h-6 bg-nova-surface2 border-t border-nova-border flex items-center px-3 text-xs text-nova-muted gap-3 overflow-x-auto">
      <span className="text-nova-accent font-medium whitespace-nowrap">{currentProject?.name ?? 'No project'}</span>
      <span className="w-px h-3 bg-nova-border shrink-0" />
      <span className="whitespace-nowrap">{currentScene?.name ?? 'No scene'}</span>
      <span className="w-px h-3 bg-nova-border shrink-0" />
      <span className="whitespace-nowrap">{currentProject?.is3D ? '3D' : '2D'}</span>
      <span className="w-px h-3 bg-nova-border shrink-0" />
      <span className="whitespace-nowrap">{currentProject?.renderPipeline ?? 'URP'}</span>
      <div className="flex-1 min-w-4" />
      {selectedIds.length > 0 && (
        <span className="whitespace-nowrap">{selectedIds.length} selected</span>
      )}
      <span className="text-nova-muted/50 whitespace-nowrap">Nova Engine 1.0</span>
    </div>
  );
}
