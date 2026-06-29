import { useEffect, useRef, useCallback, useState } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import '@babylonjs/core/Loading/loadingScreen';

export default function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fps, setFps] = useState(0);

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.2, 1);

    const camera = new FreeCamera('gameCam', new Vector3(0, 2, -5), scene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, false);

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    const box = MeshBuilder.CreateBox('player', { size: 0.8 }, scene);
    box.position.y = 0.5;
    const mat = new StandardMaterial('playerMat', scene);
    mat.diffuseColor.set(0.8, 0.3, 0.4);
    box.material = mat;

    const plane = MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor.set(0.2, 0.2, 0.25);
    plane.material = groundMat;

    engine.runRenderLoop(() => {
      scene.render();
      setFps(Math.round(engine.getFps()));
    });

    const ro = new ResizeObserver(() => engine.resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      ro.disconnect();
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = init(canvas);
    return () => cleanup?.();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0a0a15]">
      <div className="flex items-center gap-1 px-2 h-8 bg-[#1a1a30] border-b border-[#2a2a4a] shrink-0">
        <button
          onClick={() => { setPlaying(!playing); setPaused(false); }}
          className={`px-3 py-0.5 rounded text-xs ${playing ? 'bg-green-600' : 'bg-[#2a2a4a]'} text-white hover:opacity-80`}
        >
          {playing ? '⏹ Stop' : '▶ Play'}
        </button>
        <button
          disabled={!playing}
          onClick={() => setPaused(!paused)}
          className={`px-3 py-0.5 rounded text-xs ${paused ? 'bg-yellow-600' : 'bg-[#2a2a4a]'} text-white hover:opacity-80 disabled:opacity-40`}
        >
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-[#6a6a8a] font-mono">
          {fps} FPS
        </span>
        <span className="text-[10px] text-[#6a6a8a] ml-2">
          {playing ? '🟢 Playing' : paused ? '🟡 Paused' : '⏹ Stopped'}
        </span>
      </div>
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full block outline-none touch-none" />
      </div>
    </div>
  );
}
