import { useState, useRef, useCallback, useMemo } from 'react';

interface TimelineTrack {
  id: string;
  name: string;
  type: 'animation' | 'audio' | 'activation' | 'signal' | 'cinemachine';
  isExpanded: boolean;
  isMuted: boolean;
  isLocked: boolean;
  clips: TimelineClip[];
  color: string;
}

interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  assetId?: string;
  color: string;
  blendInDuration: number;
  blendOutDuration: number;
}

interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  type: 'default' | 'chapter' | 'skip' | 'signal';
}

const TRACK_COLORS = ['#4488ff', '#44cc44', '#ff8844', '#ff44aa', '#44cccc', '#8844ff', '#e94560', '#ffaa00'];

const DEFAULT_CLIPS: TimelineClip[] = [
  { id: 'c1', name: 'Intro Camera', startTime: 0, duration: 3, color: '#4488ff', blendInDuration: 0.3, blendOutDuration: 0.3 },
  { id: 'c2', name: 'Walk Cycle', startTime: 3, duration: 2, color: '#44cc44', blendInDuration: 0.2, blendOutDuration: 0.2 },
  { id: 'c3', name: 'Jump Animation', startTime: 5, duration: 0.8, color: '#ff8844', blendInDuration: 0.1, blendOutDuration: 0.1 },
  { id: 'c4', name: 'Run Cycle', startTime: 6, duration: 2.5, color: '#44cc44', blendInDuration: 0.2, blendOutDuration: 0.3 },
  { id: 'c5', name: 'Dialogue Scene', startTime: 9, duration: 5, color: '#4488ff', blendInDuration: 0.5, blendOutDuration: 0.5 },
];

const DEFAULT_MARKERS: TimelineMarker[] = [
  { id: 'm1', time: 2, label: 'Chapter 1', type: 'chapter' },
  { id: 'm2', time: 5.5, label: 'Jump Point', type: 'signal' },
  { id: 'm3', time: 8, label: 'Chapter 2', type: 'chapter' },
  { id: 'm4', time: 12, label: 'End Scene', type: 'skip' },
];

function TimelineRuler({ duration, zoom, currentTime, onSeek }: { duration: number; zoom: number; currentTime: number; onSeek: (t: number) => void }) {
  const snaps = useMemo(() => {
    const markers: number[] = [];
    const step = zoom < 0.5 ? 2 : zoom < 1 ? 1 : zoom < 2 ? 0.5 : 0.25;
    for (let t = 0; t <= duration; t += step) markers.push(t);
    return markers;
  }, [duration, zoom, currentTime]);

  return (
    <div className="relative h-5 border-b border-[#2a2a4a] bg-[#0f0f25] shrink-0" style={{ width: duration * 80 * zoom + 100 }}>
      {snaps.map((t) => (
        <div key={t} className="absolute top-0 h-full" style={{ left: t * 80 * zoom + 60 }}>
          <div className="absolute top-0 w-px h-2 bg-[#3a3a5a]" />
          <span className="absolute top-2 text-[8px] text-[#6a6a8a]" style={{ transform: 'translateX(-50%)' }}>{t.toFixed(1)}</span>
        </div>
      ))}
      {/* Current time indicator */}
      <div className="absolute top-0 w-0.5 h-full bg-[#e94560] z-10 pointer-events-none" style={{ left: currentTime * 80 * zoom + 60 }}>
        <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-[#e94560] rounded-full" />
      </div>
    </div>
  );
}

function TrackRow({ track, zoom, duration, onClipDrag, selectedClip, onSelectClip }: {
  track: TimelineTrack; zoom: number; duration: number;
  onClipDrag: (clipId: string, newStart: number) => void;
  selectedClip: string | null; onSelectClip: (id: string | null) => void;
}) {
  const trackWidth = duration * 80 * zoom;

  return (
    <div className="flex border-b border-[#2a2a4a] hover:bg-white/[0.02] transition-colors min-h-[32px]">
      {/* Track header */}
      <div className="w-[60px] shrink-0 flex items-center gap-1 px-1.5 border-r border-[#2a2a4a] bg-[#0f0f25]">
        <button onClick={() => {}} className={`text-[8px] ${track.isExpanded ? 'text-[#6a6a8a]' : 'text-[#3a3a5a]'}`}>
          {track.isExpanded ? '▼' : '▶'}
        </button>
        <span className="text-[9px] text-[#e8e8f0] truncate">{track.name}</span>
        <div className="ml-auto flex gap-0.5 opacity-0 hover:opacity-100 transition-opacity">
          <button className="text-[7px] text-[#6a6a8a] hover:text-white">🔇</button>
          <button className="text-[7px] text-[#6a6a8a] hover:text-white">🔒</button>
        </div>
      </div>

      {/* Track content */}
      <div className="flex-1 relative" style={{ width: trackWidth, minHeight: 32 }}>
        {track.clips.map((clip) => {
          const left = clip.startTime * 80 * zoom + 1;
          const width = clip.duration * 80 * zoom - 2;

          return (
            <div
              key={clip.id}
              onClick={() => onSelectClip(selectedClip === clip.id ? null : clip.id)}
              className={`absolute top-0.5 h-7 rounded flex items-center px-2 cursor-pointer transition-all group ${
                selectedClip === clip.id ? 'ring-2 ring-white shadow-lg' : ''
              }`}
              style={{
                left, width: Math.max(width, 10),
                backgroundColor: clip.color + '33',
                borderLeft: `3px solid ${clip.color}`,
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', clip.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const newLeft = e.clientX - rect.left;
                  const newStart = Math.max(0, (newLeft - 1) / (80 * zoom));
                  onClipDrag(clip.id, newStart);
                }
              }}
            >
              <span className="text-[9px] text-white truncate">{clip.name}</span>
              <span className="text-[7px] text-white/50 ml-auto hidden group-hover:block">{clip.duration.toFixed(1)}s</span>
              {clip.blendInDuration > 0 && (
                <div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{ width: `${(clip.blendInDuration / clip.duration) * 100}%` }} />
              )}
              {clip.blendOutDuration > 0 && (
                <div className="absolute right-0 top-0 bottom-0 bg-white/10" style={{ width: `${(clip.blendOutDuration / clip.duration) * 100}%` }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimelinePanel() {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    { id: 't1', name: 'Camera', type: 'cinemachine', isExpanded: true, isMuted: false, isLocked: false, clips: DEFAULT_CLIPS.filter((_, i) => i === 0 || i === 4), color: '#4488ff' },
    { id: 't2', name: 'Player Animation', type: 'animation', isExpanded: true, isMuted: false, isLocked: false, clips: DEFAULT_CLIPS.filter((_, i) => i >= 1 && i <= 3), color: '#44cc44' },
    { id: 't3', name: 'Audio', type: 'audio', isExpanded: false, isMuted: false, isLocked: false, clips: [], color: '#ffaa00' },
    { id: 't4', name: 'Signals', type: 'signal', isExpanded: true, isMuted: false, isLocked: false, clips: [], color: '#8844ff' },
  ]);

  const [duration] = useState(15);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [markers] = useState<TimelineMarker[]>(DEFAULT_MARKERS);
  const [previewMode, setPreviewMode] = useState(false);
  const playRef = useRef<number | null>(null);

  const handleClipDrag = useCallback((clipId: string, newStart: number) => {
    setTracks((prev) => prev.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => clip.id === clipId ? { ...clip, startTime: Math.max(0, newStart) } : clip),
    })));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playRef.current) cancelAnimationFrame(playRef.current);
    } else {
      setIsPlaying(true);
      const startTime = currentTime;
      const startTimestamp = performance.now();

      const tick = (timestamp: number) => {
        const elapsed = (timestamp - startTimestamp) / 1000;
        const newTime = startTime + elapsed;
        if (newTime >= duration) {
          setCurrentTime(0);
          setIsPlaying(false);
          return;
        }
        setCurrentTime(newTime);
        playRef.current = requestAnimationFrame(tick);
      };
      playRef.current = requestAnimationFrame(tick);
    }
  }, [isPlaying, currentTime, duration]);

  const currentClip = tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClip);

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-1 shrink-0">
        <button onClick={togglePlay} className={`px-2 py-0.5 rounded text-[10px] font-medium ${isPlaying ? 'bg-[#e94560] text-white' : 'bg-[#0a0a1a] text-[#6a6a8a] hover:text-white border border-[#2a2a4a]'}`}>
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
        <button className="px-1.5 py-0.5 rounded text-[10px] text-[#6a6a8a] hover:text-white">⏮</button>
        <button className="px-1.5 py-0.5 rounded text-[10px] text-[#6a6a8a] hover:text-white">⏭</button>
        <button onClick={() => setCurrentTime(0)} className="px-1.5 py-0.5 rounded text-[10px] text-[#6a6a8a] hover:text-white">⏪</button>

        <div className="flex-1" />

        <span className="text-[9px] text-[#6a6a8a] font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>

        <div className="w-px h-4 bg-[#2a2a4a] mx-1" />

        <button onClick={() => setSnapEnabled(!snapEnabled)} className={`px-1.5 py-0.5 rounded text-[9px] ${snapEnabled ? 'text-[#e94560]' : 'text-[#6a6a8a]'}`}>Snap</button>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="px-1 py-0.5 rounded text-[9px] text-[#6a6a8a] hover:text-white">−</button>
        <span className="text-[9px] text-[#6a6a8a] w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
        <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="px-1 py-0.5 rounded text-[9px] text-[#6a6a8a] hover:text-white">+</button>

        <div className="w-px h-4 bg-[#2a2a4a] mx-1" />

        <button onClick={() => setPreviewMode(!previewMode)} className={`px-1.5 py-0.5 rounded text-[9px] ${previewMode ? 'bg-[#4488ff] text-white' : 'text-[#6a6a8a]'}`}>Preview</button>
        <button className="px-1.5 py-0.5 rounded text-[9px] text-[#6a6a8a] hover:text-white">+ Track</button>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track headers */}
        <div className="w-[60px] shrink-0 border-r border-[#2a2a4a] bg-[#0f0f25]">
          <div className="h-5 border-b border-[#2a2a4a]" /> {/* Ruler spacer */}
          {tracks.map((track) => (
            <div key={track.id} className="h-8 border-b border-[#2a2a4a] flex items-center justify-center">
              <span className="text-[7px] text-[#3a3a5a] font-medium">{TRACK_COLORS[tracks.indexOf(track)] === track.color ? '●' : '○'}</span>
            </div>
          ))}
        </div>

        {/* Timeline content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex flex-col" style={{ minWidth: duration * 80 * zoom + 60 }}>
            <TimelineRuler duration={duration} zoom={zoom} currentTime={currentTime} onSeek={setCurrentTime} />

            {/* Markers */}
            <div className="relative h-4 border-b border-[#2a2a4a] bg-[#0f0f25] shrink-0">
              {markers.map((marker) => (
                <div key={marker.id} className="absolute top-0" style={{ left: marker.time * 80 * zoom + 60 }}>
                  <div className={`w-0.5 h-4 ${marker.type === 'chapter' ? 'bg-[#ffaa00]' : marker.type === 'signal' ? 'bg-[#8844ff]' : 'bg-[#3a3a5a]'}`} />
                  <span className="absolute top-0.5 left-1 text-[7px] whitespace-nowrap text-[#6a6a8a]">{marker.label}</span>
                </div>
              ))}
            </div>

            {/* Tracks */}
            <div className="flex-1">
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  zoom={zoom}
                  duration={duration}
                  onClipDrag={handleClipDrag}
                  selectedClip={selectedClip}
                  onSelectClip={setSelectedClip}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clip details panel */}
      {currentClip && (
        <div className="h-20 border-t border-[#2a2a4a] bg-[#0f0f25] p-2 shrink-0">
          <div className="flex items-center gap-4 text-[10px]">
            <div>
              <span className="text-[#6a6a8a]">Clip: </span>
              <span className="text-[#e8e8f0] font-medium">{currentClip.name}</span>
            </div>
            <div>
              <span className="text-[#6a6a8a]">Start: </span>
              <input type="number" value={currentClip.startTime} className="w-16 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
            </div>
            <div>
              <span className="text-[#6a6a8a]">Duration: </span>
              <input type="number" value={currentClip.duration} className="w-16 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6a6a8a]">Blend In:</span>
              <input type="number" value={currentClip.blendInDuration} className="w-14 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#6a6a8a]">Blend Out:</span>
              <input type="number" value={currentClip.blendOutDuration} className="w-14 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0]" step="0.1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
}
