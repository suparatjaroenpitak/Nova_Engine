import { useRef, useCallback } from 'react';
import { useAssetStore } from '@/stores/assetStore';
import { useProjectStore } from '@/stores/projectStore';

export default function Assets() {
  const { assets, selectedAsset, selectAsset, uploadAsset, deleteAsset } = useAssetStore();
  const { currentProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await uploadAsset(currentProject.id, file.name, `/Assets/${file.name}`, file);
    }
  }, [currentProject]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !e.target.files) return;
    for (const file of Array.from(e.target.files)) {
      await uploadAsset(currentProject.id, file.name, `/Assets/${file.name}`, file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-nova-border">
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-0.5 text-xs bg-nova-hover hover:bg-nova-active text-nova-text rounded"
          >
            Import
          </button>
          <button className="px-2 py-0.5 text-xs text-nova-muted hover:text-nova-text">Create</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => selectAsset(asset)}
              className={`p-2 rounded cursor-pointer border ${
                selectedAsset?.id === asset.id ? 'border-nova-accent bg-nova-accent/10' : 'border-nova-border hover:border-nova-accent/50'
              }`}
            >
              <div className="w-full aspect-square bg-nova-bg rounded flex items-center justify-center mb-1 text-2xl">
                {asset.kind === 'Texture2D' ? '🖼' :
                 asset.kind === 'Model' ? '📦' :
                 asset.kind === 'Audio' ? '🎵' :
                 asset.kind === 'Script' ? '📄' :
                 asset.kind === 'Material' ? '🎨' :
                 asset.kind === 'Prefab' ? '🧩' : '📁'}
              </div>
              <div className="text-xs text-nova-text truncate">{asset.name}</div>
              <div className="text-xs text-nova-muted">{formatSize(asset.sizeBytes)}</div>
            </div>
          ))}
        </div>
        {assets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-nova-muted text-xs">
            <p className="mb-1">Drop files here to import</p>
            <p>or use the Import button</p>
          </div>
        )}
      </div>
    </div>
  );
}
