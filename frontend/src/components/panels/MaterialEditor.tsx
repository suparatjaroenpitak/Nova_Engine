import { useState, useEffect, useRef, useCallback } from 'react';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import '@babylonjs/core/Loading/loadingScreen';

interface MaterialProps {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  albedoMap?: string;
  normalMap?: string;
  metallicMap?: string;
  roughnessMap?: string;
  aoMap?: string;
  heightMap?: string;
  tiling?: [number, number];
  offset?: [number, number];
  surface?: 'opaque' | 'transparent' | 'cutout';
  parallax?: number;
}

const PRESETS = ['PBR Default', 'Gold', 'Bronze', 'Copper', 'Silver', 'Iron', 'Rust', 'Plastic', 'Rubber', 'Glass', 'Wood', 'Stone', 'Brick', 'Concrete', 'Moss', 'Neon'];

const PRESET_VALUES: Record<string, Partial<MaterialProps>> = {
  Gold: { color: '#ffd700', metalness: 1, roughness: 0.2 },
  Bronze: { color: '#cd7f32', metalness: 1, roughness: 0.3 },
  Copper: { color: '#b87333', metalness: 1, roughness: 0.25 },
  Silver: { color: '#c0c0c0', metalness: 1, roughness: 0.15 },
  Iron: { color: '#434b4d', metalness: 1, roughness: 0.5 },
  Rust: { color: '#8b4513', metalness: 0.1, roughness: 0.9 },
  Plastic: { color: '#4488ff', metalness: 0, roughness: 0.3 },
  Rubber: { color: '#222222', metalness: 0, roughness: 1 },
  Glass: { color: '#88ccff', metalness: 0, roughness: 0.05, opacity: 0.3 },
  Wood: { color: '#8b6914', metalness: 0, roughness: 0.9 },
  Stone: { color: '#808080', metalness: 0, roughness: 0.8 },
  Brick: { color: '#b22222', metalness: 0, roughness: 0.7 },
  Concrete: { color: '#a0a0a0', metalness: 0, roughness: 0.85 },
  Moss: { color: '#4a7a3a', metalness: 0, roughness: 0.9 },
  Neon: { color: '#ff00ff', metalness: 0.2, roughness: 0.1, emissive: '#ff00ff', emissiveIntensity: 2 },
};

export default function MaterialEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewMatRef = useRef<PBRMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'maps' | 'advanced'>('properties');
  const [previewMesh, setPreviewMesh] = useState<'sphere' | 'cube' | 'plane'>('sphere');
  const [preset, setPreset] = useState('PBR Default');
  const [props, setProps] = useState<MaterialProps>({
    color: '#8888cc', metalness: 0, roughness: 0.5, emissive: '#000000',
    emissiveIntensity: 0, opacity: 1, surface: 'opaque', parallax: 0,
    tiling: [1, 1], offset: [0, 0],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.08, 0.08, 0.16, 1);

    const camera = new ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 4, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 10;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.6;

    const mat = new PBRMaterial('previewMat', scene);
    previewMatRef.current = mat;

    const mesh = MeshBuilder.CreateSphere('preview', { diameter: 1.5, segments: 64 }, scene);
    mesh.material = mat;
    mesh.position.y = 0.2;

    engine.runRenderLoop(() => {
      mesh.rotation.y += 0.005;
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
    const mat = previewMatRef.current;
    if (!mat) return;

    const c = new Color3();
    c.fromHexString(props.color || '#8888cc');
    mat.albedoColor = c;
    mat.metallic = props.metalness ?? 0;
    mat.roughness = props.roughness ?? 0.5;

    const e = new Color3();
    if (props.emissive && props.emissive !== '#000000') {
      e.fromHexString(props.emissive);
      mat.emissiveColor = e;
      mat.emissiveIntensity = props.emissiveIntensity ?? 0;
    } else {
      mat.emissiveColor = Color3.Black();
      mat.emissiveIntensity = 0;
    }

    mat.alpha = props.surface === 'transparent' ? (props.opacity ?? 1) : 1;
    mat.transparencyMode = props.surface === 'transparent' ? 2 : props.surface === 'cutout' ? 1 : 0;
  }, [props]);

  const applyPreset = (name: string) => {
    setPreset(name);
    if (name === 'PBR Default') {
      setProps({ color: '#8888cc', metalness: 0, roughness: 0.5, emissive: '#000000', emissiveIntensity: 0, opacity: 1, surface: 'opaque', parallax: 0, tiling: [1, 1], offset: [0, 0] });
    } else {
      setProps((prev) => ({ ...prev, ...PRESET_VALUES[name] }));
    }
  };

  const set = (key: keyof MaterialProps, value: any) => setProps((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
            <span className="text-[10px] text-[#6a6a8a]">Preview</span>
            <div className="flex gap-1">
              {(['sphere', 'cube', 'plane'] as const).map((m) => (
                <button key={m} onClick={() => setPreviewMesh(m)}
                  className={`px-2 py-0.5 text-[9px] rounded ${previewMesh === m ? 'bg-[#e94560] text-white' : 'bg-[#0a0a1a] text-[#6a6a8a] border border-[#2a2a4a]'}`}
                >{m}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 relative bg-[#0a0a15]">
            <canvas ref={canvasRef} className="w-full h-full block outline-none touch-none" />
          </div>
        </div>
        <div className="w-72 border-l border-[#2a2a4a] flex flex-col">
          <div className="flex border-b border-[#2a2a4a] bg-[#1a1a35]">
            {(['properties', 'maps', 'advanced'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-1 text-[10px] ${activeTab === t ? 'text-white border-b-2 border-[#e94560]' : 'text-[#6a6a8a]'}`}
              >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => applyPreset(p)}
                  className={`px-2 py-0.5 text-[9px] rounded border ${preset === p ? 'border-[#e94560] bg-[#e94560]/10 text-white' : 'border-[#2a2a4a] text-[#6a6a8a] hover:text-white'}`}
                >{p}</button>
              ))}
            </div>
            {activeTab === 'properties' && (
              <div className="space-y-2">
                <ColorField label="Albedo" value={props.color || '#8888cc'} onChange={(v) => set('color', v)} />
                <SliderField label="Metalness" value={props.metalness ?? 0} min={0} max={1} step={0.01} onChange={(v) => set('metalness', v)} />
                <SliderField label="Roughness" value={props.roughness ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => set('roughness', v)} />
                <ColorField label="Emissive" value={props.emissive || '#000000'} onChange={(v) => set('emissive', v)} />
                <SliderField label="Emissive Intensity" value={props.emissiveIntensity ?? 0} min={0} max={10} step={0.1} onChange={(v) => set('emissiveIntensity', v)} />
                <SelectField label="Surface" value={props.surface || 'opaque'} options={['opaque', 'transparent', 'cutout']} onChange={(v) => set('surface', v)} />
                {props.surface === 'transparent' && <SliderField label="Opacity" value={props.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => set('opacity', v)} />}
              </div>
            )}
            {activeTab === 'maps' && (
              <div className="space-y-2">
                {['Albedo', 'Normal', 'Metallic', 'Roughness', 'AO', 'Height'].map((mapType) => (
                  <TextureSlot key={mapType} label={mapType} />
                ))}
                <SliderField label="Tiling X" value={props.tiling?.[0] ?? 1} min={0.1} max={10} step={0.1} onChange={(v) => set('tiling', [v, props.tiling?.[1] ?? 1])} />
                <SliderField label="Tiling Y" value={props.tiling?.[1] ?? 1} min={0.1} max={10} step={0.1} onChange={(v) => set('tiling', [props.tiling?.[0] ?? 1, v])} />
                <SliderField label="Offset X" value={props.offset?.[0] ?? 0} min={-5} max={5} step={0.01} onChange={(v) => set('offset', [v, props.offset?.[1] ?? 0])} />
                <SliderField label="Offset Y" value={props.offset?.[1] ?? 0} min={-5} max={5} step={0.01} onChange={(v) => set('offset', [props.offset?.[0] ?? 0, v])} />
              </div>
            )}
            {activeTab === 'advanced' && (
              <div className="space-y-2">
                <SliderField label="Parallax Height" value={props.parallax ?? 0} min={0} max={1} step={0.01} onChange={(v) => set('parallax', v)} />
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] text-[#6a6a8a]">Double Sided</span>
                  <input type="checkbox" className="accent-[#e94560]" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] text-[#6a6a8a]">Receive Shadows</span>
                  <input type="checkbox" defaultChecked className="accent-[#e94560]" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9px] text-[#6a6a8a]">Cast Shadows</span>
                  <input type="checkbox" defaultChecked className="accent-[#e94560]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-1">
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-16 h-1 accent-[#e94560] cursor-pointer" />
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-12 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono" />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 p-0 border border-[#2a2a4a] rounded cursor-pointer bg-transparent" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-16 px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono" />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-[#6a6a8a]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-1 py-0.5 text-[9px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0]">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextureSlot({ label }: { label: string }) {
  const [file, setFile] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className={`w-8 h-8 rounded border border-[#2a2a4a] bg-[#0a0a1a] flex items-center justify-center overflow-hidden ${file ? '' : ''}`}>
        {file ? <img src={file} className="w-full h-full object-cover" /> : <span className="text-[9px] text-[#3a3a5a]">?</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-[#6a6a8a]">{label}</div>
        <input type="file" accept="image/*" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFile(URL.createObjectURL(f));
        }} className="text-[8px] text-[#4a4a6a] w-full" />
      </div>
    </div>
  );
}
