import { useState, useEffect } from 'react';
import { packagesApi } from '@/api/packages';
import { useProjectStore } from '@/stores/projectStore';
import type { PackageDto } from '@/types';

const registryPackages = [
  { name: 'com.nova.physics', version: '1.0.0', description: 'Built-in physics engine' },
  { name: 'com.nova.audio', version: '1.0.0', description: 'Audio system' },
  { name: 'com.nova.ai', version: '1.0.0', description: 'AI and navigation' },
  { name: 'com.nova.animation', version: '1.0.0', description: 'Animation system' },
  { name: 'com.nova.postprocessing', version: '1.0.0', description: 'Post-processing effects' },
  { name: 'com.nova.terrain', version: '1.0.0', description: 'Terrain system' },
];

export default function PackageManager() {
  const { currentProject } = useProjectStore();
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [selectedTab, setSelectedTab] = useState<'installed' | 'registry'>('installed');

  useEffect(() => {
    if (currentProject) {
      packagesApi.list(currentProject.id).then(({ data }) => setPackages(data));
    }
  }, [currentProject]);

  const handleInstall = async (name: string, version: string) => {
    if (!currentProject) return;
    // In a real implementation, this would install via the package manager API
    // For now, add to the project's package manifest
    const { data } = await packagesApi.add({ name, version, source: 'registry' });
    setPackages((p) => [...p, data]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-nova-border">
        <button
          onClick={() => setSelectedTab('installed')}
          className={`px-4 py-2 text-xs font-medium ${
            selectedTab === 'installed' ? 'text-nova-accent border-b-2 border-nova-accent' : 'text-nova-muted hover:text-nova-text'
          }`}
        >
          Installed
        </button>
        <button
          onClick={() => setSelectedTab('registry')}
          className={`px-4 py-2 text-xs font-medium ${
            selectedTab === 'registry' ? 'text-nova-accent border-b-2 border-nova-accent' : 'text-nova-muted hover:text-nova-text'
          }`}
        >
          Registry
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {selectedTab === 'installed' && (
          <div>
            {packages.length === 0 && (
              <div className="text-nova-muted text-xs text-center py-8">No packages installed</div>
            )}
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between py-2 border-b border-nova-border/50">
                <div>
                  <div className="text-sm text-nova-text">{pkg.name}</div>
                  <div className="text-xs text-nova-muted">v{pkg.version} · {pkg.source}</div>
                </div>
                <button className="px-2 py-1 text-xs bg-nova-hover text-nova-text rounded hover:bg-nova-active">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'registry' && (
          <div>
            {registryPackages.map((pkg) => {
              const installed = packages.some((p) => p.name === pkg.name);
              return (
                <div key={pkg.name} className="flex items-center justify-between py-2 border-b border-nova-border/50">
                  <div>
                    <div className="text-sm text-nova-text">{pkg.name}</div>
                    <div className="text-xs text-nova-muted">v{pkg.version} · {pkg.description}</div>
                  </div>
                  <button
                    onClick={() => !installed && handleInstall(pkg.name, pkg.version)}
                    disabled={installed}
                    className={`px-3 py-1 text-xs rounded ${
                      installed
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-nova-accent text-white hover:bg-red-600'
                    }`}
                  >
                    {installed ? 'Installed' : 'Install'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
