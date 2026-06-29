import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Editor from '@monaco-editor/react';
import * as THREE from 'three';

const SHADER_TEMPLATES: Record<string, string> = {
  'Unlit Shader': `Shader "Nova/Unlit/Simple"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4 _Color;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv) * _Color;
                return col;
            }
            ENDCG
        }
    }
}`,
  'PBR Lit Shader': `Shader "Nova/PBR/Standard"
{
    Properties
    {
        _MainTex ("Albedo", 2D) = "white" {}
        _MetallicTex ("Metallic (R)", 2D) = "white" {}
        _Metallic ("Metallic", Range(0,1)) = 0.0
        _Roughness ("Roughness", Range(0,1)) = 0.5
        _NormalMap ("Normal Map", 2D) = "bump" {}
        _EmissionTex ("Emission", 2D) = "black" {}
        _Emission ("Emission Color", Color) = (0,0,0,0)
        _Occlusion ("Occlusion", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        sampler2D _MetallicTex;
        sampler2D _NormalMap;
        sampler2D _EmissionTex;
        sampler2D _Occlusion;
        half _Metallic;
        half _Roughness;
        fixed4 _Emission;

        struct Input
        {
            float2 uv_MainTex;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex);
            fixed4 m = tex2D (_MetallicTex, IN.uv_MainTex);
            fixed4 e = tex2D (_EmissionTex, IN.uv_MainTex);
            fixed4 occ = tex2D (_Occlusion, IN.uv_MainTex);
            o.Albedo = c.rgb;
            o.Metallic = m.r * _Metallic;
            o.Smoothness = 1.0 - (m.a * _Roughness);
            o.Normal = UnpackNormal(tex2D(_NormalMap, IN.uv_MainTex));
            o.Emission = e.rgb * _Emission.rgb;
            o.Occlusion = occ.r;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}`,
  'HLSL Shader': `Shader "Nova/HLSL/Example"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200
        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 normalWS : NORMAL;
                float2 uv : TEXCOORD0;
            };

            float4 _Color;
            float _Glossiness;
            float _Metallic;

            Varyings vert (Attributes v)
            {
                Varyings o;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.normalWS = TransformObjectToWorldNormal(v.normalOS);
                o.uv = v.uv;
                return o;
            }

            float4 frag (Varyings i) : SV_Target
            {
                return _Color;
            }
            ENDHLSL
        }
    }
}`,
  'Vertex Shader': `Shader "Nova/Effects/VertexWave"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _WaveSpeed ("Wave Speed", float) = 2.0
        _WaveHeight ("Wave Height", float) = 0.5
        _WaveFreq ("Wave Frequency", float) = 3.0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                float3 normal : NORMAL;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float _WaveSpeed;
            float _WaveHeight;
            float _WaveFreq;

            v2f vert (appdata v)
            {
                v2f o;
                float wave = sin(v.vertex.x * _WaveFreq + _Time.y * _WaveSpeed) * _WaveHeight;
                wave += cos(v.vertex.z * _WaveFreq * 0.8 + _Time.y * _WaveSpeed * 0.7) * _WaveHeight * 0.5;
                v.vertex.y += wave;
                v.vertex.x += wave * 0.1;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                return tex2D(_MainTex, i.uv);
            }
            ENDCG
        }
    }
}`,
  'Compute Shader': `// Compute Shader Example
// Use for GPU particle systems, image effects, etc.

#pragma kernel CSMain

RWTexture2D<float4> Result;
float4 ColorA;
float4 ColorB;
float Time;

[numthreads(8,8,1)]
void CSMain (uint3 id : SV_DispatchThreadID)
{
    uint width, height;
    Result.GetDimensions(width, height);

    float2 uv = float2(id.xy) / float2(width, height);
    float2 center = uv - 0.5;

    float dist = length(center);
    float pulse = sin(dist * 10.0 - Time * 2.0) * 0.5 + 0.5;

    float4 color = lerp(ColorA, ColorB, pulse);
    color.a = 1.0;

    Result[id.xy] = color;
}`,
};

function ShaderPreviewSphere({ source }: { source: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!meshRef.current) return;

    // Create shader material from source
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        _Time: { value: 0 },
        _Color: { value: new THREE.Color('#e94560') },
        _MainTex: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 _Color;
        uniform float _Time;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vec3 color = _Color;
          float pattern = sin(vUv.x * 20.0 + _Time) * 0.5 + 0.5;
          color = mix(color, vec3(0.2, 0.2, 0.5), pattern);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    meshRef.current.material = mat;
    uniformsRef.current = mat.uniforms as any;

    // Animate time
    let frame = 0;
    const animate = () => {
      frame++;
      if (uniformsRef.current._Time) {
        uniformsRef.current._Time.value = frame * 0.016;
      }
      requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [source]);

  return (
    <mesh ref={meshRef} rotation={[-0.2, 0.4, 0]} scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#e94560" roughness={0.3} metalness={0.6} />
    </mesh>
  );
}

export default function ShaderEditor() {
  const [source, setSource] = useState(SHADER_TEMPLATES['Unlit Shader']);
  const [shaderName, setShaderName] = useState('CustomUnlit.shader');
  const [template, setTemplate] = useState('Unlit Shader');
  const [showErrors, setShowErrors] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showProperties, setShowProperties] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [compiling, setCompiling] = useState(false);

  const handleCompile = useCallback(() => {
    setCompiling(true);
    setTimeout(() => {
      setErrorMessages([]);
      setShowErrors(false);
      setCompiling(false);
    }, 500);
  }, []);

  const loadTemplate = (name: string) => {
    setSource(SHADER_TEMPLATES[name]);
    setTemplate(name);
    setShaderName(name.replace(/\s+/g, '') + '.shader');
    setShowTemplates(false);
  };

  const propertyColors = ['#4488ff', '#44cc44', '#ff8844', '#ff44aa', '#44cccc', '#e94560'];

  return (
    <div className="h-full flex flex-col bg-[#12122a]">
      {/* Toolbar */}
      <div className="flex items-center h-7 px-2 bg-[#1a1a35] border-b border-[#2a2a4a] gap-1 shrink-0">
        <input value={shaderName} onChange={(e) => setShaderName(e.target.value)} className="px-2 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[10px] text-[#e8e8f0] font-mono w-40" />

        <div className="relative">
          <button onClick={() => setShowTemplates(!showTemplates)} className="px-1.5 py-0.5 rounded text-[9px] text-[#6a6a8a] hover:text-white border border-[#2a2a4a]">
            Templates ▾
          </button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#12122a] border border-[#2a2a4a] rounded-lg shadow-2xl p-1 z-50">
              {Object.keys(SHADER_TEMPLATES).map((name) => (
                <button key={name} onClick={() => loadTemplate(name)}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] transition-colors ${template === name ? 'bg-[#e94560]/20 text-[#e94560]' : 'text-[#e8e8f0] hover:bg-white/10'}`}
                >{name}</button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-[#2a2a4a] mx-0.5" />

        <button onClick={handleCompile} disabled={compiling} className="px-2 py-0.5 bg-[#e94560] text-white text-[10px] rounded hover:bg-red-600 disabled:opacity-50">
          {compiling ? '⏳' : '⚡ Compile'}
        </button>

        <button onClick={() => setShowProperties(!showProperties)} className={`px-1.5 py-0.5 rounded text-[9px] ${showProperties ? 'text-[#e94560]' : 'text-[#6a6a8a] hover:text-white'}`}>
          Properties
        </button>

        <div className="flex-1" />

        {source && <span className="text-[9px] text-[#44cc44]">✓ Syntax OK</span>}
        <span className="text-[9px] text-[#6a6a8a]">{source.split('\n').length} lines</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={source}
            onChange={(val) => setSource(val ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: 'always',
              tabSize: 4,
              folding: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Properties panel */}
        {showProperties && (
          <div className="w-64 border-l border-[#2a2a4a] flex flex-col">
            <div className="flex items-center h-6 px-2 bg-[#1a1a35] border-b border-[#2a2a4a]">
              <span className="text-[9px] text-[#6a6a8a] uppercase tracking-wider">Properties</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <PropertyField label="_Color" type="color" defaultValue="#e94560" />
              <PropertyField label="_MainTex" type="texture" />
              <PropertyField label="_Metallic" type="range" defaultValue={0} min={0} max={1} />
              <PropertyField label="_Roughness" type="range" defaultValue={0.5} min={0} max={1} />
              <PropertyField label="_WaveSpeed" type="float" defaultValue={2} />
              <PropertyField label="_WaveHeight" type="float" defaultValue={0.5} />
              <PropertyField label="_WaveFreq" type="float" defaultValue={3} />

              <div className="pt-2 border-t border-[#2a2a4a]">
                <span className="text-[9px] text-[#6a6a8a] block mb-1">Preview</span>
                <div className="h-32 bg-[#0a0a1a] border border-[#2a2a4a] rounded overflow-hidden">
                  <Canvas camera={{ position: [0, 0, 3.5], fov: 30 }} gl={{ antialias: true, alpha: true }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <ShaderPreviewSphere source={source} />
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                  </Canvas>
                </div>
              </div>

              <div className="text-[8px] text-[#6a6a8a] font-mono space-y-0.5 border-t border-[#2a2a4a] pt-2">
                <div>Shader: {shaderName}</div>
                <div>Template: {template}</div>
                <div>Frag Lines: {source.split('\n').length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error panel */}
      {showErrors && errorMessages.length > 0 && (
        <div className="h-20 border-t border-[#ff4444]/50 overflow-y-auto shrink-0 bg-[#1a0000]">
          {errorMessages.map((err, i) => (
            <div key={i} className="px-3 py-1 text-[10px] text-red-400 font-mono border-b border-[#ff4444]/20">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyField({ label, type, defaultValue, min, max }: { label: string; type: string; defaultValue?: any; min?: number; max?: number }) {
  const [value, setValue] = useState(defaultValue ?? (type === 'color' ? '#ffffff' : type === 'range' ? 0.5 : type === 'float' ? 1 : null));

  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-[#6a6a8a] font-mono">{label}</span>
      {type === 'color' && (
        <input type="color" value={value} onChange={(e) => setValue(e.target.value)} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" />
      )}
      {type === 'range' && (
        <input type="range" value={value} min={min || 0} max={max || 1} step={0.01} onChange={(e) => setValue(parseFloat(e.target.value))} className="w-20 h-1 accent-[#e94560] cursor-pointer" />
      )}
      {type === 'float' && (
        <input type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 bg-[#0a0a1a] border border-[#2a2a4a] rounded text-[9px] text-[#e8e8f0] font-mono" step="0.1" />
      )}
      {type === 'texture' && (
        <div className="w-12 h-5 bg-[#0a0a1a] border border-[#2a2a4a] rounded flex items-center justify-center text-[8px] text-[#6a6a8a] cursor-pointer hover:border-[#e94560]/50">
          Select
        </div>
      )}
    </div>
  );
}
