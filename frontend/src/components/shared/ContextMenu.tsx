import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

export function ContextMenu() {
  const { showContextMenu, contextMenuPosition, contextMenuItems, hideContextMenu } = useUiStore();
  const { deleteGameObject, duplicateGameObject, copyGameObject, selectedGameObject } = useSceneStore();

  if (!showContextMenu) return null;

  const handleAction = (action: string) => {
    switch (action) {
      case 'delete':
        if (selectedGameObject) deleteGameObject(selectedGameObject.id);
        break;
      case 'duplicate':
        if (selectedGameObject) duplicateGameObject(selectedGameObject.id);
        break;
      case 'copy':
        copyGameObject();
        break;
    }
    hideContextMenu();
  };

  return (
    <div
      className="fixed z-50 bg-nova-surface border border-nova-border rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenuItems.map((item, i) => (
        <button
          key={i}
          onClick={() => handleAction(item.action)}
          className="w-full px-3 py-1.5 text-left text-sm text-nova-text hover:bg-nova-hover transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
