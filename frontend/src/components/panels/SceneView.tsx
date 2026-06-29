import { useEffect, useRef, useState, useCallback } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@abbylonjs/core/Materials/Textures/texture';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { BoundingBoxGizmo } from '@babylonjs/core/Gizmos/boundingBoxGizmo';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Culling/ray';

import { useSceneStore } from '@/stores/sceneStore';
import { useUiStore } from '@/stores/uiStore';
import type { GameObjectDto, ComponentDto } from '@/types';
import type { ViewMode } from '@/types/scene';

const MESH_KIND_MAP: Record<string, string> = {
  box: 'box',
  sphere: 'sphere',
  capsule: 'cylinder',
  cylinder: 'cylinder',
  plane: 'box',
  torus: 'torus',
  cone: 'cylinder',
  quad: 'box',
};

const GEOMETRY_PARAMS: Record<string, (c: ComponentDto) => any> = {
  box: () => ({ size: 1 }),
  sphere: () => ({ diameter: 1, segments: 32 }),
  capsule: () => ({ height: 1, diameter: 0.5 }),
  cylinder: () => ({ height: 1, diameter: 0.5 }),
  plane: () => ({ width: 1, height: 1, depth: 0.01 }),
  torus: () => ({ diameter: 1, thickness: 0.3 }),
  cone: () => ({ height: 1, diameter: 0.8 }),
};

function createMesh(kind: string, name: string, scene: Scene): Mesh | null {
  const params = GEOMETRY_PARAMS[kind];
  if (!params) return null;
  const p = params({ id: '', gameObjectId: '', kind, enabled: true, propertiesJson: '', order: 0 });
  switch (kind) {
    case 'box': return MeshBuilder.CreateBox(name, p, scene);
    case 'sphere': return MeshBuilder.CreateSphere(name, p, scene);
    case 'cylinder': return MeshBuilder.CreateCylinder(name, p, scene);
    case 'plane': return MeshBuilder.CreateBox(name, p, scene);
    case 'torus': return MeshBuilder.CreateTorus(name, p, scene);
    case 'cone': return MeshBuilder.CreateCylinder(name, { ...p, diameterTop: 0 }, scene);
    default: return null;
  }
}

interface SceneViewProps {
  onSelectObject?: (id: string | null) => void;
  showMiniViewport?: boolean;
}

export default function SceneView({ onSelectObject, showMiniViewport = false }: SceneViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const hlLayerRef = useRef<HighlightLayer | null>(null);
  const gizmoManagerRef = useRef<GizmoManager | null>(null);
  const meshMapRef = useRef<Map<string, Mesh>>(new Map());
  const selectedIdRef = useRef<string | null>(null);

  const gameObjects = useSceneStore((s) => s.gameObjects);
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const selectObject = useSceneStore((s) => s.selectObject);
  const sceneSettings = useUiStore((s) => s.sceneSettings);
  const viewMode = useUiStore((s) => s.viewMode);
  const gizmoMode = useUiStore((s) => s.gizmoMode);
  const gizmoSpace = useUiStore((s) => s.gizmoSpace);
  const snapping = useUiStore((s) => s.snapping);
  const snapSize = useUiStore((s) => s.snapSize);
  const showGrid = useUiStore((s) => s.showGrid);
  const gridSize = useUiStore((s) => s.gridSize);

  const initScene = useCallback((canvas: HTMLCanvasElement) => {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.07, 0.07, 0.15, 1);
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.contrast = 0.1;

    const camera = new ArcRotateCamera('sceneCamera', -Math.PI / 4, Math.PI / 3.5, 12, Vector3.Zero(), scene);
    camera.attachControl(canvas, false);
    camera.lowerRadiusLimit = 0.5;
    camera.upperRadiusLimit = 200;
    camera.lowerBetaLimit = 0.05;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.panningSensibility = 50;
    camera.wheelPrecision = 2;

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;

    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;
    const shadowGen = new ShadowGenerator(2048, dir);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;

    const hlLayer = new HighlightLayer('hl', scene);

    const gizmo = new GizmoManager(scene);
    gizmo.positionGizmoEnabled = false;
    gizmo.rotationGizmoEnabled = false;
    gizmo.scaleGizmoEnabled = false;
    gizmo.usePointerToAttachGizmos = false;

    scene.onPointerDown = (_, pickInfo) => {
      if (pickInfo?.hit && pickInfo.pickedMesh) {
        const objId = pickInfo.pickedMesh.metadata?.gameObjectId;
        if (objId) {
          selectObject(objId);
          if (onSelectObject) onSelectObject(objId);
        }
      } else {
        selectObject(null);
        if (onSelectObject) onSelectObject(null);
      }
    };

    engineRef.current = engine;
    sceneRef.current = scene;
    hlLayerRef.current = hlLayer;
    gizmoManagerRef.current = gizmo;

    engine.runRenderLoop(() => scene.render());

    const resize = new ResizeObserver(() => engine.resize());
    if (canvas.parentElement) resize.observe(canvas.parentElement);

    return () => {
      resize.disconnect();
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return initScene(canvas);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const toRemove = new Set(meshMapRef.current.keys());
    const validIds = new Set<string>();

    for (const go of gameObjects) {
      validIds.add(go.id);
      toRemove.delete(go.id);

      let mesh = meshMapRef.current.get(go.id);
      if (!mesh) {
        const renderer = go.components.find((c) => c.kind === 'renderer' || c.kind.startsWith('mesh'));
        const kind = renderer ? (JSON.parse(renderer.propertiesJson || '{}').meshKind || 'box') : 'box';
        const babKind = MESH_KIND_MAP[kind] || 'box';
        mesh = createMesh(babKind, go.name, scene);
        if (mesh) {
          mesh.metadata = { gameObjectId: go.id };
          meshMapRef.current.set(go.id, mesh);
        }
      }
      if (mesh) {
        mesh.position.set(go.transform.px, go.transform.py, go.transform.pz);
        mesh.position.x = go.transform.px;
        mesh.position.y = go.transform.py;
        mesh.position.z = go.transform.pz;
        mesh.setEnabled(go.isActive);
      }
    }

    for (const id of toRemove) {
      const mesh = meshMapRef.current.get(id);
      if (mesh) {
        mesh.dispose();
        meshMapRef.current.delete(id);
      }
    }
  }, [gameObjects]);

  useEffect(() => {
    const hl = hlLayerRef.current;
    if (!hl) return;

    for (const m of meshMapRef.current.values()) {
      hl.removeMesh(m, true);
    }

    for (const id of selectedIds) {
      const mesh = meshMapRef.current.get(id);
      if (mesh) hl.addMesh(mesh, Color3.FromHexString('#e94560'));
    }
  }, [selectedIds]);

  useEffect(() => {
    const gizmo = gizmoManagerRef.current;
    if (!gizmo) return;
    gizmo.positionGizmoEnabled = false;
    gizmo.rotationGizmoEnabled = false;
    gizmo.scaleGizmoEnabled = false;

    if (gizmoMode === 'translate') gizmo.positionGizmoEnabled = true;
    else if (gizmoMode === 'rotate') gizmo.rotationGizmoEnabled = true;
    else if (gizmoMode === 'scale') gizmo.scaleGizmoEnabled = true;

    const mesh = selectedIds.length === 1 ? meshMapRef.current.get(selectedIds[0]) : null;
    gizmo.attachedMesh = mesh || null;
  }, [gizmoMode, selectedIds]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.fogMode = sceneSettings.fogEnabled ? Scene.FOGMODE_EXP2 : Scene.FOGMODE_NONE;
    if (sceneSettings.fogEnabled) {
      scene.fogDensity = sceneSettings.fogDensity || 0.01;
      scene.fogColor = Color3.FromHexString(sceneSettings.fogColor || '#000000');
    }
  }, [sceneSettings]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (viewMode === 'wireframe') {
      scene.forceWireframe = true;
      scene.forcePoints = false;
    } else {
      scene.forceWireframe = false;
      scene.forcePoints = false;
    }
  }, [viewMode]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07070f]">
      <canvas ref={canvasRef} className="w-full h-full block outline-none touch-none" />
      {showMiniViewport && (
        <div className="absolute bottom-2 right-2 w-48 h-36 border border-[#2a2a4a] rounded overflow-hidden bg-[#0a0a15]">
          <canvas ref={miniCanvasRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
