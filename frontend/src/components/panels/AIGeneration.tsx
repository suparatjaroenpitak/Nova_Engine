import { useEffect, useState } from 'react';
import { useAIGenerationStore } from '@/stores/aiGenerationStore';
import { AI_MODELS, type AIGenerationMode, type AIModel } from '@/types/ai3d';

export default function AIGeneration() {
  const store = useAIGenerationStore();
  const [activeTab, setActiveTab] = useState<'generate' | 'jobs' | 'settings'>('generate');

  useEffect(() => {
    store.loadJobs();
    store.connectHub();
    return () => { store.disconnectHub(); };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      <div className="flex border-b border-[#2a2a4a] bg-[#1a1a35] shrink-0">
        {(['generate', 'jobs', 'settings'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[10px] ${activeTab === tab ? 'text-white border-b-2 border-[#e94560]' : 'text-[#6a6a8a]'}`}
          >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'generate' && <GeneratePanel store={store} />}
        {activeTab === 'jobs' && <JobsPanel store={store} />}
        {activeTab === 'settings' && <SettingsPanel store={store} />}
      </div>
    </div>
  );
}

function GeneratePanel({ store }: { store: ReturnType<typeof useAIGenerationStore> }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-2">
        <button onClick={() => store.setMode('text-to-3d')}
          className={`flex-1 py-2 rounded text-[10px] border ${store.mode === 'text-to-3d' ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-[#2a2a4a] text-[#6a6a8a]'}`}
        >📝 Text to 3D</button>
        <button onClick={() => store.setMode('image-to-3d')}
          className={`flex-1 py-2 rounded text-[10px] border ${store.mode === 'image-to-3d' ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-[#2a2a4a] text-[#6a6a8a]'}`}
        >🖼 Image to 3D</button>
      </div>

      <div>
        <div className="text-[10px] text-[#6a6a8a] mb-1">AI Model</div>
        <div className="grid grid-cols-3 gap-1">
          {AI_MODELS.map((m) => (
            <button key={m.id} onClick={() => store.setSelectedModel(m.id)}
              className={`p-1.5 rounded text-center border ${store.selectedModel === m.id ? 'border-[#e94560] bg-[#e94560]/10' : 'border-[#2a2a4a] hover:border-[#3a3a5a]'}`}
            >
              <div className="text-sm">{m.icon}</div>
              <div className="text-[8px] text-[#e8e8f0] font-medium truncate">{m.name}</div>
              <div className="text-[7px] text-[#6a6a8a] truncate">{m.description.slice(0, 30)}</div>
            </button>
          ))}
        </div>
      </div>

      {store.mode === 'text-to-3d' && (
        <div>
          <div className="text-[10px] text-[#6a6a8a] mb-1">Prompt</div>
          <textarea value={store.prompt} onChange={(e) => store.setPrompt(e.target.value)}
            placeholder="Describe the 3D model you want to create..."
            className="w-full h-24 px-2 py-1.5 text-[10px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#4a4a6a] resize-none"
          />
        </div>
      )}

      {store.mode === 'image-to-3d' && (
        <div>
          <div className="text-[10px] text-[#6a6a8a] mb-1">Reference Image</div>
          <label className="block border-2 border-dashed border-[#2a2a4a] rounded p-4 text-center cursor-pointer hover:border-[#3a3a5a]">
            <input type="file" accept="image/*" onChange={(e) => store.setImageFile(e.target.files?.[0] || null)} className="hidden" />
            {store.imageFile ? (
              <div>
                <img src={URL.createObjectURL(store.imageFile)} className="max-h-32 mx-auto rounded" />
                <div className="text-[9px] text-[#6a6a8a] mt-1">{store.imageFile.name}</div>
              </div>
            ) : (
              <div className="text-[#6a6a8a]">
                <div className="text-lg mb-1">📁</div>
                <div className="text-[10px]">Drop an image or click to browse</div>
                <div className="text-[8px] text-[#4a4a6a] mt-0.5">PNG, JPG, WEBP</div>
              </div>
            )}
          </label>
        </div>
      )}

      <button onClick={store.submitJob} disabled={store.generating}
        className="w-full py-2 bg-gradient-to-r from-[#e94560] to-purple-600 text-white text-[11px] rounded hover:opacity-90 disabled:opacity-50 font-medium"
      >
        {store.generating ? '⏳ Generating...' : '🚀 Generate 3D Model'}
      </button>

      {store.error && (
        <div className="p-2 bg-red-900/30 border border-red-800 rounded text-[10px] text-red-400">
          {store.error}
          <button onClick={store.clearError} className="ml-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {store.colabStatus && (
        <div className="p-2 bg-[#0a0a1a] border border-[#2a2a4a] rounded">
          <div className="text-[9px] font-medium text-[#6a6a8a] mb-1">Colab Status</div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <span className="text-[#4a4a6a]">GPU:</span>
            <span className="text-[#e8e8f0]">{store.colabStatus.gpu || 'N/A'}</span>
            <span className="text-[#4a4a6a]">Model:</span>
            <span className={`${store.colabStatus.modelLoaded ? 'text-green-400' : 'text-yellow-400'}`}>
              {store.colabStatus.modelLoaded ? 'Loaded' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function JobsPanel({ store }: { store: ReturnType<typeof useAIGenerationStore> }) {
  return (
    <div className="p-2 space-y-1">
      {store.jobs.length === 0 && (
        <div className="text-center py-8 text-[#6a6a8a] text-[10px]">No generation jobs yet</div>
      )}
      {store.jobs.map((job) => (
        <div key={job.id} className="p-2 bg-[#0f0f25] border border-[#2a2a4a] rounded text-[10px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#e8e8f0] font-medium truncate">{job.prompt || job.mode}</span>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[#6a6a8a]">
            <span>{job.model}</span>
            <span>•</span>
            <span>{new Date(job.createdAt).toLocaleString()}</span>
          </div>
          {job.status === 'processing' && (
            <div className="mt-1 w-full h-1 bg-[#0a0a1a] rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#e94560] to-purple-600 rounded transition-all" style={{ width: `${job.progress}%` }} />
            </div>
          )}
          <div className="flex gap-1 mt-1">
            {job.status === 'processing' && (
              <button onClick={() => store.cancelJob(job.id)} className="px-2 py-0.5 text-[8px] bg-red-800 text-red-300 rounded hover:bg-red-700">Cancel</button>
            )}
            {job.status === 'failed' && (
              <button onClick={() => store.retryJob(job.id)} className="px-2 py-0.5 text-[8px] bg-yellow-800 text-yellow-300 rounded hover:bg-yellow-700">Retry</button>
            )}
            {job.status === 'completed' && (
              <button className="px-2 py-0.5 text-[8px] bg-green-800 text-green-300 rounded hover:bg-green-700">Preview</button>
            )}
          </div>
          {job.error && <div className="mt-1 text-[8px] text-red-400">{job.error}</div>}
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ store }: { store: ReturnType<typeof useAIGenerationStore> }) {
  return (
    <div className="p-3 space-y-2">
      <div className="text-[11px] font-medium text-[#e8e8f0]">Generation Settings</div>
      <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6a6a8a]">Resolution</span>
          <select className="px-2 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
            <option>256</option>
            <option>512</option>
            <option selected>1024</option>
            <option>2048</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6a6a8a]">Poly Count</span>
          <select className="px-2 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
            <option>5K</option>
            <option selected>50K</option>
            <option>100K</option>
            <option>500K</option>
          </select>
        </div>
        <ToggleSetting label="Generate Texture" defaultChecked />
        <ToggleSetting label="Generate Material (PBR)" defaultChecked />
        <ToggleSetting label="Generate LODs" defaultChecked />
        <ToggleSetting label="UV Unwrap" defaultChecked />
        <ToggleSetting label="Optimize Mesh" defaultChecked />
        <ToggleSetting label="Symmetric" />
      </div>
      <div className="text-[11px] font-medium text-[#e8e8f0]">Connection</div>
      <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6a6a8a]">Colab URL</span>
          <input type="text" placeholder="https://xxx.ngrok.io" className="w-40 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#4a4a6a]" />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[#6a6a8a]">API Key</span>
          <input type="password" placeholder="Optional" className="w-40 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] placeholder-[#4a4a6a]" />
        </div>
        <div className="flex items-center mt-2 text-[9px]">
          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${store.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-[#6a6a8a]">{store.connected ? 'Connected' : 'Disconnected'}</span>
          {!store.connected && <button onClick={store.connectHub} className="ml-2 text-[#4488ff] hover:underline">Connect</button>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: 'bg-yellow-800 text-yellow-300',
    processing: 'bg-blue-800 text-blue-300',
    completed: 'bg-green-800 text-green-300',
    failed: 'bg-red-800 text-red-300',
    cancelled: 'bg-gray-800 text-gray-300',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[8px] ${colors[status] || 'bg-gray-800 text-gray-300'}`}>{status}</span>;
}

function ToggleSetting({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#6a6a8a]">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="accent-[#e94560]" />
    </div>
  );
}
