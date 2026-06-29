import { useEffect, useRef, useCallback } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';

export interface BabylonCanvasProps {
  children?: (scene: Scene, engine: Engine, canvas: HTMLCanvasElement) => void | (() => void);
  onSceneReady?: (scene: Scene, engine: Engine) => void;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  showInspector?: boolean;
  backgroundColor?: [number, number, number];
  antialiasing?: boolean;
  adaptToDeviceRatio?: boolean;
  handleResize?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function BabylonCanvas({
  children,
  onSceneReady,
  cameraPosition = [8, 6, 8],
  cameraTarget = [0, 0, 0],
  showInspector = false,
  backgroundColor = [0.07, 0.07, 0.15],
  antialiasing = true,
  adaptToDeviceRatio = true,
  handleResize = true,
  className = '',
  style,
}: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const initScene = useCallback((canvas: HTMLCanvasElement) => {
    const engine = new Engine(canvas, antialiasing, { preserveDrawingBuffer: false }, adaptToDeviceRatio);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(backgroundColor[0], backgroundColor[1], backgroundColor[2], 1);

    const camera = new ArcRotateCamera('camera', -Math.PI / 4, Math.PI / 3.5, 10, Vector3.Zero(), scene);
    camera.setPosition(new Vector3(cameraPosition[0], cameraPosition[1], cameraPosition[2]));
    camera.setTarget(new Vector3(cameraTarget[0], cameraTarget[1], cameraTarget[2]));
    camera.lowerRadiusLimit = 0.5;
    camera.upperRadiusLimit = 100;
    camera.lowerBetaLimit = 0.05;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.attachControl(canvas, true);

    new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.contrast = 0.05;

    engineRef.current = engine;
    sceneRef.current = scene;
    return { engine, scene, camera };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { engine, scene } = initScene(canvas);

    if (showInspector && import.meta.env.DEV) {
      import('@babylonjs/inspector').then(() => {
        scene.debugLayer.show({ embedMode: true });
      });
    }

    let effect: (() => void) | null = null;
    if (children) {
      const result = children(scene, engine, canvas);
      if (typeof result === 'function') {
        effect = result;
      }
    }
    if (onSceneReady) {
      onSceneReady(scene, engine);
    }

    engine.runRenderLoop(() => scene.render());

    const resizeObserver = handleResize
      ? new ResizeObserver(() => { engine.resize(); })
      : null;
    if (resizeObserver && canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    cleanupRef.current = () => {
      if (resizeObserver) resizeObserver.disconnect();
      engine.stopRenderLoop();
      if (effect) effect();
      scene.dispose();
      engine.dispose();
    };

    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        outline: 'none',
        touchAction: 'none',
        ...style,
      }}
    />
  );
}


