import { useState } from 'react';

export default function AnimationPanel() {
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const clips = ['Idle', 'Walk', 'Run', 'Jump', 'Attack'];

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-3 py-1 text-xs rounded ${isPlaying ? 'bg-nova-accent text-white' : 'bg-nova-hover text-nova-text'}`}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="px-3 py-1 text-xs bg-nova-hover text-nova-text rounded">⏹</button>
        <div className="flex-1" />
        <span className="text-xs text-nova-muted">Frame: {currentFrame}</span>
      </div>

      <div className="flex-1 flex gap-2">
        <div className="w-48 border border-nova-border rounded overflow-hidden">
          <div className="px-2 py-1 bg-nova-surface2/50 text-xs font-medium text-nova-muted uppercase">
            Animation Clips
          </div>
          {clips.map((clip) => (
            <div
              key={clip}
              onClick={() => setSelectedClip(clip)}
              className={`px-2 py-1.5 text-xs cursor-pointer ${
                selectedClip === clip ? 'bg-nova-accent/30 text-white' : 'text-nova-text hover:bg-nova-hover'
              }`}
            >
              {clip}
            </div>
          ))}
        </div>

        <div className="flex-1 border border-nova-border rounded flex items-center justify-center">
          <div className="text-center text-nova-muted text-xs">
            <p>Animation Curve Editor</p>
            <p className="mt-1 text-nova-muted opacity-70">Select a clip to edit curves</p>
          </div>
        </div>
      </div>
    </div>
  );
}
