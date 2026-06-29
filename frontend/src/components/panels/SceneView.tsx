import { useEffect, useRef, useCallback } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import '@babylonjs/core/Layers/effectLayer';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders/glTF';

import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';

const MESH_CREATORS: Record<string, (name: string, scene: Scene) => Mesh | null> = {
  box: (name, scene) => MeshBuilder.CreateBox(name, { size: 1 }, scene),
  sphere: (name, scene) => MeshBuilder.CreateSphere(name, { diameter: 1, segments: 32 }, scene),
  cylinder: (name, scene) => MeshBuilder.CreateCylinder(name, { height: 1, diameter: 0.5 }, scene),
  plane: (name, scene) => MeshBuilder.CreateBox(name, { width: 1, height: 0.01, depth: 1 }, scene),
  torus: (name, scene) => MeshBuilder.CreateTorus(name, { diameter: 1, thickness: 0.3, tessellation: 24 }, scene),
  cone: (name, scene) => MeshBuilder.CreateCylinder(name, { height: 1, diameterBottom: 0.8, diameterTop: 0 }, scene),
};

function resolveKind(components: { kind: string; propertiesJson: string }[]): string {
  const renderer = components.find((c) => c.kind === 'renderer' || c.kind === 'meshFilter');
  if (!renderer) return 'box';
  try {
    const props = JSON.parse(renderer.propertiesJson);
    return props.meshKind || 'box';
  } catch {
    return 'box';
  }
}

interface SceneViewProps {
  onSelectObject?: (id: string | null) => void;
  showMiniViewport?: boolean;
}

export default function SceneView({ onSelectObject, showMiniViewport = false }: SceneViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const hlRef = useRef<HighlightLayer | null>(null);
  const gizmoRef = useRef<GizmoManager | null>(null);
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());
  const cleanupRef = useRef<(() => void) | null>(null);

  const gameObjects = useSceneStore((s) => s.gameObjects);
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const selectObject = useSceneStore((s) => s.selectObject);
  const sceneSettings = useUiStore((s) => s.sceneSettings);
  const viewMode = useUiStore((s) => s.viewMode);
  const gizmoMode = useUiStore((s) => s.gizmoMode);

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.07, 0.07, 0.15, 1);
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.contrast = 0.1;

    const camera = new ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3.5, 12, Vector3.Zero(), scene);
    camera.attachControl(canvas, false);
    camera.lowerRadiusLimit = 0.5;
    camera.upperRadiusLimit = 200;
    camera.lowerBetaLimit = 0.05;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.panningSensibility = 50;
    camera.wheelPrecision = 2;

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;
    const shadowGen = new ShadowGenerator(2048, dir);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;

    const hl = new HighlightLayer('hl', scene);

    const gizmo = new GizmoManager(scene);
    gizmo.positionGizmoEnabled = false;
    gizmo.rotationGizmoEnabled = false;
    gizmo.scaleGizmoEnabled = false;
    gizmo.usePointerToAttachGizmos = false;

    scene.onPointerDown = (_, pickInfo) => {
      if (pickInfo?.hit && pickInfo.pickedMesh) {
        const oid = pickInfo.pickedMesh.metadata?.gameObjectId;
        if (oid) {
          selectObject(oid);
          onSelectObject?.(oid);
          return;
        }
      }
      selectObject(null);
      onSelectObject?.(null);
    };

    engine.runRenderLoop(() => scene.render());

    const ro = new ResizeObserver(() => engine.resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    engineRef.current = engine;
    sceneRef.current = scene;
    hlRef.current = hl;
    gizmoRef.current = gizmo;
    cleanupRef.current = () => {
      ro.disconnect();
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    init(canvas);
    return () => cleanupRef.current?.();
  }, []);

  // Sync game objects
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const toRemove = new Set(meshMapRef.current.keys());
    for (const go of gameObjects) {
      toRemove.delete(go.id);
      let mesh = meshMapRef.current.get(go.id);
      if (!mesh) {
        const kind = resolveKind(go.components);
        const creator = MESH_CREATORS[kind] || MESH_CREATORS.box;
        mesh = creator!(go.name, scene);
        if (mesh) {
          mesh.metadata = { gameObjectId: go.id };
          const mat = new StandardMaterial(`mat_${go.id}`, scene);
          mat.diffuseColor = new Color3(0.6, 0.6, 0.8);
          mesh.material = mat;
          meshMapRef.current.set(go.id, mesh);
        }
      }
      if (mesh) {
        mesh.position.set(go.transform.px, go.transform.py, go.transform.pz);
        mesh.setEnabled(go.isActive);
      }
    }

    for (const id of toRemove) {
      const m = meshMapRef.current.get(id);
      if (m) { m.dispose(); meshMapRef.current.delete(id); }
    }
  }, [gameObjects]);

  // Selection highlight
  useEffect(() => {
    const hl = hlRef.current;
    if (!hl) return;
    for (const m of meshMapRef.current.values()) hl.removeMesh(m);
    for (const id of selectedIds) {
      const m = meshMapRef.current.get(id);
      if (m) hl.addMesh(m, Color3.FromHexString('#e94560'));
    }
  }, [selectedIds]);

  // Gizmo
  useEffect(() => {
    const gizmo = gizmoRef.current;
    if (!gizmo) return;
    gizmo.positionGizmoEnabled = gizmoMode === 'translate';
    gizmo.rotationGizmoEnabled = gizmoMode === 'rotate';
    gizmo.scaleGizmoEnabled = gizmoMode === 'scale';
    gizmo.attachedMesh = selectedIds.length === 1 ? meshMapRef.current.get(selectedIds[0]) ?? null : null;
  }, [gizmoMode, selectedIds]);

  // Fog
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (sceneSettings?.fogEnabled) {
      scene.fogMode = Scene.FOGMODE_EXP2;
      scene.fogDensity = sceneSettings.fogDensity ?? 0.01;
      scene.fogColor = Color3.FromHexString(sceneSettings.fogColor || '#000000');
    } else {
      scene.fogMode = Scene.FOGMODE_NONE;
    }
  }, [sceneSettings]);

  // View mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.forceWireframe = viewMode === 'wireframe';
    scene.forcePoints = false;
  }, [viewMode]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07070f]">
      <canvas ref={canvasRef} className="w-full h-full block outline-none touch-none" />
      {showMiniViewport && (
        <div className="absolute bottom-2 right-2 w-48 h-36 border border-[#2a2a4a] rounded overflow-hidden bg-[#0a0a15]">
          <canvas ref={miniRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
