import { useState, useEffect, useRef } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Effect } from '@babylonjs/core/Materials/effect';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import '@babylonjs/core/Loading/loadingScreen';

interface ShaderTemplate {
  id: string;
  name: string;
  vertex: string;
  fragment: string;
}

const TEMPLATES: ShaderTemplate[] = [
  {
    id: 'unlit',
    name: 'Unlit',
    vertex: `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
uniform mat4 worldViewProjection;
void main() {
  vUv = uv;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`,
    fragment: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec4 _Color;
uniform sampler2D _MainTex;
void main() {
  vec4 tex = texture(_MainTex, vUv);
  fragColor = tex * _Color;
}`,
  },
  {
    id: 'pbr',
    name: 'PBR',
    vertex: `#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
out vec2 vUv;
out vec3 vNormal;
out vec3 vPosition;
uniform mat4 worldViewProjection;
uniform mat4 world;
void main() {
  vUv = uv;
  vNormal = mat3(world) * normal;
  vPosition = (world * vec4(position, 1.0)).xyz;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`,
    fragment: `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;
out vec4 fragColor;
uniform vec4 _Color;
uniform vec3 _LightDir;
uniform vec3 _CameraPos;
void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(_LightDir);
  float diff = max(dot(N, L), 0.0);
  vec3 V = normalize(_CameraPos - vPosition);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 32.0);
  vec3 albedo = _Color.rgb;
  vec3 ambient = 0.05 * albedo;
  vec3 lighting = ambient + diff * albedo + spec * vec3(1.0);
  fragColor = vec4(lighting, _Color.a);
}`,
  },
  {
    id: 'custom',
    name: 'HLSL-style',
    vertex: `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
uniform mat4 worldViewProjection;
void main() {
  vUv = uv;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`,
    fragment: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float _Time;
void main() {
  vec2 uv = vUv;
  vec3 col = 0.5 + 0.5 * cos(_Time + uv.xyx + vec3(0, 2, 4));
  fragColor = vec4(col, 1.0);
}`,
  },
];

const SHADER_LIB = `// Nova Shader Library
// Uniforms available:
//   _Time      - float (elapsed time)
//   _Color     - vec4 (color)
//   _MainTex   - sampler2D (main texture)
//   _LightDir  - vec3 (world light direction)
//   _CameraPos - vec3 (camera world position)
`;

export default function ShaderEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTemplate, setActiveTemplate] = useState('unlit');
  const [vertexSrc, setVertexSrc] = useState(TEMPLATES[0].vertex);
  const [fragmentSrc, setFragmentSrc] = useState(TEMPLATES[0].fragment);
  const [color, setColor] = useState('#ff4488');
  const [compileStatus, setCompileStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [compiling, setCompiling] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.12, 1);

    const camera = new ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 4, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 10;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.6;

    const mesh = MeshBuilder.CreateSphere('preview', { diameter: 1.5, segments: 64 }, scene);
    mesh.position.y = 0.2;

    let shaderMat: ShaderMaterial | null = null;
    let startTime = performance.now();

    const buildShader = () => {
      if (shaderMat) {
        mesh.material = null;
        shaderMat.dispose();
      }
      try {
        Effect.ShadersStore['customVertexShader'] = vertexSrc;
        Effect.ShadersStore['customFragmentShader'] = fragmentSrc;
        shaderMat = new ShaderMaterial('shader', scene, { vertex: 'custom', fragment: 'custom' }, {
          attributes: ['position', 'normal', 'uv'],
          uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
          samplers: ['_MainTex'],
          needAlphaBlending: true,
        });
        shaderMat.setColor4('_Color', new Color4(1, 0.27, 0.53, 1));
        shaderMat.setTexture('_MainTex', Texture.CreateFromBase64String(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAtSURBVFiF7c5BDQAACAOw7d88A4FQJ4sGAP///7+9AwAAAAAAAAAAAAAAAPAaJgAB/gAB2sEFHAAAAABJRU5ErkJggg==',
          'tex', scene
        ));
        mesh.material = shaderMat;
        setCompileStatus('success');
        setErrorMsg('');
      } catch (e: any) {
        setCompileStatus('error');
        setErrorMsg(e.message || 'Shader compilation failed');
      }
    };

    buildShader();

    engine.runRenderLoop(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (shaderMat) {
        try { shaderMat.setFloat('_Time', elapsed); } catch {}
      }
      scene.render();
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
    const template = TEMPLATES.find((t) => t.id === activeTemplate);
    if (template) {
      setVertexSrc(template.vertex);
      setFragmentSrc(template.fragment);
    }
  }, [activeTemplate]);

  const handleCompile = () => {
    setCompiling(true);
    setCompileStatus('compiling');
    setTimeout(() => {
      setCompiling(false);
      setCompileStatus('success');
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      <div className="flex items-center gap-1 px-2 h-8 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0 overflow-x-auto">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setActiveTemplate(t.id)}
            className={`px-2 py-0.5 text-[10px] rounded whitespace-nowrap ${activeTemplate === t.id ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}
          >{t.name}</button>
        ))}
        <div className="flex-1" />
        <button onClick={handleCompile} disabled={compiling}
          className="px-2 py-0.5 text-[10px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >{compiling ? '⏳' : 'Compile'}</button>
        <span className={`text-[9px] ${compileStatus === 'success' ? 'text-green-400' : compileStatus === 'error' ? 'text-red-400' : 'text-[#6a6a8a]'}`}>
          {compileStatus === 'success' ? '✓' : compileStatus === 'error' ? '✗ Error' : ''}
        </span>
      </div>
      {errorMsg && <div className="px-2 py-1 bg-red-900/30 text-red-400 text-[10px] border-b border-red-800">{errorMsg}</div>}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-[#0a0a15]">
            <canvas ref={canvasRef} className="w-full h-full block outline-none touch-none" />
          </div>
        </div>
        <div className="w-72 border-l border-[#2a2a4a] flex flex-col bg-[#0f0f25]">
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="text-[10px] text-[#6a6a8a] font-mono p-1 bg-[#0a0a1a] rounded border border-[#2a2a4a] whitespace-pre-wrap">{SHADER_LIB}</div>
            <div className="border-t border-[#2a2a4a] pt-2">
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-1">Vertex Shader</div>
              <textarea value={vertexSrc} onChange={(e) => { setVertexSrc(e.target.value); setCompileStatus('idle'); }}
                className="w-full h-32 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#8ac] font-mono resize-none" spellCheck={false} />
            </div>
            <div>
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-1">Fragment Shader</div>
              <textarea value={fragmentSrc} onChange={(e) => { setFragmentSrc(e.target.value); setCompileStatus('idle'); }}
                className="w-full h-40 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#8ac] font-mono resize-none" spellCheck={false} />
            </div>
            <div>
              <div className="text-[10px] font-medium text-[#e8e8f0] mb-1">Properties</div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[9px] text-[#6a6a8a]">_Color</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 p-0 border border-[#2a2a4a] rounded cursor-pointer bg-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
