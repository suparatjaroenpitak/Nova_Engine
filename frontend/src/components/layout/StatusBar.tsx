import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';

export default function StatusBar() {
  const { currentProject } = useProjectStore();
  const { gameObjects, selectedGameObject } = useSceneStore();
  const { isPlaying } = useUiStore();
  const [showFPS, setShowFPS] = useState(false);

  const objectCount = countAllObjects(gameObjects);
  const selectedCount = selectedGameObject ? 1 : 0;

  return (
    <div className="flex items-center h-6 px-2 bg-[#0f0f25] border-t border-[#2a2a4a] shrink-0 text-[10px]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-[#6a6a8a] font-medium">
          {currentProject?.name || 'No Project'}
        </span>
        <span className="text-[#3a3a5a]">|</span>
        <span className="text-[#6a6a8a]">
          {isPlaying ? (
            <span className="text-green-400">▶ Playing</span>
          ) : (
            'Edit Mode'
          )}
        </span>
      </div>

      <div className="flex-1" />

      {/* Center */}
      <div className="flex items-center gap-3 text-[#6a6a8a]">
        <span>Objects: {objectCount}</span>
        {selectedCount > 0 && <span>Selected: {selectedCount}</span>}
      </div>

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="text-[#6a6a8a]">
          {currentProject?.renderPipeline || 'URP'}
        </span>
        <span className="text-[#3a3a5a]">|</span>
        <span className="text-[#6a6a8a]">
          {isPlaying ? '60 FPS' : '—'}
        </span>
        <span className="text-[#3a3a5a]">|</span>
        <span className="text-[#6a6a8a]">
          {currentProject?.is3D ? '3D' : '2D'}
        </span>
        <span className="text-[#3a3a5a]">|</span>
        <span className="text-[#6a6a8a] cursor-pointer hover:text-white" onClick={() => setShowFPS(!showFPS)}>
          {isPlaying ? '⏱ 60' : '◻'}
        </span>
      </div>
    </div>
  );
}

function countAllObjects(objects: any[]): number {
  let count = 0;
  for (const obj of objects) {
    count++;
    if (obj.children) count += countAllObjects(obj.children);
  }
  return count;
}
