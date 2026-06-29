import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type MaterialType = 'standard' | 'unlit' | 'custom';

interface PBRProperties {
  albedo: string;
  albedoMap: string | null;
  metallic: number;
  roughness: number;
  normalMap: string | null;
  emission: string;
  emissionMap: string | null;
  emissionIntensity: number;
  aoMap: string | null;
  aoIntensity: number;
  opacity: number;
  alphaClip: boolean;
  alphaClipThreshold: number;
  tiling: [number, number];
  offset: [number, number];
  parallaxMap: string | null;
  heightScale: number;
  detailMask: string | null;
  detailAlbedo: string | null;
  detailNormal: string | null;
}

function LiveMaterialPreview({ properties }: { properties: PBRProperties }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(properties.albedo);
      mat.metalness = properties.metallic;
      mat.roughness = properties.roughness;
      mat.emissive.set(properties.emission);
      mat.emissiveIntensity = properties.emissionIntensity;
      mat.opacity = properties.opacity;
      mat.transparent = properties.opacity < 1;
    }
  }, [properties]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, 0, -5]} intensity={0.5} />
      <hemisphereLight args={['#8888ff', '#444422', 0.4]} />
      <mesh ref={meshRef} rotation={[-0.2, 0.4, 0]} castShadow>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial
          color={properties.albedo}
          metalness={properties.metallic}
          roughness={properties.roughness}
          emissive={properties.emission}
          emissiveIntensity={properties.emissionIntensity}
          opacity={properties.opacity}
          transparent={properties.opacity < 1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
    </>
  );
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: { title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#2a2a4a] rounded overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2 py-1.5 bg-[#1a1a35] hover:bg-[#222245] transition-colors text-left">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] font-medium text-[#e8e8f0] flex-1 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-[#6a6a8a]">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="p-2 space-y-2">{children}</div>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-20 px-1 py-0.5 text-[10px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono" />
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#6a6a8a]">{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-16 h-1 accent-[#e94560] cursor-pointer" />
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-[10px] bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[#e8e8f0] font-mono" />
      </div>
    </div>
  );
}

function TextureSlot({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div>
      <span className="text-[10px] text-[#6a6a8a] block mb-0.5">{label}</span>
      <div
        className="h-14 bg-[#0a0a1a] border border-[#2a2a4a] rounded flex items-center justify-center cursor-pointer hover:border-[#e94560]/50 transition-colors relative group"
        onClick={() => onChange(prompt('Enter texture path:') || value)}
      >
        {value ? (
          <div className="text-[10px] text-[#e8e8f0] truncate px-2">{value}</div>
        ) : (
          <span className="text-[10px] text-[#6a6a8a]">Drop or click to assign</span>
        )}
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >✕</button>
        )}
      </div>
    </div>
  );
}

export default function MaterialEditor() {
  const [materialName, setMaterialName] = useState('New PBR Material');
  const [shaderName, setShaderName] = useState('Nova/PBR/Standard');
  const [surfaceType, setSurfaceType] = useState<'opaque' | 'transparent' | 'cutout'>('opaque');
  const [renderFace, setRenderFace] = useState<'both' | 'front' | 'back'>('both');
  const [props, setProps] = useState<PBRProperties>({
    albedo: '#ffffff', albedoMap: null,
    metallic: 0.0, roughness: 0.5,
    normalMap: null,
    emission: '#000000', emissionMap: null, emissionIntensity: 1.0,
    aoMap: null, aoIntensity: 1.0,
    opacity: 1.0, alphaClip: false, alphaClipThreshold: 0.5,
    tiling: [1, 1], offset: [0, 0],
    parallaxMap: null, heightScale: 0.05,
    detailMask: null, detailAlbedo: null, detailNormal: null,
  });
  const [previewMesh, setPreviewMesh] = useState<'sphere' | 'cube' | 'plane'>('sphere');

  const updateProp = <K extends keyof PBRProperties>(key: K, value: PBRProperties[K]) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-2 shrink-0">
        <input value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-xs text-[#e8e8f0] font-medium w-40" />
        <input value={shaderName} onChange={(e) => setShaderName(e.target.value)} className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[10px] text-[#6a6a8a] font-mono w-36" />
        <div className="flex-1" />
        <div className="flex border border-[#2a2a4a] rounded text-[10px]">
          {(['sphere', 'cube', 'plane'] as const).map((m) => (
            <button key={m} onClick={() => setPreviewMesh(m)} className={`px-2 py-0.5 ${previewMesh === m ? 'bg-[#e94560] text-white' : 'text-[#6a6a8a] hover:text-white'}`}>{m}</button>
          ))}
        </div>
        <button className="px-2 py-0.5 bg-[#e94560] text-white text-[10px] rounded hover:bg-red-600">Apply</button>
        <button className="px-2 py-0.5 bg-[#1a1a35] border border-[#2a2a4a] text-[#6a6a8a] text-[10px] rounded hover:text-white">Save</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Properties */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Surface Options */}
          <CollapsibleSection title="Surface Options" icon="◈">
            <div className="flex gap-2 text-[10px]">
              {(['opaque', 'transparent', 'cutout'] as const).map((type) => (
                <button key={type} onClick={() => setSurfaceType(type)} className={`px-2 py-1 rounded flex-1 ${surfaceType === type ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/50' : 'bg-[#0a0a1a] text-[#6a6a8a] border border-[#2a2a4a] hover:text-white'}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-[10px]">
              {(['both', 'front', 'back'] as const).map((face) => (
                <button key={face} onClick={() => setRenderFace(face)} className={`px-2 py-1 rounded flex-1 ${renderFace === face ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/50' : 'bg-[#0a0a1a] text-[#6a6a8a] border border-[#2a2a4a] hover:text-white'}`}>
                  {face === 'both' ? 'Double Sided' : face.charAt(0).toUpperCase() + face.slice(1)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[10px] text-[#e8e8f0] cursor-pointer">
              <input type="checkbox" checked={props.alphaClip} onChange={(e) => updateProp('alphaClip', e.target.checked)} className="accent-[#e94560]" />
              Alpha Clip
            </label>
            {props.alphaClip && <SliderField label="Threshold" value={props.alphaClipThreshold} min={0} max={1} step={0.01} onChange={(v) => updateProp('alphaClipThreshold', v)} />}
          </CollapsibleSection>

          {/* Surface Inputs */}
          <CollapsibleSection title="Surface Inputs" icon="🎨">
            <ColorField label="Albedo" value={props.albedo} onChange={(v) => updateProp('albedo', v)} />
            <TextureSlot label="Albedo Map" value={props.albedoMap} onChange={(v) => updateProp('albedoMap', v)} />
            <SliderField label="Metallic" value={props.metallic} min={0} max={1} step={0.01} onChange={(v) => updateProp('metallic', v)} />
            <SliderField label="Roughness" value={props.roughness} min={0} max={1} step={0.01} onChange={(v) => updateProp('roughness', v)} />
            <TextureSlot label="Normal Map" value={props.normalMap} onChange={(v) => updateProp('normalMap', v)} />
          </CollapsibleSection>

          {/* Emission */}
          <CollapsibleSection title="Emission" icon="☀">
            <ColorField label="Emission Color" value={props.emission} onChange={(v) => updateProp('emission', v)} />
            <SliderField label="Intensity" value={props.emissionIntensity} min={0} max={10} step={0.1} onChange={(v) => updateProp('emissionIntensity', v)} />
            <TextureSlot label="Emission Map" value={props.emissionMap} onChange={(v) => updateProp('emissionMap', v)} />
          </CollapsibleSection>

          {/* AO */}
          <CollapsibleSection title="Ambient Occlusion" icon="◐">
            <TextureSlot label="AO Map" value={props.aoMap} onChange={(v) => updateProp('aoMap', v)} />
            <SliderField label="AO Intensity" value={props.aoIntensity} min={0} max={2} step={0.01} onChange={(v) => updateProp('aoIntensity', v)} />
          </CollapsibleSection>

          {/* Detail */}
          <CollapsibleSection title="Detail" icon="🔍" defaultOpen={false}>
            <TextureSlot label="Detail Mask" value={props.detailMask} onChange={(v) => updateProp('detailMask', v)} />
            <TextureSlot label="Detail Albedo" value={props.detailAlbedo} onChange={(v) => updateProp('detailAlbedo', v)} />
            <TextureSlot label="Detail Normal" value={props.detailNormal} onChange={(v) => updateProp('detailNormal', v)} />
          </CollapsibleSection>

          {/* Tiling */}
          <CollapsibleSection title="Tiling & Offset" icon="⊞" defaultOpen={false}>
            <div className="flex gap-2">
              <div className="flex-1"><SliderField label="Tiling X" value={props.tiling[0]} min={0.1} max={10} step={0.1} onChange={(v) => updateProp('tiling', [v, props.tiling[1]])} /></div>
              <div className="flex-1"><SliderField label="Tiling Y" value={props.tiling[1]} min={0.1} max={10} step={0.1} onChange={(v) => updateProp('tiling', [props.tiling[0], v])} /></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><SliderField label="Offset X" value={props.offset[0]} min={-10} max={10} step={0.01} onChange={(v) => updateProp('offset', [v, props.offset[1]])} /></div>
              <div className="flex-1"><SliderField label="Offset Y" value={props.offset[1]} min={-10} max={10} step={0.01} onChange={(v) => updateProp('offset', [props.offset[0], v])} /></div>
            </div>
          </CollapsibleSection>

          {/* Parallax */}
          <CollapsibleSection title="Parallax" icon="◧" defaultOpen={false}>
            <TextureSlot label="Height Map" value={props.parallaxMap} onChange={(v) => updateProp('parallaxMap', v)} />
            <SliderField label="Height Scale" value={props.heightScale} min={0} max={0.5} step={0.001} onChange={(v) => updateProp('heightScale', v)} />
          </CollapsibleSection>
        </div>

        {/* Live 3D Preview */}
        <div className="w-72 border-l border-[#2a2a4a] flex flex-col">
          <div className="flex items-center h-6 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] shrink-0">
            <span className="text-[9px] text-[#6a6a8a] uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex-1 bg-[#0a0a1a]">
            <Canvas camera={{ position: [0, 0, 4], fov: 30 }} gl={{ antialias: true, alpha: true }}>
              <LiveMaterialPreview properties={props} />
            </Canvas>
          </div>
          <div className="h-20 border-t border-[#2a2a4a] p-2 bg-[#0f0f25]">
            <span className="text-[9px] text-[#6a6a8a] block mb-1">Material Info</span>
            <div className="text-[9px] text-[#6a6a8a] font-mono space-y-0.5">
              <div>Shader: {shaderName}</div>
              <div>Queue: {surfaceType === 'opaque' ? 'Geometry' : 'Transparent'}</div>
              <div>Metallic: {props.metallic.toFixed(2)} | Roughness: {props.roughness.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
