export type AIGenerationMode = 'text-to-3d' | 'image-to-3d';

export type AIModel = 'trellis' | 'hunyuan3d' | 'stable-fast-3d' | 'triposr' | 'instantmesh';

export type AIJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AIGenerationRequest {
  mode: AIGenerationMode;
  model: AIModel;
  prompt?: string;
  imageUrl?: string;
  referenceModelUrl?: string;
  options: AIGenerationOptions;
}

export interface AIGenerationOptions {
  resolution: number;
  polyCount: number;
  generateTexture: boolean;
  generateMaterial: boolean;
  generateLOD: boolean;
  uvUnwrap: boolean;
  optimizeMesh: boolean;
  symmetric: boolean;
  stylePreset?: string;
}

export interface AIGenerationJob {
  id: string;
  projectId: string;
  mode: AIGenerationMode;
  model: AIModel;
  status: AIJobStatus;
  progress: number;
  prompt?: string;
  imageUrl?: string;
  error?: string;
  result?: AIGenerationResult;
  createdAt: string;
  updatedAt: string;
}

export interface AIGenerationResult {
  modelUrl: string;
  thumbnailUrl: string;
  meshUrl: string;
  textureUrl?: string;
  materialUrl?: string;
  metadata: AIGenerationMetadata;
}

export interface AIGenerationMetadata {
  vertexCount: number;
  faceCount: number;
  textureCount: number;
  lodCount: number;
  format: string;
  generationTimeMs: number;
  modelUsed: string;
}

export interface AIModelInfo {
  id: AIModel;
  name: string;
  description: string;
  icon: string;
  capabilities: AIGenerationMode[];
  supportedFormats: string[];
  maxResolution: number;
}

export const AI_MODELS: AIModelInfo[] = [
  {
    id: 'trellis',
    name: 'TRELLIS',
    description: 'Structured Latent 3D — high-quality textured meshes',
    icon: '🧊',
    capabilities: ['text-to-3d', 'image-to-3d'],
    supportedFormats: ['glb', 'obj', 'stl'],
    maxResolution: 2048,
  },
  {
    id: 'hunyuan3d',
    name: 'Hunyuan3D',
    description: 'Tencent\'s open-source 3D generation with PBR materials',
    icon: '🎯',
    capabilities: ['text-to-3d', 'image-to-3d'],
    supportedFormats: ['glb', 'obj'],
    maxResolution: 2048,
  },
  {
    id: 'stable-fast-3d',
    name: 'Stable Fast 3D',
    description: 'Stability AI — fast single-image-to-3D',
    icon: '⚡',
    capabilities: ['image-to-3d'],
    supportedFormats: ['glb', 'obj', 'usdz'],
    maxResolution: 1024,
  },
  {
    id: 'triposr',
    name: 'TripoSR',
    description: 'Fast image-to-3D from Stability AI / Tripo',
    icon: '🚀',
    capabilities: ['image-to-3d'],
    supportedFormats: ['glb', 'obj'],
    maxResolution: 1024,
  },
  {
    id: 'instantmesh',
    name: 'InstantMesh',
    description: 'Efficient image-to-3D with multi-view diffusion',
    icon: '🔄',
    capabilities: ['image-to-3d'],
    supportedFormats: ['glb', 'obj', 'stl'],
    maxResolution: 1024,
  },
];

export interface ColabStatus {
  connected: boolean;
  modelLoaded: boolean;
  gpu: string;
  memoryUsage: number;
  uptime: number;
}

export const DEFAULT_GENERATION_OPTIONS: AIGenerationOptions = {
  resolution: 1024,
  polyCount: 50000,
  generateTexture: true,
  generateMaterial: true,
  generateLOD: true,
  uvUnwrap: true,
  optimizeMesh: true,
  symmetric: false,
};
