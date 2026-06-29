import { useProjectStore } from '@/stores/projectStore';
import { useSceneStore } from '@/stores/sceneStore';

export default function StatusBar() {
  const { currentProject, currentScene } = useProjectStore();
  const { selectedIds } = useSceneStore();

  return (
    <div className="h-6 bg-nova-surface2 border-t border-nova-border flex items-center px-3 text-xs text-nova-muted gap-4">
      <span>{currentProject?.name ?? 'No project'}</span>
      <span className="w-px h-3 bg-nova-border" />
      <span>{currentScene?.name ?? 'No scene'}</span>
      <span className="w-px h-3 bg-nova-border" />
      <span>{currentProject?.is3D ? '3D' : '2D'}</span>
      <span className="w-px h-3 bg-nova-border" />
      <span>{currentProject?.renderPipeline ?? 'URP'}</span>
      <div className="flex-1" />
      {selectedIds.length > 0 && <span>{selectedIds.length} selected</span>}
      <span>Nova Engine 1.0</span>
    </div>
  );
}
