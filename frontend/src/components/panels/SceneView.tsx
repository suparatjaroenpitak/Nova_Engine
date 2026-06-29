import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';
import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';
import * as THREE from 'three';

function SceneObject({ id, position, color = '#e94560' }: { id: string; position: [number, number, number]; color?: string }) {
  const { selectedIds, selectGameObject } = useSceneStore();
  const isSelected = selectedIds.includes(id);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); selectGameObject(id); }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={isSelected ? '#e94560' : color} />
    </mesh>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <hemisphereLight args={['#87ceeb', '#444', 0.3]} />
    </>
  );
}

export default function SceneView() {
  const { gameObjects, selectedGameObject } = useSceneStore();
  const { gizmoMode, gizmoSpace, gridVisible, snapping, snapSize } = useUiStore();

  return (
    <div className="h-full w-full relative">
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 60 }}
        className="bg-nova-bg"
        onPointerMissed={() => useSceneStore.getState().clearSelection()}
      >
        <Suspense fallback={null}>
          <SceneLighting />
          {gridVisible && <Grid args={[20, 20]} />}
          <OrbitControls makeDefault />

          {gameObjects.map((go, i) => (
            <SceneObject
              key={go.id}
              id={go.id}
              position={[go.transform.px, go.transform.py, go.transform.pz]}
            />
          ))}

          {selectedGameObject && (
            <TransformControls
              mode={gizmoMode}
              space={gizmoSpace}
              // @ts-ignore
              object={null}
            />
          )}
        </Suspense>
        <fog attach="fog" args={['#1a1a2e', 30, 80]} />
      </Canvas>

      {/* Scene view overlay controls */}
      <div className="absolute top-2 left-2 flex gap-1">
        <button className="px-2 py-1 bg-nova-surface/80 border border-nova-border rounded text-xs text-nova-text hover:bg-nova-hover">
          2D
        </button>
        <button className="px-2 py-1 bg-nova-surface/80 border border-nova-border rounded text-xs text-nova-text hover:bg-nova-hover">
          3D
        </button>
      </div>

      {/* Scene gizmo */}
      <div className="absolute bottom-2 right-2 w-24 h-24 bg-nova-surface/50 rounded border border-nova-border">
        <Canvas camera={{ position: [3, 2, 3], fov: 30 }} gl={{ alpha: true }}>
          <SceneLighting />
          <OrbitControls enableZoom={false} enablePan={false} />
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#e94560" />
          </mesh>
        </Canvas>
      </div>
    </div>
  );
}
