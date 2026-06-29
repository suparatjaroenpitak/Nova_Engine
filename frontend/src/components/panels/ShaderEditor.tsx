import { useState } from 'react';

const shaderTemplate = `Shader "Nova/Custom/Unlit"
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
}`;

export default function ShaderEditor() {
  const [source, setSource] = useState(shaderTemplate);
  const [shaderName, setShaderName] = useState('CustomUnlit.shader');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-nova-surface border-b border-nova-border">
        <input
          value={shaderName}
          onChange={(e) => setShaderName(e.target.value)}
          className="px-2 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
        />
        <button className="px-3 py-0.5 bg-nova-accent text-white text-xs rounded hover:bg-red-600">
          Compile
        </button>
        <button className="px-3 py-0.5 bg-nova-hover text-nova-text text-xs rounded">
          Preview
        </button>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 bg-nova-bg p-3 font-mono text-xs text-nova-text overflow-auto whitespace-pre">
          {source}
        </div>
        <div className="w-64 border-l border-nova-border p-3">
          <h3 className="text-xs font-medium text-nova-muted mb-2 uppercase">Properties</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-nova-muted block mb-1">_MainTex</label>
              <div className="h-16 bg-nova-bg border border-nova-border rounded flex items-center justify-center text-nova-muted text-xs">
                Texture
              </div>
            </div>
            <div>
              <label className="text-xs text-nova-muted block mb-1">_Color</label>
              <div className="flex gap-1">
                {['R', 'G', 'B', 'A'].map((c) => (
                  <input key={c} type="number" defaultValue="1" step="0.1" min="0" max="1"
                    className="w-10 px-1 py-0.5 bg-nova-bg border border-nova-border rounded text-xs text-nova-text"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
