import { useState } from 'react';

export default function TimelinePanel() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const totalFrames = 120;

  const tracks = [
    { name: 'Main Camera', type: 'Camera' },
    { name: 'Directional Light', type: 'Light' },
    { name: 'Cube', type: 'Transform' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-nova-border">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-2 py-0.5 text-xs bg-nova-hover text-nova-text rounded"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="px-2 py-0.5 text-xs bg-nova-hover text-nova-text rounded">⏹</button>
        <span className="text-xs text-nova-muted">{currentTime.toFixed(1)}s</span>
        <div className="flex-1" />
        <button className="px-2 py-0.5 text-xs text-nova-muted hover:text-nova-text">Add Track</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-40 border-r border-nova-border overflow-hidden">
          {tracks.map((track) => (
            <div key={track.name} className="h-8 px-2 flex items-center border-b border-nova-border/50">
              <span className="text-xs text-nova-text">{track.name}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: `${totalFrames * 8}px`, height: `${tracks.length * 32}px` }}>
            {Array.from({ length: totalFrames }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-nova-border/30"
                style={{ left: `${i * 8}px` }}
              />
            ))}
            {tracks.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-b border-nova-border/50"
                style={{ top: `${i * 32}px`, height: '32px' }}
              />
            ))}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-nova-accent z-10"
              style={{ left: `${currentTime * 8}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
