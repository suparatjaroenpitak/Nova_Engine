import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function GameView() {
  return (
    <div className="h-full w-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 60 }}
        className="bg-black"
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbitControls />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e94560" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </Canvas>

      {/* Game view overlay */}
      <div className="absolute top-2 left-2 flex gap-1">
        <button className="px-3 py-1 bg-nova-accent text-white text-xs rounded">▶ Play</button>
        <button className="px-3 py-1 bg-nova-surface/80 text-nova-text text-xs rounded">⏸ Pause</button>
        <button className="px-3 py-1 bg-nova-surface/80 text-nova-text text-xs rounded">⏹ Stop</button>
      </div>

      {/* Resolution indicator */}
      <div className="absolute bottom-2 right-2 text-xs text-nova-muted bg-black/50 px-2 py-1 rounded">
        1920 × 1080
      </div>
    </div>
  );
}
