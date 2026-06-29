import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, PivotControls } from '@react-three/drei';
import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';
import * as THREE from 'three';

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-10, -5, -5]} intensity={0.3} />
      <hemisphereLight args={['#87ceeb', '#333', 0.4]} />
    </>
  );
}

function SceneObject({
  id,
  transform: t,
  isSelected,
  onSelect,
  onRef,
}: {
  id: string;
  transform: { px: number; py: number; pz: number; rx: number; ry: number; rz: number; rw: number; sx: number; sy: number; sz: number };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRef: (mesh: THREE.Mesh | null) => void;
}) {
  const localRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    onRef(localRef.current);
    return () => onRef(null);
  }, [isSelected]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <mesh
      ref={localRef}
      position={[t.px, t.py, t.pz]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={isSelected ? '#e94560' : '#4a4a7a'}
        roughness={0.4}
        metalness={0.6}
        emissive={isSelected ? new THREE.Color('#e94560') : new THREE.Color('#000000')}
        emissiveIntensity={isSelected ? 0.15 : 0}
      />
    </mesh>
  );
}

function SceneContent() {
  const { gameObjects, selectedGameObject, selectGameObject, clearSelection } = useSceneStore();
  const { gizmoMode, gizmoSpace, gridVisible, snapping, snapSize } = useUiStore();
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const { camera, gl } = useThree();

  const setSelectedRef = (id: string) => (mesh: THREE.Mesh | null) => {
    if (id === selectedGameObject?.id) {
      selectedRef.current = mesh;
    }
  };

  return (
    <>
      <SceneLighting />
      {gridVisible && (
        <Grid
          args={[30, 30]}
          sectionColor="#4a4a7a"
          cellColor="#2a2a4a"
          sectionSize={5}
          cellSize={1}
          fadeDistance={50}
        />
      )}
      <OrbitControls makeDefault enableDamping={false} />

      {gameObjects.map((go) => (
        <SceneObject
          key={go.id}
          id={go.id}
          transform={go.transform}
          isSelected={selectedGameObject?.id === go.id}
          onSelect={(id) => selectGameObject(id)}
          onRef={setSelectedRef(go.id)}
        />
      ))}

      {selectedGameObject && selectedRef.current && (
        <TransformControls
          mode={gizmoMode}
          space={gizmoSpace}
          object={selectedRef.current}
          showX
          showY
          showZ
          size={0.5}
          translationSnap={snapping ? snapSize : null}
          rotationSnap={snapping ? THREE.MathUtils.degToRad(15) : null}
          scaleSnap={snapping ? 0.1 : null}
        />
      )}

      <fog attach="fog" args={['#0a0a1a', 25, 60]} />
    </>
  );
}

export default function SceneView() {
  const { gizmoMode, gizmoSpace, gridVisible, snapping, snapSize } = useUiStore();
  const selectGameObject = useSceneStore((s) => s.selectGameObject);
  const clearSelection = useSceneStore((s) => s.clearSelection);

  return (
    <div className="h-full w-full relative">
      <Canvas
        shadows
        camera={{ position: [6, 5, 6], fov: 55, far: 100 }}
        className="bg-[#0a0a1a]"
        onPointerMissed={() => clearSelection()}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      <div className="absolute top-2 left-2 flex gap-1 z-10">
        <button className="px-2 py-1 bg-nova-surface/80 backdrop-blur border border-nova-border rounded text-xs text-nova-text hover:bg-nova-hover transition-colors">
          2D
        </button>
        <button className="px-2 py-1 bg-nova-accent/80 backdrop-blur border border-nova-accent rounded text-xs text-white font-medium">
          3D
        </button>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 z-10 text-xs text-nova-muted bg-nova-surface/60 backdrop-blur px-2 py-1 rounded border border-nova-border">
        <span className={gizmoMode === 'translate' ? 'text-nova-accent' : ''}>Q</span>
        <span className="mx-1">|</span>
        <span className={gizmoMode === 'rotate' ? 'text-nova-accent' : ''}>W</span>
        <span className="mx-1">|</span>
        <span className={gizmoMode === 'scale' ? 'text-nova-accent' : ''}>E</span>
      </div>

      <div className="absolute bottom-2 right-2 w-24 h-24 bg-nova-surface/60 backdrop-blur rounded-lg border border-nova-border overflow-hidden">
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
