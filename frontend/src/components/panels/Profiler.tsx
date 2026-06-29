import { useEffect, useState, useRef } from 'react';

type FrameSample = { time: number; fps: number; frameTime: number };

export default function Profiler() {
  const [samples, setSamples] = useState<FrameSample[]>([]);
  const [peakFps, setPeakFps] = useState(0);
  const [lowFps, setLowFps] = useState(Infinity);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const record = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const fps = delta > 0 ? Math.round(1000 / delta) : 0;

      setSamples((prev) => {
        const next = [...prev, { time: now, fps, frameTime: delta }];
        if (next.length > 120) next.shift();
        return next;
      });
      setPeakFps((prev) => Math.max(prev, fps));
      setLowFps((prev) => Math.min(prev, fps > 0 ? fps : prev));

      frameRef.current++;
      rafRef.current = requestAnimationFrame(record);
    };

    rafRef.current = requestAnimationFrame(record);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const currentFps = samples.length > 0 ? samples[samples.length - 1].fps : 0;
  const avgFps = samples.length > 0 ? Math.round(samples.reduce((a, s) => a + s.fps, 0) / samples.length) : 0;
  const avgFrameTime = samples.length > 0 ? (samples.reduce((a, s) => a + s.frameTime, 0) / samples.length).toFixed(1) : '0';
  const fpsColor = currentFps >= 55 ? 'text-nova-success' : currentFps >= 30 ? 'text-nova-warning' : 'text-nova-error';

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || samples.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxFps = Math.max(60, ...samples.map((s) => s.fps));
    const stepX = w / Math.max(samples.length - 1, 1);

    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = i * stepX;
      const y = h - (s.fps / maxFps) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = i * stepX;
      const y = h - (s.fps / maxFps) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(233, 69, 96, 0.2)');
    grad.addColorStop(1, 'rgba(233, 69, 96, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }, [samples]);

  const metrics = [
    { label: 'FPS', value: currentFps.toString(), color: fpsColor },
    { label: 'Avg FPS', value: avgFps.toString(), color: 'text-nova-text' },
    { label: 'Frame Time', value: `${avgFrameTime}ms`, color: 'text-nova-text' },
    { label: 'Peak FPS', value: peakFps.toString(), color: 'text-nova-success' },
    { label: 'Low FPS', value: lowFps === Infinity ? '-' : lowFps.toString(), color: 'text-nova-warning' },
    { label: 'Draw Calls', value: '0', color: 'text-nova-muted' },
    { label: 'Triangles', value: '0', color: 'text-nova-muted' },
    { label: 'Memory', value: `${(performance as any).memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : '-'} MB`, color: 'text-nova-muted' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center h-7 px-2 bg-nova-surface2/50 border-b border-nova-border shrink-0">
        <span className="text-xs font-medium text-nova-muted uppercase tracking-wider">Profiler</span>
        <span className={`ml-2 text-xs font-mono font-bold ${fpsColor}`}>{currentFps} FPS</span>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Chart */}
        <div className="flex-1 p-2">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="w-full h-full rounded border border-nova-border bg-nova-bg/50"
          />
        </div>
        {/* Metrics */}
        <div className="w-48 p-2 border-l border-nova-border overflow-y-auto">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between py-1">
              <span className="text-xs text-nova-muted">{m.label}</span>
              <span className={`text-xs font-mono font-medium ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
