import { useState, useMemo } from 'react';
import type { VersionControlFile } from '@/types';

const MOCK_FILES: VersionControlFile[] = [
  { path: 'Assets/Scenes/MainScene.nova', status: 'modified', staged: false },
  { path: 'Assets/Scripts/Player.cs', status: 'modified', staged: true },
  { path: 'Assets/Scripts/Enemy.cs', status: 'added', staged: false },
  { path: 'Assets/Materials/Ground.mat', status: 'modified', staged: false },
  { path: 'Assets/Prefabs/Coin.prefab', status: 'added', staged: true },
  { path: 'Assets/Textures/ground.png', status: 'deleted', staged: false },
];

const STATUS_COLORS: Record<string, string> = {
  modified: '#ffaa00',
  added: '#44cc44',
  deleted: '#ff4444',
  untracked: '#888888',
  conflict: '#ff4444',
};

const STATUS_ICONS: Record<string, string> = {
  modified: '✏',
  added: '➕',
  deleted: '🗑',
  untracked: '?',
  conflict: '⚠',
};

export default function VersionControl() {
  const [files, setFiles] = useState(MOCK_FILES);
  const [commitMessage, setCommitMessage] = useState('');
  const [branch] = useState('main');
  const [viewMode, setViewMode] = useState<'all' | 'staged' | 'unstaged'>('all');

  const filteredFiles = useMemo(() => {
    switch (viewMode) {
      case 'staged': return files.filter((f) => f.staged);
      case 'unstaged': return files.filter((f) => !f.staged);
      default: return files;
    }
  }, [files, viewMode]);

  const toggleStaged = (path: string) => {
    setFiles((prev) => prev.map((f) => f.path === path ? { ...f, staged: !f.staged } : f));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center h-8 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-2 shrink-0">
        <span className="text-xs font-medium text-[#e8e8f0]">VC</span>
        <span className="text-[10px] text-[#6a6a8a] bg-[#12122a] px-1.5 py-0.5 rounded">{branch}</span>
        <div className="flex-1" />
        <div className="flex border border-[#2a2a4a] rounded text-[10px]">
          {(['all', 'staged', 'unstaged'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-1.5 py-0.5 ${viewMode === m ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.map((file) => (
          <div
            key={file.path}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1a1a35] cursor-pointer text-xs transition-colors"
          >
            <input
              type="checkbox"
              checked={file.staged}
              onChange={() => toggleStaged(file.path)}
              className="accent-[#e94560]"
            />
            <span style={{ color: STATUS_COLORS[file.status] }} title={file.status}>
              {STATUS_ICONS[file.status]}
            </span>
            <span className="flex-1 truncate text-[#e8e8f0]">{file.path}</span>
            <span
              className="text-[10px] px-1 py-0.5 rounded"
              style={{ backgroundColor: STATUS_COLORS[file.status] + '22', color: STATUS_COLORS[file.status] }}
            >
              {file.status}
            </span>
          </div>
        ))}
      </div>

      {/* Commit area */}
      <div className="p-2 border-t border-[#2a2a4a] space-y-1.5">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full px-2 py-1 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#6a6a8a]/50 resize-none h-12"
        />
        <div className="flex gap-1">
          <button
            disabled={!commitMessage.trim()}
            className="flex-1 py-1.5 bg-[#e94560] text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Commit
          </button>
          <button className="px-2 py-1.5 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-xs rounded hover:text-white">
            Pull
          </button>
          <button className="px-2 py-1.5 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-xs rounded hover:text-white">
            Push
          </button>
        </div>
      </div>
    </div>
  );
}
