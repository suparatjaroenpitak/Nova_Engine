import { useState } from 'react';

interface LightConfig {
  id: string;
  type: 'Directional' | 'Point' | 'Spot' | 'Area';
  name: string;
  enabled: boolean;
  color: string;
  intensity: number;
  temperature: number;
  shadow: boolean;
  softShadow: boolean;
}

function createLight(type: LightConfig['type']): LightConfig {
  return {
    id: `light-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    name: `${type} Light`,
    enabled: true,
    color: '#ffffff',
    intensity: type === 'Directional' ? 1 : type === 'Point' ? 3 : type === 'Spot' ? 2 : 0.5,
    temperature: 5500,
    shadow: type !== 'Area',
    softShadow: type === 'Directional',
  };
}

const LIGHT_PRESETS = [
  { label: 'Morning', color: '#ffddaa', intensity: 0.8, temperature: 4500 },
  { label: 'Noon', color: '#ffffff', intensity: 1.2, temperature: 5500 },
  { label: 'Evening', color: '#ff8844', intensity: 0.6, temperature: 3500 },
  { label: 'Night', color: '#4466ff', intensity: 0.2, temperature: 7000 },
  { label: 'Studio', color: '#ffffff', intensity: 1.5, temperature: 5600 },
];

export default function Lighting() {
  const [lights, setLights] = useState<LightConfig[]>([
    { id: 'default-dir', type: 'Directional', name: 'Sun', enabled: true, color: '#ffffff', intensity: 1, temperature: 5500, shadow: true, softShadow: true },
    { id: 'default-ambient', type: 'Directional', name: 'Ambient', enabled: true, color: '#87ceeb', intensity: 0.3, temperature: 6500, shadow: false, softShadow: false },
  ]);
  const [globalAO, setGlobalAO] = useState(true);
  const [aoIntensity, setAoIntensity] = useState(0.5);
  const [bloom, setBloom] = useState(true);
  const [bloomIntensity, setBloomIntensity] = useState(0.3);

  const addLight = (type: LightConfig['type']) => {
    setLights((prev) => [...prev, createLight(type)]);
  };

  const updateLight = (id: string, updates: Partial<LightConfig>) => {
    setLights((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const removeLight = (id: string) => {
    setLights((prev) => prev.filter((l) => l.id !== id));
  };

  const applyPreset = (preset: typeof LIGHT_PRESETS[0]) => {
    setLights((prev) =>
      prev.map((l) =>
        l.type === 'Directional' && l.name === 'Sun'
          ? { ...l, color: preset.color, intensity: preset.intensity, temperature: preset.temperature }
          : l
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border shrink-0">
        <span className="text-xs font-medium text-nova-muted uppercase tracking-wider">Lighting</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Light Presets */}
        <div>
          <div className="text-xs text-nova-muted mb-2 uppercase tracking-wider">Environment Presets</div>
          <div className="flex gap-1.5">
            {LIGHT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-nova-border bg-nova-bg/50 text-center hover:border-nova-accent/50 transition-colors"
              >
                <div className="w-full h-4 rounded mb-1" style={{ background: p.color }} />
                <span className="text-xs text-nova-muted">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Settings */}
        <div>
          <div className="text-xs text-nova-muted mb-2 uppercase tracking-wider">Global Settings</div>
          <div className="bg-nova-bg/50 border border-nova-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-nova-text">Ambient Occlusion</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={globalAO} onChange={() => setGlobalAO(!globalAO)} className="sr-only peer" />
                <div className="w-7 h-4 bg-nova-border rounded-full peer peer-checked:bg-nova-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-3" />
              </label>
            </div>
            {globalAO && (
              <div>
                <div className="flex justify-between text-xs text-nova-muted mb-1">
                  <span>AO Intensity</span>
                  <span>{aoIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aoIntensity}
                  onChange={(e) => setAoIntensity(parseFloat(e.target.value))}
                  className="w-full accent-nova-accent"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-nova-text">Bloom</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={bloom} onChange={() => setBloom(!bloom)} className="sr-only peer" />
                <div className="w-7 h-4 bg-nova-border rounded-full peer peer-checked:bg-nova-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-3" />
              </label>
            </div>
            {bloom && (
              <div>
                <div className="flex justify-between text-xs text-nova-muted mb-1">
                  <span>Bloom Intensity</span>
                  <span>{bloomIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bloomIntensity}
                  onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
                  className="w-full accent-nova-accent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Light List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nova-muted uppercase tracking-wider">Scene Lights</span>
            <div className="flex gap-1">
              {(['Directional', 'Point', 'Spot', 'Area'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => addLight(type)}
                  className="text-xs px-1.5 py-1 rounded bg-nova-hover text-nova-muted hover:text-nova-text hover:bg-nova-active transition-colors"
                  title={`Add ${type} Light`}
                >
                  +{type[0]}
                </button>
              ))}
            </div>
          </div>

          {lights.map((light) => (
            <div key={light.id} className="bg-nova-bg/50 border border-nova-border rounded-lg mb-2 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-nova-surface2/30">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={light.enabled}
                    onChange={(e) => updateLight(light.id, { enabled: e.target.checked })}
                    className="accent-nova-accent"
                  />
                  <span className="text-xs font-medium text-nova-text">{light.name}</span>
                  <span className="text-xs text-nova-muted">{light.type}</span>
                </div>
                <button onClick={() => removeLight(light.id)} className="text-nova-muted hover:text-red-400 text-xs">
                  ✕
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-nova-muted block mb-0.5">Color</label>
                    <input
                      type="color"
                      value={light.color}
                      onChange={(e) => updateLight(light.id, { color: e.target.value })}
                      className="w-full h-6 rounded cursor-pointer bg-transparent border-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-nova-muted block mb-0.5">Intensity</label>
                    <input
                      type="number"
                      value={light.intensity}
                      onChange={(e) => updateLight(light.id, { intensity: parseFloat(e.target.value) || 0 })}
                      step="0.1"
                      min="0"
                      className="w-full px-2 py-1 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-nova-muted block mb-0.5">Temperature</label>
                    <input
                      type="number"
                      value={light.temperature}
                      onChange={(e) => updateLight(light.id, { temperature: parseInt(e.target.value) || 5500 })}
                      min="1000"
                      max="20000"
                      step="100"
                      className="w-full px-2 py-1 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-nova-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={light.shadow}
                      onChange={(e) => updateLight(light.id, { shadow: e.target.checked })}
                      className="accent-nova-accent"
                    />
                    Shadows
                  </label>
                  {light.shadow && (
                    <label className="flex items-center gap-1.5 text-xs text-nova-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={light.softShadow}
                        onChange={(e) => updateLight(light.id, { softShadow: e.target.checked })}
                        className="accent-nova-accent"
                      />
                      Soft
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}

          {lights.length === 0 && (
            <div className="text-center py-8 text-nova-muted text-xs">
              No lights in scene. Add one to illuminate your scene.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
