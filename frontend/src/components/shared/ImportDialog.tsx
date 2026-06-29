import { useState } from 'react';
import { useImportStore } from '@/stores/importStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildFileTree, flattenTreeStats } from '@/services/importService';
import { FILE_CATEGORY_ICONS } from '@/types/import';
import type { FileCategory, ImportPreset } from '@/types/import';

const PRESETS: ImportPreset[] = [
  { id: 'default', name: 'Default', settings: { scale: 1, rotation: [0,0,0], unitConversion: 'auto', meshCompression: 'medium', textureCompression: 'medium', generateCollider: false, generateLOD: true, lodCount: 3, generateLightmapUV: false, importAnimation: true, importMaterial: true, importTexture: true, importAudio: true, importSkeleton: true, importBlendShape: true, optimizeMesh: true, generatePreview: true } },
  { id: 'lowpoly', name: 'Low Poly', settings: { scale: 1, rotation: [0,0,0], unitConversion: 'auto', meshCompression: 'high', textureCompression: 'high', generateCollider: true, generateLOD: true, lodCount: 3, generateLightmapUV: true, importAnimation: false, importMaterial: false, importTexture: true, importAudio: true, importSkeleton: false, importBlendShape: false, optimizeMesh: true, generatePreview: true } },
  { id: 'highres', name: 'High Resolution', settings: { scale: 1, rotation: [0,0,0], unitConversion: 'auto', meshCompression: 'none', textureCompression: 'none', generateCollider: false, generateLOD: true, lodCount: 4, generateLightmapUV: false, importAnimation: true, importMaterial: true, importTexture: true, importAudio: true, importSkeleton: true, importBlendShape: true, optimizeMesh: false, generatePreview: true } },
  { id: 'collision', name: 'Collision Only', settings: { scale: 1, rotation: [0,0,0], unitConversion: 'auto', meshCompression: 'medium', textureCompression: 'none', generateCollider: true, generateLOD: false, lodCount: 1, generateLightmapUV: false, importAnimation: false, importMaterial: false, importTexture: false, importAudio: false, importSkeleton: false, importBlendShape: false, optimizeMesh: true, generatePreview: false } },
];

export default function ImportDialog() {
  const show = useImportStore((s) => s.showImportDialog);
  const pendingImport = useImportStore((s) => s.pendingImport);
  const hideImportSettings = useImportStore((s) => s.hideImportSettings);
  const settings = useImportStore((s) => s.importSettings);
  const updateImportSettings = useImportStore((s) => s.updateImportSettings);
  const setPreset = useImportStore((s) => s.setPreset);
  const startImport = useImportStore((s) => s.startImport);
  const currentPreset = useImportStore((s) => s.currentPreset);
  const projectId = useProjectStore((s) => s.currentProject?.id);
  const [settingsTab, setSettingsTab] = useState<'general' | 'mesh' | 'texture' | 'animation'>('general');

  if (!show || !pendingImport) return null;

  const tree = buildFileTree(pendingImport);
  const stats = flattenTreeStats(tree);
  const formatSize = (bytes: number) => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  const applyPreset = (preset: ImportPreset) => {
    setPreset(preset.id);
    updateImportSettings(preset.settings);
  };

  const handleStart = () => {
    if (projectId) startImport(projectId);
  };

  const toggle = (key: keyof typeof settings) => {
    updateImportSettings({ [key]: !settings[key] });
  };

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => setSettingsTab(id as any)}
      className={`px-3 py-1 text-[10px] rounded ${settingsTab === id ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
    >{label}</button>
  );

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[640px] max-h-[80vh] bg-[#12122a] border border-[#2a2a4a] rounded-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a4a] bg-[#1a1a35]">
          <div>
            <div className="text-sm font-medium text-white">Import Settings</div>
            <div className="text-[10px] text-[#6a6a8a] mt-0.5">
              {stats.count} file{stats.count !== 1 ? 's' : ''} • {formatSize(stats.totalSize)}
            </div>
          </div>
          <button onClick={hideImportSettings} className="text-[#6a6a8a] hover:text-white">✕</button>
        </div>

        {/* Presets */}
        <div className="px-4 py-2 border-b border-[#2a2a4a] bg-[#0f0f25]">
          <div className="text-[9px] text-[#6a6a8a] mb-1">Presets</div>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => applyPreset(p)}
                className={`px-2 py-1 text-[9px] rounded border ${currentPreset === p.id ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-[#2a2a4a] text-[#6a6a8a] hover:text-white'}`}
              >{p.name}</button>
            ))}
          </div>
        </div>

        {/* File list + Settings */}
        <div className="flex-1 flex overflow-hidden">
          {/* File tree */}
          <div className="w-48 border-r border-[#2a2a4a] overflow-y-auto p-2 bg-[#0a0a1a]">
            <div className="text-[9px] font-medium text-[#6a6a8a] mb-1">Files</div>
            {renderTreeNode(tree, 0)}
          </div>

          {/* Settings */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex gap-1 mb-3">
              <TabButton id="general" label="General" />
              <TabButton id="mesh" label="Mesh" />
              <TabButton id="texture" label="Texture" />
              <TabButton id="animation" label="Animation" />
            </div>

            {settingsTab === 'general' && (
              <div className="space-y-2">
                <SettingRow label="Scale Factor" hint="Multiply object scale">
                  <input type="number" value={settings.scale} step={0.1} min={0.01} max={1000}
                    onChange={(e) => updateImportSettings({ scale: parseFloat(e.target.value) || 1 })}
                    className="w-20 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]" />
                </SettingRow>
                <SettingRow label="Unit Conversion">
                  <select value={settings.unitConversion} onChange={(e) => updateImportSettings({ unitConversion: e.target.value as any })}
                    className="px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
                    <option value="auto">Auto Detect</option>
                    <option value="meter">Meter</option>
                    <option value="centimeter">Centimeter</option>
                    <option value="inch">Inch</option>
                    <option value="foot">Foot</option>
                  </select>
                </SettingRow>
                <Checkbox label="Generate Preview" checked={settings.generatePreview} onChange={() => toggle('generatePreview')} />
              </div>
            )}

            {settingsTab === 'mesh' && (
              <div className="space-y-2">
                <SettingRow label="Mesh Compression">
                  <select value={settings.meshCompression} onChange={(e) => updateImportSettings({ meshCompression: e.target.value as any })}
                    className="px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </SettingRow>
                <SettingRow label="LOD Count">
                  <input type="number" value={settings.lodCount} min={0} max={5}
                    onChange={(e) => updateImportSettings({ lodCount: parseInt(e.target.value) || 0 })}
                    className="w-20 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]" />
                </SettingRow>
                <Checkbox label="Generate LODs" checked={settings.generateLOD} onChange={() => toggle('generateLOD')} />
                <Checkbox label="Generate Collider" checked={settings.generateCollider} onChange={() => toggle('generateCollider')} />
                <Checkbox label="Generate Lightmap UV" checked={settings.generateLightmapUV} onChange={() => toggle('generateLightmapUV')} />
                <Checkbox label="Optimize Mesh" checked={settings.optimizeMesh} onChange={() => toggle('optimizeMesh')} />
                <Checkbox label="Import Skeleton" checked={settings.importSkeleton} onChange={() => toggle('importSkeleton')} />
                <Checkbox label="Import Blend Shapes" checked={settings.importBlendShape} onChange={() => toggle('importBlendShape')} />
              </div>
            )}

            {settingsTab === 'texture' && (
              <div className="space-y-2">
                <SettingRow label="Texture Compression">
                  <select value={settings.textureCompression} onChange={(e) => updateImportSettings({ textureCompression: e.target.value as any })}
                    className="px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </SettingRow>
                <Checkbox label="Import Textures" checked={settings.importTexture} onChange={() => toggle('importTexture')} />
              </div>
            )}

            {settingsTab === 'animation' && (
              <div className="space-y-2">
                <Checkbox label="Import Animation" checked={settings.importAnimation} onChange={() => toggle('importAnimation')} />
                <Checkbox label="Import Materials" checked={settings.importMaterial} onChange={() => toggle('importMaterial')} />
                <Checkbox label="Import Audio" checked={settings.importAudio} onChange={() => toggle('importAudio')} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a4a] bg-[#1a1a35]">
          <button onClick={hideImportSettings} className="px-3 py-1.5 text-[10px] text-[#6a6a8a] hover:text-white">Cancel</button>
          <button onClick={handleStart} className="px-4 py-1.5 text-[10px] bg-[#e94560] text-white rounded hover:bg-red-500 font-medium">
            Import {stats.count} File{stats.count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function renderTreeNode(node: { name: string; children: Record<string, any>; files: Array<{ id: string; name: string; category: FileCategory; size: number }> }, depth: number): React.ReactNode {
  const entries = Object.entries(node.children);
  const hasContent = entries.length > 0 || node.files.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-0.5">
      {entries.map(([name, child]) => (
        <div key={name}>
          <div className="flex items-center gap-1 text-[9px] text-[#8a8aaa] py-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
            <span>📁</span>
            <span className="truncate">{name}</span>
          </div>
          {renderTreeNode(child, depth + 1)}
        </div>
      ))}
      {node.files.map((f) => (
        <div key={f.id} className="flex items-center gap-1 text-[9px] text-[#6a6a8a] py-0.5" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          <span>{FILE_CATEGORY_ICONS[f.category] || '📄'}</span>
          <span className="truncate">{f.name}</span>
          <span className="text-[#4a4a6a] ml-auto">{(f.size / 1024).toFixed(0)}K</span>
        </div>
      ))}
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-[10px] text-[#e8e8f0]">{label}</span>
        {hint && <div className="text-[8px] text-[#6a6a8a]">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-[#e8e8f0]">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#e94560]" />
    </div>
  );
}
