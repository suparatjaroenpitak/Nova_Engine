import { useState, useMemo } from 'react';
import type { PackageDto } from '@/types';

const MOCK_REGISTRY = [
  { name: 'Nova Physics', version: '2.1.0', author: 'Nova Labs', desc: 'Advanced physics engine', downloads: 15420, stars: 342, category: 'Physics' },
  { name: 'Nova UI Toolkit', version: '1.8.3', author: 'Nova Labs', desc: 'Modern UI framework', downloads: 23100, stars: 567, category: 'UI' },
  { name: 'Nova PostFX', version: '3.0.1', author: 'Nova Labs', desc: 'Post-processing effects', downloads: 18900, stars: 423, category: 'Rendering' },
  { name: 'Nova Terrain', version: '1.2.0', author: 'Nova Labs', desc: 'Terrain generation system', downloads: 8900, stars: 198, category: 'World' },
  { name: 'Nova Audio', version: '2.0.0', author: 'Nova Labs', desc: 'Spatial audio system', downloads: 12100, stars: 267, category: 'Audio' },
  { name: 'Nova AI', version: '1.5.0', author: 'Nova Labs', desc: 'Behavior tree & state machine', downloads: 6700, stars: 156, category: 'AI' },
  { name: 'Nova Multiplayer', version: '0.9.0', author: 'Nova Labs', desc: 'Networking & replication', downloads: 3400, stars: 89, category: 'Network' },
  { name: 'Nova Animation', version: '2.2.0', author: 'Nova Labs', desc: 'Advanced animation system', downloads: 14500, stars: 334, category: 'Animation' },
  { name: 'Nova Shader Graph', version: '1.3.0', author: 'Nova Labs', desc: 'Visual shader editor', downloads: 19800, stars: 456, category: 'Rendering' },
  { name: 'Nova AI Assistant', version: '1.0.0', author: 'Nova Labs', desc: 'AI-powered development assistant', downloads: 5600, stars: 123, category: 'Tools' },
];

const INSTALLED_PACKAGES: PackageDto[] = [
  { id: '1', name: 'Nova Physics', version: '2.1.0', source: 'Registry', isEnabled: true },
  { id: '2', name: 'Nova UI Toolkit', version: '1.8.3', source: 'Registry', isEnabled: true },
];

export default function PackageManager() {
  const [tab, setTab] = useState<'registry' | 'installed' | 'updates'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Physics', 'UI', 'Rendering', 'World', 'Audio', 'AI', 'Network', 'Animation', 'Tools'];

  const filteredPackages = useMemo(() => {
    let list = tab === 'registry' ? MOCK_REGISTRY : [];
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [tab, category, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center h-8 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-2 shrink-0">
        <div className="flex border border-[#2a2a4a] rounded text-xs">
          {(['registry', 'installed', 'updates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 py-1 ${tab === t ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search packages..."
          className="w-40 px-2 py-1 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#6a6a8a]/50"
        />
      </div>

      {/* Category tabs */}
      <div className="flex items-center h-7 px-2 gap-1 bg-[#12122a] border-b border-[#2a2a4a] overflow-x-auto shrink-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
              category === c ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white hover:bg-[#1a1a35]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tab === 'installed' && (
          <>
            {INSTALLED_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-2 bg-[#1a1a35] border border-[#2a2a4a] rounded">
                <div>
                  <div className="text-xs font-medium text-[#e8e8f0]">{pkg.name}</div>
                  <div className="text-[10px] text-[#6a6a8a]">v{pkg.version} · {pkg.source}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button className={`px-2 py-1 rounded text-[10px] ${pkg.isEnabled ? 'bg-[#e94560] text-white' : 'bg-[#2a2a4a] text-[#6a6a8a]'}`}>
                    {pkg.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button className="px-2 py-1 rounded text-[10px] bg-[#2a2a4a] text-[#6a6a8a] hover:text-white">Remove</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'registry' && filteredPackages.map((pkg) => (
          <div key={pkg.name} className="flex items-center justify-between p-2 bg-[#1a1a35] border border-[#2a2a4a] rounded hover:border-[#3a3a5a] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#e8e8f0]">{pkg.name}</span>
                <span className="text-[10px] text-[#6a6a8a]">v{pkg.version}</span>
                <span className="text-[10px] px-1 py-0.5 bg-[#2a2a4a] rounded text-[#6a6a8a]">{pkg.category}</span>
              </div>
              <div className="text-[10px] text-[#6a6a8a] mt-0.5">{pkg.desc}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[#6a6a8a]">by {pkg.author}</span>
                <span className="text-[10px] text-[#6a6a8a]">★ {pkg.stars}</span>
                <span className="text-[10px] text-[#6a6a8a]">⬇ {pkg.downloads.toLocaleString()}</span>
              </div>
            </div>
            <button className="ml-2 px-3 py-1 bg-[#e94560] text-white text-xs rounded hover:bg-red-600 whitespace-nowrap">
              Install
            </button>
          </div>
        ))}

        {tab === 'updates' && (
          <div className="text-center py-8 text-xs text-[#6a6a8a]">
            All packages are up to date.
          </div>
        )}
      </div>
    </div>
  );
}
