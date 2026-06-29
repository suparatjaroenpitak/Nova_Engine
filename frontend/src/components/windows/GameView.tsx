import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSceneStore } from '@/stores/sceneStore';
import * as THREE from 'three';

function GameLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <hemisphereLight args={['#87ceeb', '#333', 0.3]} />
    </>
  );
}

function GameObjects() {
  const gameObjects = useSceneStore((s) => s.gameObjects);

  if (gameObjects.length === 0) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e94560" roughness={0.4} metalness={0.6} />
      </mesh>
    );
  }

  return (
    <>
      {gameObjects.map((go) => (
        <mesh
          key={go.id}
          position={[go.transform.px, go.transform.py, go.transform.pz]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4a4a7a" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </>
  );
}

export default function GameView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="h-full w-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 60 }}
        className="bg-black"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <Suspense fallback={null}>
          <GameLighting />
          <GameObjects />
          <OrbitControls />
        </Suspense>
        <fog attach="fog" args={['#0a0a1a', 20, 50]} />
      </Canvas>

      {/* Playback controls */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        <button
          onClick={() => { setIsPlaying(true); setIsPaused(false); }}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isPlaying && !isPaused ? 'bg-nova-accent text-white' : 'bg-nova-surface/80 backdrop-blur text-nova-text hover:bg-nova-hover border border-nova-border'
          }`}
        >
          ▶ Play
        </button>
        <button
          onClick={() => setIsPaused(true)}
          disabled={!isPlaying}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            isPaused ? 'bg-nova-warning text-white' : 'bg-nova-surface/80 backdrop-blur text-nova-text hover:bg-nova-hover border border-nova-border'
          } ${!isPlaying ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          ⏸ Pause
        </button>
        <button
          onClick={() => { setIsPlaying(false); setIsPaused(false); }}
          disabled={!isPlaying}
          className={`px-3 py-1 rounded text-xs font-medium bg-nova-surface/80 backdrop-blur text-nova-text hover:bg-nova-hover border border-nova-border transition-colors ${!isPlaying ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          ⏹ Stop
        </button>
      </div>

      {/* Scene name */}
      <div className="absolute top-2 right-2 text-xs text-nova-muted bg-black/50 backdrop-blur px-2 py-1 rounded border border-nova-border/30">
        Game
      </div>

      {/* Aspect ratio */}
      <div className="absolute bottom-2 right-2 text-xs text-nova-muted bg-black/50 px-2 py-1 rounded">
        Free Aspect
      </div>

      {/* Play mode indicator */}
      {isPlaying && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-nova-warning' : 'bg-nova-success'} ${isPaused ? '' : 'animate-pulse'}`} />
          <span className="text-xs text-nova-muted">{isPaused ? 'PAUSED' : 'PLAYING'}</span>
        </div>
      )}
    </div>
  );
}
