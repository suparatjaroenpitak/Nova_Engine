import { useEffect, useState } from 'react';
import { useSceneStore } from '@/stores/sceneStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUiStore } from '@/stores/uiStore';
import { scenesApi } from '@/api/scenes';
import type { GameObjectDto } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

function HierarchyItem({ item, depth }: { item: GameObjectDto; depth: number }) {
  const { selectedIds, selectGameObject, addSelection } = useSceneStore();
  const showContextMenuAt = useUiStore((s) => s.showContextMenuAt);
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedIds.includes(item.id);
  const hasChildren = item.children && item.children.length > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenuAt(e.clientX, e.clientY, [
      { label: 'Copy', action: 'copy' },
      { label: 'Duplicate', action: 'duplicate' },
      { label: 'Delete', action: 'delete' },
    ]);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) addSelection(item.id);
    else selectGameObject(item.id);
  };

  return (
    <div>
      <div
        className={`flex items-center h-7 px-2 cursor-pointer text-sm select-none ${
          isSelected ? 'bg-nova-accent/30 text-white' : 'text-nova-text hover:bg-nova-hover'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center text-xs text-nova-muted mr-1"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="w-4 mr-1" />}
        <span className={`w-3 h-3 rounded-sm mr-2 ${item.isActive ? 'bg-nova-accent' : 'bg-nova-muted'}`} />
        <span>{item.name}</span>
        <span className="ml-2 text-xs text-nova-muted opacity-50">{item.components?.length ?? 0}</span>
      </div>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {item.children
              .sort((a, b) => a.siblingIndex - b.siblingIndex)
              .map((child) => (
                <HierarchyItem key={child.id} item={child} depth={depth + 1} />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Hierarchy() {
  const { gameObjects, setGameObjects } = useSceneStore();
  const { currentScene } = useProjectStore();
  const showContextMenuAt = useUiStore((s) => s.showContextMenuAt);
  const createGameObject = useSceneStore((s) => s.createGameObject);

  useEffect(() => {
    if (currentScene) {
      scenesApi.getGameObjects(currentScene.id).then(({ data }) => {
        setGameObjects(data);
      });
    }
  }, [currentScene]);

  const handleCreateEmpty = async () => {
    if (currentScene) {
      await createGameObject(currentScene.id, 'GameObject');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenuAt(e.clientX, e.clientY, [
      { label: 'Create Empty', action: 'create-empty' },
      { label: 'Create Cube', action: 'create-cube' },
      { label: 'Create Camera', action: 'create-camera' },
      { label: 'Create Light', action: 'create-light' },
    ]);
  };

  return (
    <div className="h-full overflow-y-auto" onContextMenu={handleContextMenu}>
      <div className="p-2">
        <button
          onClick={handleCreateEmpty}
          className="w-full px-3 py-1.5 text-xs bg-nova-hover hover:bg-nova-active text-nova-text rounded transition-colors mb-2"
        >
          + Create
        </button>
      </div>
      {gameObjects
        .filter((g) => !g.parentId)
        .sort((a, b) => a.siblingIndex - b.siblingIndex)
        .map((item) => (
          <HierarchyItem key={item.id} item={item} depth={0} />
        ))}
      {gameObjects.length === 0 && (
        <div className="px-4 py-8 text-nova-muted text-xs text-center">Hierarchy is empty</div>
      )}
    </div>
  );
}
