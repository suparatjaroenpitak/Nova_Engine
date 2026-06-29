import { useRef, useCallback, useState, useMemo } from 'react';
import { useAssetStore } from '@/stores/assetStore';
import { useProjectStore } from '@/stores/projectStore';
import type { AssetDto } from '@/types';

function FolderTree({
  folders,
  currentPath,
  onSelect,
}: {
  folders: string[];
  currentPath: string;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    for (const f of folders) {
      const parts = f.replace(/^\/+/, '').split('/').filter(Boolean);
      let node = root;
      for (const p of parts) {
        if (!node[p]) node[p] = {};
        node = node[p];
      }
    }
    return root;
  }, [folders]);

  const renderTree = (node: Record<string, any>, prefix: string) =>
    Object.entries(node).map(([name, children]) => {
      const fullPath = `${prefix}/${name}`;
      const hasChildren = Object.keys(children).length > 0;
      const isActive = currentPath === fullPath;
      return (
        <div key={fullPath}>
          <button
            onClick={() => onSelect(fullPath)}
            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-1.5 ${
              isActive ? 'bg-nova-accent/20 text-nova-accent' : 'text-nova-text hover:bg-nova-hover'
            }`}
          >
            <span>{isActive ? '📂' : '📁'}</span>
            <span className="truncate">{name}</span>
          </button>
          {hasChildren && (
            <div className="ml-3">
              {renderTree(children, fullPath)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="border-r border-nova-border overflow-y-auto shrink-0 w-44">
      <button
        onClick={() => onSelect('/')}
        className={`w-full text-left px-3 py-1.5 rounded-none text-xs font-medium flex items-center gap-1.5 ${
          currentPath === '/' ? 'bg-nova-accent/20 text-nova-accent' : 'text-nova-text hover:bg-nova-hover'
        }`}
      >
        📦 All Assets
      </button>
      <div className="px-2 pb-2">{renderTree(tree, '')}</div>
    </div>
  );
}

function AssetIcon({ kind }: { kind: string }) {
  const icons: Record<string, string> = {
    Texture2D: '🖼', Texture3D: '🧊', Cubemap: '🔮',
    Material: '🎨', Shader: '💻', Model: '📦', Mesh: '◇',
    AnimationClip: '🎬', AnimatorController: '🎭',
    Audio: '🎵', Prefab: '🧩', Scene: '🎬', Script: '📄',
    Font: '🔤', Json: '📋', Csv: '📊', Tilemap: '🗺',
    Terrain: '⛰', Package: '📦',
  };
  return <span>{icons[kind] || '📄'}</span>;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetGridItem({
  asset,
  selected,
  onSelect,
  onContextMenu,
}: {
  asset: AssetDto;
  selected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/nova-asset', JSON.stringify({ id: asset.id, kind: asset.kind, name: asset.name }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`p-2 rounded-lg cursor-pointer border transition-all ${
        selected
          ? 'border-nova-accent bg-nova-accent/10 shadow-sm shadow-nova-accent/20'
          : 'border-nova-border hover:border-nova-accent/50 hover:bg-nova-hover/50'
      }`}
    >
      <div className="w-full aspect-square bg-nova-bg rounded-lg flex items-center justify-center mb-1.5 text-2xl">
        <AssetIcon kind={asset.kind} />
      </div>
      <div className="text-xs text-nova-text truncate font-medium">{asset.name}</div>
      <div className="text-[10px] text-nova-muted">{formatSize(asset.sizeBytes)}</div>
    </div>
  );
}

function AssetListItem({
  asset,
  selected,
  onSelect,
  onContextMenu,
}: {
  asset: AssetDto;
  selected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/nova-asset', JSON.stringify({ id: asset.id, kind: asset.kind, name: asset.name }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded text-xs transition-colors ${
        selected ? 'bg-nova-accent/20 text-nova-accent' : 'text-nova-text hover:bg-nova-hover'
      }`}
    >
      <AssetIcon kind={asset.kind} />
      <span className="flex-1 truncate">{asset.name}</span>
      <span className="text-nova-muted w-16 text-right">{formatSize(asset.sizeBytes)}</span>
      <span className="text-nova-muted w-20 text-right">{new Date(asset.createdAtUtc).toLocaleDateString()}</span>
    </div>
  );
}

export default function Assets() {
  const { assets, selectedAsset, selectAsset, uploadAsset, deleteAsset } = useAssetStore();
  const { currentProject } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: AssetDto } | null>(null);

  const folders = useMemo(() => {
    const set = new Set<string>(['/']);
    for (const a of assets) {
      const parts = a.path.replace(/^\/+/, '').split('/');
      let path = '';
      for (const p of parts.slice(0, -1)) {
        path += '/' + p;
        set.add(path);
      }
    }
    return [...set].sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    let list = assets;
    if (currentFolder !== '/') {
      list = list.filter((a) => a.path.startsWith(currentFolder + '/') || a.path === currentFolder);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.kind.toLowerCase().includes(q));
    }
    return list;
  }, [assets, currentFolder, searchQuery]);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const path = currentFolder === '/' ? `/Assets/${file.name}` : `${currentFolder}/${file.name}`;
      await uploadAsset(currentProject.id, file.name, path, file);
    }
  }, [currentProject, currentFolder]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !e.target.files) return;
    for (const file of Array.from(e.target.files)) {
      const path = currentFolder === '/' ? `/Assets/${file.name}` : `${currentFolder}/${file.name}`;
      await uploadAsset(currentProject.id, file.name, path, file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, asset: AssetDto) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, asset });
  };

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      onClick={() => setContextMenu(null)}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-nova-border shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-0.5 text-xs bg-nova-hover hover:bg-nova-active text-nova-text rounded"
        >
          Import
        </button>
        <div className="flex-1 min-w-0 max-w-[200px]">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full px-2 py-0.5 text-xs bg-nova-bg border border-nova-border rounded text-nova-text placeholder-nova-muted/50"
          />
        </div>
        <div className="flex gap-0.5 border border-nova-border rounded">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-1.5 py-0.5 text-xs ${viewMode === 'grid' ? 'bg-nova-active text-white' : 'text-nova-muted hover:text-nova-text'}`}
            title="Grid view"
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-1.5 py-0.5 text-xs ${viewMode === 'list' ? 'bg-nova-active text-white' : 'text-nova-muted hover:text-nova-text'}`}
            title="List view"
          >
            ☰
          </button>
        </div>
        <button className="px-2 py-0.5 text-xs text-nova-muted hover:text-nova-text">Create</button>
        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <FolderTree folders={folders} currentPath={currentFolder} onSelect={setCurrentFolder} />

        <div className="flex-1 overflow-y-auto p-2">
          {/* Breadcrumb */}
          <div className="text-xs text-nova-muted mb-2 px-1 flex items-center gap-1">
            <button onClick={() => setCurrentFolder('/')} className="hover:text-nova-text">Assets</button>
            {currentFolder !== '/' && currentFolder.split('/').filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <span>/</span>
                <button
                  onClick={() => setCurrentFolder('/' + arr.slice(0, i + 1).join('/'))}
                  className="hover:text-nova-text"
                >
                  {part}
                </button>
              </span>
            ))}
            <span className="flex-1 text-right text-nova-muted/50">{filteredAssets.length} items</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {filteredAssets.map((asset) => (
                <AssetGridItem
                  key={asset.id}
                  asset={asset}
                  selected={selectedAsset?.id === asset.id}
                  onSelect={() => selectAsset(asset)}
                  onContextMenu={(e) => handleContextMenu(e, asset)}
                />
              ))}
            </div>
          ) : (
            <div>
              {filteredAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  selected={selectedAsset?.id === asset.id}
                  onSelect={() => selectAsset(asset)}
                  onContextMenu={(e) => handleContextMenu(e, asset)}
                />
              ))}
            </div>
          )}

          {filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-nova-muted text-xs mt-8">
              <p className="mb-1 text-lg opacity-30">📂</p>
              <p className="mb-1">{searchQuery ? 'No assets match your search' : 'This folder is empty'}</p>
              <p>Drop files here or use the Import button</p>
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-36 glass border border-nova-border rounded-lg p-1 shadow-2xl animate-scale-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: 'Delete', action: () => { deleteAsset(contextMenu.asset.id); setContextMenu(null); }, danger: true },
            { label: 'Copy Path', action: () => { navigator.clipboard.writeText(contextMenu.asset.path); setContextMenu(null); } },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full text-left px-2 py-1.5 rounded text-xs ${item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-nova-text hover:bg-nova-hover'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
