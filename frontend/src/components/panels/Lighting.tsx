import { useState } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-1.5 py-0.5 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 h-1 accent-[#e94560] cursor-pointer"
        />
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-14 px-1.5 py-0.5 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono"
        />
      </div>
    </div>
  );
}

function Section({ title, icon, children, defaultExpanded = true }: { title: string; icon: string; children: React.ReactNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border border-[#2a2a4a] rounded overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 bg-[#1a1a35] hover:bg-[#222245] transition-colors text-left"
      >
        <span className="text-xs">{icon}</span>
        <span className="text-xs font-medium text-[#e8e8f0] flex-1">{title}</span>
        <span className="text-[10px] text-[#6a6a8a]">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && <div className="p-2 space-y-1">{children}</div>}
    </div>
  );
}

const ENVIRONMENT_PRESETS = [
  { name: 'Default', color: '#0a0a1a', ambient: '#87ceeb' },
  { name: 'Sunset', color: '#1a0a0a', ambient: '#ff8844' },
  { name: 'Night', color: '#000011', ambient: '#334466' },
  { name: 'Desert', color: '#1a1410', ambient: '#ffcc88' },
  { name: 'Forest', color: '#0a140a', ambient: '#88cc66' },
  { name: 'Underwater', color: '#001a2a', ambient: '#4488cc' },
  { name: 'Studio', color: '#222222', ambient: '#ffffff' },
  { name: 'Neon', color: '#0a001a', ambient: '#ff44aa' },
];

export default function Lighting() {
  const { sceneSettings, updateSceneSettings } = useUiStore();
  const { createGameObject, currentSceneId } = useSceneStore();
  const [showPresets, setShowPresets] = useState(false);

  const handleCreateLight = async (type: string) => {
    if (!currentSceneId) return;
    const names: Record<string, string> = {
      directional: 'Directional Light',
      point: 'Point Light',
      spot: 'Spot Light',
      area: 'Area Light',
    };
    const obj = await createGameObject(currentSceneId, names[type] || `${type} Light`);
    // Light component would be added here
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* Environment preset */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#e8e8f0]">Environment</span>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-[#e94560] hover:text-red-400"
            >
              Presets
            </button>
          </div>
          {showPresets && (
            <div className="grid grid-cols-4 gap-1 mb-2">
              {ENVIRONMENT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    updateSceneSettings({
                      fogColor: p.color,
                      ambientColor: p.ambient,
                    });
                    setShowPresets(false);
                  }}
                  className="p-1 rounded border border-[#2a2a4a] hover:border-[#e94560] transition-colors text-center"
                >
                  <div
                    className="w-full h-6 rounded mb-0.5"
                    style={{ background: `linear-gradient(135deg, ${p.color}, ${p.ambient})` }}
                  />
                  <span className="text-[9px] text-[#6a6a8a]">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <ColorField label="Fog Color" value={sceneSettings.fogColor || '#0a0a1a'} onChange={(v) => updateSceneSettings({ fogColor: v })} />
          <SliderField label="Fog Density" value={sceneSettings.fogDensity || 0.025} min={0} max={0.1} step={0.001} onChange={(v) => updateSceneSettings({ fogDensity: v })} />
          <ColorField label="Ambient Color" value={sceneSettings.ambientColor || '#87ceeb'} onChange={(v) => updateSceneSettings({ ambientColor: v })} />
          <SliderField label="Ambient Intensity" value={sceneSettings.ambientIntensity || 0.4} min={0} max={2} step={0.1} onChange={(v) => updateSceneSettings({ ambientIntensity: v })} />
        </div>

        {/* Global settings */}
        <Section title="Global Illumination" icon="☀">
          <SliderField label="Indirect Scale" value={1} min={0} max={5} step={0.1} onChange={() => {}} />
          <SliderField label="Bounce Intensity" value={1} min={0} max={5} step={0.1} onChange={() => {}} />
          <SliderField label="AO Intensity" value={0.5} min={0} max={1} step={0.05} onChange={() => {}} />
        </Section>

        <Section title="Shadows" icon="◐">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-[#6a6a8a]">Shadow Type</span>
            <select className="px-2 py-0.5 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
              <option>Soft Shadows</option>
              <option>Hard Shadows</option>
              <option>No Shadows</option>
            </select>
          </div>
          <SliderField label="Shadow Distance" value={50} min={0} max={200} step={1} onChange={() => {}} />
          <SliderField label="Shadow Cascade" value={4} min={1} max={8} step={1} onChange={() => {}} />
        </Section>

        <Section title="Post Processing" icon="✨" defaultExpanded={false}>
          <SliderField label="Bloom Intensity" value={0.5} min={0} max={3} step={0.1} onChange={() => {}} />
          <SliderField label="Bloom Threshold" value={0.8} min={0} max={2} step={0.1} onChange={() => {}} />
          <SliderField label="Vignette" value={0.3} min={0} max={1} step={0.05} onChange={() => {}} />
          <SliderField label="Chromatic Aberration" value={0} min={0} max={1} step={0.05} onChange={() => {}} />
        </Section>

        <Section title="Fog" icon="🌫">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-[#6a6a8a]">Fog Mode</span>
            <select
              value={sceneSettings.fogMode || 'exponential'}
              onChange={(e) => updateSceneSettings({ fogMode: e.target.value as 'linear' | 'exponential' })}
              className="px-2 py-0.5 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]"
            >
              <option value="exponential">Exponential</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <ColorField label="Color" value={sceneSettings.fogColor || '#0a0a1a'} onChange={(v) => updateSceneSettings({ fogColor: v })} />
          <SliderField label="Density" value={sceneSettings.fogDensity || 0.025} min={0} max={0.1} step={0.001} onChange={(v) => updateSceneSettings({ fogDensity: v })} />
        </Section>

        {/* Create lights */}
        <div className="pt-2 border-t border-[#2a2a4a]">
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Create Light</span>
          <div className="grid grid-cols-2 gap-1">
            {[
              { type: 'directional', label: 'Directional', icon: '☀' },
              { type: 'point', label: 'Point', icon: '💡' },
              { type: 'spot', label: 'Spot', icon: '🔦' },
              { type: 'area', label: 'Area', icon: '▬' },
            ].map((l) => (
              <button
                key={l.type}
                onClick={() => handleCreateLight(l.type)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] hover:text-[#e8e8f0] hover:border-[#e94560]/50 transition-all"
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
