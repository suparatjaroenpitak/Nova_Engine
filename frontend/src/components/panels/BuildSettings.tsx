import { useState } from 'react';
import type { BuildSettings as BuildSettingsType } from '@/types';

const PLATFORMS = [
  { id: 'web', label: 'Web', icon: '🌐', desc: 'HTML5 / WebGL' },
  { id: 'windows', label: 'Windows', icon: '🪟', desc: '64-bit standalone' },
  { id: 'linux', label: 'Linux', icon: '🐧', desc: '64-bit standalone' },
  { id: 'macos', label: 'macOS', icon: '🍎', desc: 'Universal binary' },
  { id: 'android', label: 'Android', icon: '📱', desc: 'APK / AAB' },
  { id: 'ios', label: 'iOS', icon: '📲', desc: 'IPA' },
];

export default function BuildSettings() {
  const [settings, setSettings] = useState<BuildSettingsType>({
    target: 'web',
    compression: 'gzip',
    il2cpp: false,
    developmentBuild: false,
    autoconnectProfiler: false,
    scriptOnly: false,
    outputPath: 'Builds/',
    scenes: [],
  });
  const [building, setBuilding] = useState(false);
  const [buildLog, setBuildLog] = useState<string[]>([]);

  const handleBuild = async () => {
    setBuilding(true);
    setBuildLog([]);
    const log = (msg: string) => setBuildLog((prev) => [...prev, msg]);

    log(`Starting build for ${settings.target}...`);
    log('Compiling scripts...');
    await new Promise((r) => setTimeout(r, 500));
    log('Bundling assets...');
    await new Promise((r) => setTimeout(r, 500));
    log('Optimizing...');
    await new Promise((r) => setTimeout(r, 500));
    log(`Build complete! Output: ${settings.outputPath}${settings.target}/`);

    setBuilding(false);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* Platform selection */}
        <div>
          <span className="text-xs font-medium text-[#e8e8f0] block mb-2">Platform</span>
          <div className="grid grid-cols-3 gap-1">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSettings({ ...settings, target: p.id as any })}
                className={`p-2 rounded border text-left transition-all ${
                  settings.target === p.id
                    ? 'border-[#e94560] bg-[#e94560]/10'
                    : 'border-[#2a2a4a] bg-[#1a1a35] hover:border-[#3a3a5a]'
                }`}
              >
                <div className="text-lg mb-1">{p.icon}</div>
                <div className="text-xs font-medium text-[#e8e8f0]">{p.label}</div>
                <div className="text-[10px] text-[#6a6a8a]">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2 bg-[#1a1a35] border border-[#2a2a4a] rounded p-3">
          <span className="text-xs font-medium text-[#e8e8f0] block">Options</span>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.developmentBuild} onChange={(e) => setSettings({ ...settings, developmentBuild: e.target.checked })} className="accent-[#e94560]" />
            <span className="text-xs text-[#e8e8f0]">Development Build</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.autoconnectProfiler} onChange={(e) => setSettings({ ...settings, autoconnectProfiler: e.target.checked })} className="accent-[#e94560]" />
            <span className="text-xs text-[#e8e8f0]">Auto-Connect Profiler</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.il2cpp} onChange={(e) => setSettings({ ...settings, il2cpp: e.target.checked })} className="accent-[#e94560]" />
            <span className="text-xs text-[#e8e8f0]">IL2CPP Backend</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.scriptOnly} onChange={(e) => setSettings({ ...settings, scriptOnly: e.target.checked })} className="accent-[#e94560]" />
            <span className="text-xs text-[#e8e8f0]">Scripts Only</span>
          </label>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-[#e8e8f0] block">Output</span>
          <div className="flex items-center gap-2">
            <input
              value={settings.outputPath}
              onChange={(e) => setSettings({ ...settings, outputPath: e.target.value })}
              className="flex-1 px-2 py-1 text-xs bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono"
            />
            <button className="px-2 py-1 text-xs bg-[#1a1a35] border border-[#2a2a4a] rounded text-[#6a6a8a] hover:text-[#e8e8f0]">
              Browse
            </button>
          </div>
        </div>

        {/* Build button */}
        <button
          onClick={handleBuild}
          disabled={building}
          className="w-full py-2 bg-[#e94560] text-white text-xs font-medium rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {building ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building...
            </>
          ) : (
            `Build for ${PLATFORMS.find((p) => p.id === settings.target)?.label || settings.target}`
          )}
        </button>

        {/* Build log */}
        {buildLog.length > 0 && (
          <div className="bg-[#0a0a1a] border border-[#2a2a4a] rounded p-2 max-h-40 overflow-y-auto font-mono">
            {buildLog.map((line, i) => (
              <div key={i} className="text-[10px] text-[#6a6a8a] leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
