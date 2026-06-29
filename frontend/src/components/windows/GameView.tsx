import { Suspense, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useUiStore } from '@/stores/uiStore';
import { useSceneStore } from '@/stores/sceneStore';
import * as THREE from 'three';

function GameScene() {
  const { gameObjects } = useSceneStore();
  const { camera } = useThree();

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {gameObjects.map((go) => {
        const t = go.transform;
        return (
          <mesh key={go.id} position={[t.px, t.py, t.pz]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4a4a7a" />
          </mesh>
        );
      })}
    </>
  );
}

export default function GameView() {
  const { isPlaying, isPaused, startPlaying, stopPlaying, pausePlaying } = useUiStore();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a1a]">
      {/* Toolbar */}
      <div className="flex items-center h-8 px-2 bg-[#12122a] border-b border-[#2a2a4a] gap-1 shrink-0">
        <button
          onClick={startPlaying}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isPlaying && !isPaused
              ? 'bg-green-500 text-white'
              : 'bg-[#1a1a35] text-[#6a6a8a] hover:text-white border border-[#2a2a4a]'
          }`}
        >
          ▶ Play
        </button>
        <button
          onClick={pausePlaying}
          disabled={!isPlaying}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isPaused
              ? 'bg-yellow-500 text-white'
              : 'bg-[#1a1a35] text-[#6a6a8a] hover:text-white border border-[#2a2a4a] disabled:opacity-50'
          }`}
        >
          ⏸ Pause
        </button>
        <button
          onClick={stopPlaying}
          disabled={!isPlaying}
          className="px-3 py-1 rounded text-xs font-medium bg-[#1a1a35] text-[#6a6a8a] hover:text-white border border-[#2a2a4a] disabled:opacity-50"
        >
          ⏹ Stop
        </button>

        <div className="flex-1" />

        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Playing</span>
          </div>
        )}

        <div className="text-[10px] text-[#6a6a8a] px-2">
          {isPaused ? 'PAUSED' : isPlaying ? `${60} FPS` : 'Stopped'}
        </div>
      </div>

      {/* Viewport */}
      <div ref={containerRef} className="flex-1 relative">
        <Canvas
          camera={{ position: [6, 5, 6], fov: 60 }}
          className="bg-[#0a0a1a]"
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <Suspense fallback={null}>
            <GameScene />
            <OrbitControls makeDefault />
          </Suspense>
        </Canvas>

        {/* Resolution overlay */}
        <div className="absolute top-2 right-2 text-[10px] text-[#6a6a8a] bg-[#12122a]/60 backdrop-blur px-2 py-0.5 rounded border border-[#2a2a4a]">
          Game | 1920x1080
        </div>
      </div>
    </div>
  );
}
