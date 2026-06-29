import { useState, useEffect, useRef, useMemo } from 'react';
import { useUiStore } from '@/stores/uiStore';
import type { ProfilerSnapshot } from '@/types';

function ProfilerChart({ data, color, label, maxValue, unit }: {
  data: ProfilerSnapshot[];
  color: string;
  label: string;
  maxValue: number;
  unit: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentValue = data.length > 0 ? data[data.length - 1] : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.4)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(42, 42, 74, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (data.length < 2) return;

    // Data line
    const values = data.slice(-100);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 2;

    values.forEach((point, i) => {
      const x = (i / (values.length - 1)) * w;
      const val = (point as any).fps || 0;
      const y = h - (Math.min(val, maxValue) / maxValue) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    const lastPoint = values[values.length - 1];
    ctx.lineTo(w, h);
    ctx.lineTo((values.length - 2) / (values.length - 1) * w, h);
    ctx.fillStyle = color + '15';
    ctx.fill();
  }, [data, color, maxValue]);

  const val = currentValue ? ((currentValue as any).fps || (currentValue as any).cpu || 0) : 0;

  return (
    <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#6a6a8a] font-medium">{label}</span>
        <span className="text-xs font-bold font-mono" style={{ color }}>
          {typeof val === 'number' ? val.toFixed(1) : '0.0'}
          <span className="text-[9px] text-[#6a6a8a] ml-0.5">{unit}</span>
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-12 rounded" />
    </div>
  );
}

export default function Profiler() {
  const { profilerData, addProfilerSnapshot } = useUiStore();
  const [recording, setRecording] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('CPU');

  // Simulate profiler data
  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => {
      addProfilerSnapshot({
        frame: profilerData.length,
        fps: 55 + Math.random() * 10,
        cpu: 25 + Math.random() * 30,
        gpu: 30 + Math.random() * 25,
        ram: 512 + Math.random() * 256,
        drawCalls: 80 + Math.floor(Math.random() * 40),
        triangles: 15000 + Math.floor(Math.random() * 10000),
        batches: 200 + Math.floor(Math.random() * 80),
        shaderTime: 2 + Math.random() * 3,
        gcAlloc: Math.random() * 5,
      });
    }, 200);
    return () => clearInterval(interval);
  }, [recording, profilerData.length]);

  const modules = [
    { id: 'CPU', icon: '⚡', label: 'CPU Usage', color: '#44cc44' },
    { id: 'GPU', icon: '🎮', label: 'GPU Usage', color: '#4488ff' },
    { id: 'Rendering', icon: '◆', label: 'Rendering', color: '#ff8844' },
    { id: 'Memory', icon: '💾', label: 'Memory', color: '#ff44aa' },
  ];

  const currentData = profilerData[profilerData.length - 1] || null;

  const getModuleValue = (module: string): number => {
    if (!currentData) return 0;
    switch (module) {
      case 'CPU': return currentData.cpu;
      case 'GPU': return currentData.gpu;
      case 'Rendering': return currentData.drawCalls;
      case 'Memory': return currentData.ram;
      default: return 0;
    }
  };

  const getModuleUnit = (module: string): string => {
    switch (module) {
      case 'CPU': return '%';
      case 'GPU': return '%';
      case 'Rendering': return ' draw calls';
      case 'Memory': return ' MB';
      default: return '';
    }
  };

  const getModuleMax = (module: string): number => {
    switch (module) {
      case 'CPU': return 100;
      case 'GPU': return 100;
      case 'Rendering': return 300;
      case 'Memory': return 2048;
      default: return 100;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#12122a] border-b border-[#2a2a4a] gap-1 shrink-0">
        <button
          onClick={() => setRecording(!recording)}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
            recording ? 'bg-red-500 text-white' : 'bg-[#1a1a35] text-[#6a6a8a]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${recording ? 'bg-white animate-pulse' : 'bg-[#6a6a8a]'}`} />
          {recording ? 'Recording' : 'Paused'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => useUiStore.getState().clearProfiler()}
          className="px-1.5 py-0.5 rounded text-[10px] text-[#6a6a8a] hover:text-white"
        >
          Clear
        </button>
      </div>

      {/* Module selector */}
      <div className="flex items-center h-7 px-2 gap-0.5 bg-[#0f0f25] border-b border-[#2a2a4a]">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setSelectedModule(mod.id)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              selectedModule === mod.id ? 'bg-[#1a1a35] text-white' : 'text-[#6a6a8a] hover:text-white'
            }`}
          >
            {mod.icon} {mod.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {modules.map((mod) => (
          <ProfilerChart
            key={mod.id}
            data={profilerData}
            color={mod.color}
            label={mod.label}
            maxValue={getModuleMax(mod.id)}
            unit={getModuleUnit(mod.id)}
          />
        ))}

        {/* Detailed stats */}
        <div className="bg-[#0f0f25] border border-[#2a2a4a] rounded p-2">
          <div className="text-[10px] font-medium text-[#6a6a8a] mb-1.5">Details</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
            {currentData && (
              <>
                <StatRow label="Frame" value={currentData.frame.toString()} />
                <StatRow label="Triangles" value={currentData.triangles.toLocaleString()} color="#4488ff" />
                <StatRow label="Draw Calls" value={currentData.drawCalls.toString()} color="#ff8844" />
                <StatRow label="Batches" value={currentData.batches.toString()} color="#44cc44" />
                <StatRow label="Shader Time" value={`${currentData.shaderTime.toFixed(2)}ms`} color="#ff44aa" />
                <StatRow label="GC Alloc" value={`${currentData.gcAlloc.toFixed(1)}MB`} color="#ff4444" />
                <StatRow label="RAM" value={`${(currentData.ram / 1024).toFixed(1)}GB`} color="#44cc44" />
                <StatRow label="FPS" value={currentData.fps.toFixed(1)} color="#44cc44" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[#6a6a8a]">{label}</span>
      <span style={{ color: color || '#e8e8f0' }}>{value}</span>
    </div>
  );
}
