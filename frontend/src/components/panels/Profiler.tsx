import { useState, useEffect } from 'react';

export default function Profiler() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16);
  const [drawCalls, setDrawCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        setFrameTime(Math.round(1000 / frames));
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const metrics = [
    { label: 'FPS', value: fps, max: 60, color: fps >= 55 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500' },
    { label: 'Frame Time', value: `${frameTime}ms`, color: 'bg-blue-500' },
    { label: 'Draw Calls', value: drawCalls, color: 'bg-purple-500' },
    { label: 'Triangles', value: triangles.toLocaleString(), color: 'bg-orange-500' },
  ];

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="bg-nova-bg/50 border border-nova-border rounded p-2">
            <div className="text-xs text-nova-muted mb-1">{m.label}</div>
            <div className="text-lg font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-medium text-nova-muted mb-2">Memory</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-nova-text">
            <span>System Memory</span>
            <span>-- MB</span>
          </div>
          <div className="flex justify-between text-xs text-nova-text">
            <span>GPU Memory</span>
            <span>-- MB</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-medium text-nova-muted mb-2">Audio</h3>
        <div className="text-xs text-nova-text">
          <div className="flex justify-between py-1">
            <span>Playing</span>
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
