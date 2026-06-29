import { Suspense, useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, PivotControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';
import { useThemeStore } from '@/stores/themeStore';
import * as THREE from 'three';

// --- Scene Lighting ---
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

// --- Material helpers ---
function getMaterialForObject(go: any) {
  const matComp = go.components?.find((c: any) => c.kind === 'MeshRenderer');
  if (matComp) {
    try {
      const props = JSON.parse(matComp.propertiesJson);
      return {
        color: props.color || '#4a4a7a',
        roughness: props.roughness ?? 0.4,
        metalness: props.metalness ?? 0.6,
      };
    } catch {}
  }
  return { color: '#4a4a7a', roughness: 0.4, metalness: 0.6 };
}

function getGeometryForObject(go: any) {
  const filter = go.components?.find((c: any) => c.kind === 'MeshFilter');
  if (filter) {
    try {
      const props = JSON.parse(filter.propertiesJson);
      const type = props.meshType || 'box';
      const args = props.args || [1, 1, 1];
      switch (type) {
        case 'box': return <boxGeometry args={args} />;
        case 'sphere': return <sphereGeometry args={args} />;
        case 'capsule': return <capsuleGeometry args={args} />;
        case 'cylinder': return <cylinderGeometry args={args} />;
        case 'plane': return <planeGeometry args={args} />;
        case 'torus': return <torusGeometry args={args} />;
        case 'cone': return <coneGeometry args={args} />;
        default: return <boxGeometry args={[1, 1, 1]} />;
      }
    } catch {}
  }
  return <boxGeometry args={[1, 1, 1]} />;
}

function getLightProps(go: any) {
  const light = go.components?.find((c: any) => c.kind === 'Light');
  if (light) {
    try {
      return JSON.parse(light.propertiesJson);
    } catch {}
  }
  return null;
}

function getCameraProps(go: any) {
  const cam = go.components?.find((c: any) => c.kind === 'Camera');
  if (cam) {
    try {
      return JSON.parse(cam.propertiesJson);
    } catch {}
  }
  return null;
}

// --- Scene Object renderer ---
function SceneObject({
  id,
  gameObject,
  isSelected,
  onSelect,
  onRef,
}: {
  id: string;
  gameObject: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRef: (mesh: THREE.Mesh | null) => void;
}) {
  const localRef = useRef<THREE.Mesh>(null);
  const t = gameObject.transform;
  const mat = getMaterialForObject(gameObject);
  const lightProps = getLightProps(gameObject);
  const cameraProps = getCameraProps(gameObject);

  useEffect(() => {
    onRef(localRef.current);
    return () => onRef(null);
  }, [isSelected]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.shiftKey) {
      useSceneStore.getState().addSelection(id);
    } else {
      onSelect(id);
    }
  };

  // Render light gizmo for light objects
  if (lightProps) {
    const lightColor = lightProps.color || '#ffffff';
    const intensity = lightProps.intensity ?? 1;
    const lightType = lightProps.type || 'directional';

    return (
      <group position={[t.px, t.py, t.pz]} rotation={new THREE.Euler(t.rx, t.ry, t.rz)}>
        {lightType === 'directional' && <directionalLight color={lightColor} intensity={intensity} castShadow />}
        {lightType === 'point' && <pointLight color={lightColor} intensity={intensity} distance={lightProps.range || 10} />}
        {lightType === 'spot' && <spotLight color={lightColor} intensity={intensity} angle={lightProps.angle || Math.PI / 4} penumbra={0.5} castShadow />}
        {lightType === 'area' && <rectAreaLight color={lightColor} intensity={intensity} width={lightProps.width || 2} height={lightProps.height || 2} />}
        <mesh onClick={handleClick}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={lightColor} transparent opacity={0.6} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh
      ref={localRef}
      position={[t.px, t.py, t.pz]}
      rotation={new THREE.Euler(t.rx, t.ry, t.rz, 'XYZ')}
      scale={[t.sx, t.sy, t.sz]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      {getGeometryForObject(gameObject)}
      <meshStandardMaterial
        color={isSelected ? '#e94560' : mat.color}
        roughness={mat.roughness}
        metalness={mat.metalness}
        emissive={isSelected ? new THREE.Color('#e94560') : new THREE.Color('#000000')}
        emissiveIntensity={isSelected ? 0.15 : 0}
      />
    </mesh>
  );
}

// --- Selection Box helper ---
function SelectionBox({ object }: { object: THREE.Mesh | null }) {
  const [box, setBox] = useState<THREE.Box3 | null>(null);

  useEffect(() => {
    if (object) {
      const b = new THREE.Box3().setFromObject(object);
      setBox(b);
    } else {
      setBox(null);
    }
  }, [object]);

  if (!box) return null;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  return (
    <lineSegments position={center}>
      <edgesGeometry args={[new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05)]} />
      <lineBasicMaterial color="#e94560" transparent opacity={0.8} />
    </lineSegments>
  );
}

// --- Scene Content ---
function SceneContent() {
  const { gameObjects, selectedGameObject, selectGameObject, clearSelection } = useSceneStore();
  const { gizmoMode, gizmoSpace, gridVisible, snapping, snapSize, showGrid, gridSize } = useUiStore();
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const { camera, gl } = useThree();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [bookmarks, setBookmarks] = useState<{ id: string; name: string; pos: THREE.Vector3; target: THREE.Vector3 }[]>([]);

  const setSelectedRef = useCallback((id: string) => (mesh: THREE.Mesh | null) => {
    if (id === selectedGameObject?.id) {
      selectedRef.current = mesh;
    }
  }, [selectedGameObject?.id]);

  const handleSceneClick = (e: any) => {
    if (e.target === e.eventObject) {
      clearSelection();
    }
  };

  return (
    <>
      <SceneLighting />

      {/* Infinite Grid */}
      {gridVisible && (
        <Grid
          args={[gridSize || 30, gridSize || 30]}
          sectionColor="#4a4a7a"
          cellColor="#2a2a4a"
          sectionSize={5}
          cellSize={1}
          fadeDistance={50}
          infiniteGrid
        />
      )}

      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[80, 32, 32]} />
        <meshBasicMaterial color="#0a0a1a" side={THREE.BackSide} />
      </mesh>

      {/* Fog */}
      <fog attach="fog" args={['#0a0a1a', 25, 60]} />

      <OrbitControls
        makeDefault
        enableDamping={false}
      />

      {/* Render all game objects */}
      {gameObjects.map((go) => (
        <SceneObject
          key={go.id}
          id={go.id}
          gameObject={go}
          isSelected={selectedGameObject?.id === go.id}
          onSelect={(id) => selectGameObject(id)}
          onRef={setSelectedRef(go.id)}
        />
      ))}

      {/* Transform Gizmo */}
      {selectedGameObject && selectedRef.current && (
        <>
          <TransformControls
            mode={gizmoMode === 'rect' ? 'translate' : gizmoMode}
            space={gizmoSpace === 'world' ? 'world' : 'local'}
            object={selectedRef.current}
            showX
            showY
            showZ
            size={0.6}
            translationSnap={snapping ? (snapSize || 0.5) : null}
            rotationSnap={snapping ? THREE.MathUtils.degToRad(15) : null}
            scaleSnap={snapping ? 0.1 : null}
          />
          <SelectionBox object={selectedRef.current} />
        </>
      )}

      {/* Scene Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[70, 70] as any}>
        <GizmoViewport
          axisColors={['#ff4444', '#44ff44', '#4444ff']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

// --- Main Scene View ---
export default function SceneView() {
  const { gizmoMode, gizmoSpace, gridVisible, snapping, snapSize } = useUiStore();
  const selectGameObject = useSceneStore((s) => s.selectGameObject);
  const clearSelection = useSceneStore((s) => s.clearSelection);
  const [viewIndex, setViewIndex] = useState(0);
  const views = ['3D', '2D', 'Top', 'Bottom', 'Left', 'Right', 'Front', 'Back'];

  const cameraPositions: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
    '3D': { pos: [6, 5, 6], target: [0, 0, 0] },
    '2D': { pos: [0, 10, 0], target: [0, 0, 0] },
    'Top': { pos: [0, 10, 0], target: [0, 0, 0] },
    'Bottom': { pos: [0, -10, 0], target: [0, 0, 0] },
    'Left': { pos: [-10, 0, 0], target: [0, 0, 0] },
    'Right': { pos: [10, 0, 0], target: [0, 0, 0] },
    'Front': { pos: [0, 0, 10], target: [0, 0, 0] },
    'Back': { pos: [0, 0, -10], target: [0, 0, 0] },
  };

  const currentView = views[viewIndex];
  const camPos = cameraPositions[currentView] || cameraPositions['3D'];

  return (
    <div className="h-full w-full relative">
      {/* Toolbar overlay */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        {views.slice(0, 2).map((v, i) => (
          <button
            key={v}
            onClick={() => setViewIndex(i)}
            className={`px-2 py-1 rounded text-xs font-medium backdrop-blur transition-all ${
              viewIndex === i
                ? 'bg-[#e94560] text-white shadow-lg shadow-red-500/30'
                : 'bg-[#12122a]/80 border border-[#2a2a4a] text-[#6a6a8a] hover:text-[#e8e8f0]'
            }`}
          >
            {v}
          </button>
        ))}
        <div className="w-px bg-[#2a2a4a] mx-1" />
        {views.slice(2).map((v, i) => (
          <button
            key={v}
            onClick={() => setViewIndex(i + 2)}
            className={`px-1.5 py-1 rounded text-[10px] font-medium backdrop-blur transition-all ${
              viewIndex === i + 2
                ? 'bg-[#e94560] text-white'
                : 'bg-[#12122a]/60 border border-[#2a2a4a] text-[#6a6a8a] hover:text-[#e8e8f0]'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Gizmo mode indicator */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <div className="text-[10px] text-[#6a6a8a] bg-[#12122a]/60 backdrop-blur px-2 py-1 rounded border border-[#2a2a4a] flex items-center gap-1.5">
          <span className={gizmoMode === 'translate' ? 'text-[#e94560] font-bold' : ''}>Q</span>
          <span className="text-[#3a3a5a]">|</span>
          <span className={gizmoMode === 'rotate' ? 'text-[#e94560] font-bold' : ''}>W</span>
          <span className="text-[#3a3a5a]">|</span>
          <span className={gizmoMode === 'scale' ? 'text-[#e94560] font-bold' : ''}>E</span>
          <span className="text-[#3a3a5a]">|</span>
          <span className={gizmoMode === 'rect' ? 'text-[#e94560] font-bold' : ''}>R</span>
          <span className="ml-2 text-[#3a3a5a]">|</span>
          <span className={gizmoSpace === 'local' ? 'text-[#e94560]' : ''}>{gizmoSpace === 'world' ? 'Global' : 'Local'}</span>
          <span className={snapping ? 'text-[#e94560]' : ''}>Snap</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: camPos.pos, fov: 55, far: 100 }}
        className="bg-[#0a0a1a]"
        onPointerMissed={() => clearSelection()}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* Mini viewport */}
      <div className="absolute bottom-2 right-2 w-28 h-28 bg-[#12122a]/80 backdrop-blur rounded-lg border border-[#2a2a4a] overflow-hidden shadow-lg">
        <Canvas camera={{ position: [3, 2, 3], fov: 30 }} gl={{ alpha: true }}>
          <SceneLighting />
          <OrbitControls enableZoom={false} enablePan={false} />
          <mesh>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#e94560" />
          </mesh>
        </Canvas>
      </div>

      {/* Viewport info */}
      <div className="absolute bottom-2 left-2 text-[10px] text-[#6a6a8a] bg-[#12122a]/60 backdrop-blur px-2 py-0.5 rounded border border-[#2a2a4a]">
        {currentView} View
      </div>
    </div>
  );
}
