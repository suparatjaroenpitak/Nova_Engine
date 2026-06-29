export type FileType = 
  | 'model-fbx' | 'model-obj' | 'model-gltf' | 'model-glb' | 'model-usd' | 'model-usdz' | 'model-stl' | 'model-dae' | 'model-ply' | 'model-abc'
  | 'texture-png' | 'texture-jpg' | 'texture-tga' | 'texture-tiff' | 'texture-bmp' | 'texture-exr' | 'texture-hdr' | 'texture-webp'
  | 'material-mat' | 'material-sbsar' | 'material-pbr'
  | 'audio-mp3' | 'audio-wav' | 'audio-ogg' | 'audio-flac'
  | 'video-mp4' | 'video-webm' | 'video-mov'
  | 'script-cs' | 'script-json' | 'script-xml' | 'script-yaml'
  | 'font-ttf' | 'font-otf'
  | 'anim-fbx' | 'anim-gltf'
  | 'scene-json' | 'scene-yaml'
  | 'package-zip' | 'package-tar' | 'package-gz' | 'package-nova';

export type FileCategory = 'model' | 'texture' | 'material' | 'audio' | 'video' | 'script' | 'font' | 'animation' | 'scene' | 'package' | 'unknown';

export interface DropZoneConfig {
  allowedCategories?: FileCategory[];
  allowedTypes?: FileType[];
  maxFiles?: number;
  maxSizeBytes?: number;
  multiple?: boolean;
  foldersAllowed?: boolean;
}

export interface DropFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: FileType;
  category: FileCategory;
  file: File;
  relativePath: string;
  isDirectory: boolean;
  lastModified: number;
}

export interface ImportPreset {
  id: string;
  name: string;
  settings: ImportSettings;
}

export interface ImportSettings {
  scale: number;
  rotation: [number, number, number];
  unitConversion: 'auto' | 'meter' | 'centimeter' | 'inch' | 'foot';
  meshCompression: 'none' | 'low' | 'medium' | 'high';
  textureCompression: 'none' | 'low' | 'medium' | 'high';
  generateCollider: boolean;
  generateLOD: boolean;
  lodCount: number;
  generateLightmapUV: boolean;
  importAnimation: boolean;
  importMaterial: boolean;
  importTexture: boolean;
  importAudio: boolean;
  importSkeleton: boolean;
  importBlendShape: boolean;
  optimizeMesh: boolean;
  generatePreview: boolean;
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  scale: 1,
  rotation: [0, 0, 0],
  unitConversion: 'auto',
  meshCompression: 'medium',
  textureCompression: 'medium',
  generateCollider: false,
  generateLOD: true,
  lodCount: 3,
  generateLightmapUV: false,
  importAnimation: true,
  importMaterial: true,
  importTexture: true,
  importAudio: true,
  importSkeleton: true,
  importBlendShape: true,
  optimizeMesh: true,
  generatePreview: true,
};

export interface ImportJob {
  id: string;
  projectId: string;
  files: DropFile[];
  status: ImportJobStatus;
  progress: number;
  settings: ImportSettings;
  results: ImportResult[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type ImportJobStatus = 'queued' | 'validating' | 'importing' | 'optimizing' | 'generating' | 'completed' | 'failed' | 'cancelled';

export interface ImportResult {
  fileId: string;
  fileName: string;
  status: 'success' | 'skipped' | 'failed';
  assetId?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  metadata?: ImportMetadata;
}

export interface ImportMetadata {
  type: FileType;
  sizeBytes: number;
  dimensions?: [number, number];
  duration?: number;
  vertexCount?: number;
  faceCount?: number;
  textureCount?: number;
  animationCount?: number;
  materialCount?: number;
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export interface UploadChunk {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Blob;
  fileName: string;
  fileSize: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  loaded: number;
  total: number;
  speed: number;
  eta: number;
  status: 'uploading' | 'paused' | 'completed' | 'failed';
  progress: number;
}

export interface DragPayload {
  type: 'asset' | 'gameobject' | 'component' | 'material' | 'texture' | 'shader' | 'script' | 'prefab' | 'animation' | 'audio';
  id: string;
  source: string;
  data?: any;
}

export const FILE_TYPE_EXTENSIONS: Record<string, FileType> = {
  '.fbx': 'model-fbx', '.obj': 'model-obj', '.gltf': 'model-gltf', '.glb': 'model-glb',
  '.usd': 'model-usd', '.usdz': 'model-usdz', '.stl': 'model-stl', '.dae': 'model-dae',
  '.ply': 'model-ply', '.abc': 'model-abc',
  '.png': 'texture-png', '.jpg': 'texture-jpg', '.jpeg': 'texture-jpg',
  '.tga': 'texture-tga', '.tif': 'texture-tiff', '.tiff': 'texture-tiff',
  '.bmp': 'texture-bmp', '.exr': 'texture-exr', '.hdr': 'texture-hdr', '.webp': 'texture-webp',
  '.mat': 'material-mat', '.sbsar': 'material-sbsar',
  '.mp3': 'audio-mp3', '.wav': 'audio-wav', '.ogg': 'audio-ogg', '.flac': 'audio-flac',
  '.mp4': 'video-mp4', '.webm': 'video-webm', '.mov': 'video-mov',
  '.cs': 'script-cs', '.json': 'script-json', '.xml': 'script-xml', '.yaml': 'script-yaml', '.yml': 'script-yaml',
  '.ttf': 'font-ttf', '.otf': 'font-otf',
  '.zip': 'package-zip', '.tar': 'package-tar', '.gz': 'package-gz', '.nova': 'package-nova',
};

export const CATEGORY_BY_EXTENSION: Record<string, FileCategory> = {
  '.fbx': 'model', '.obj': 'model', '.gltf': 'model', '.glb': 'model',
  '.usd': 'model', '.usdz': 'model', '.stl': 'model', '.dae': 'model', '.ply': 'model', '.abc': 'model',
  '.png': 'texture', '.jpg': 'texture', '.jpeg': 'texture', '.tga': 'texture',
  '.tif': 'texture', '.tiff': 'texture', '.bmp': 'texture', '.exr': 'texture', '.hdr': 'texture', '.webp': 'texture',
  '.mat': 'material', '.sbsar': 'material',
  '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio', '.flac': 'audio',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
  '.cs': 'script', '.json': 'script', '.xml': 'script', '.yaml': 'script', '.yml': 'script',
  '.ttf': 'font', '.otf': 'font',
  '.zip': 'package', '.tar': 'package', '.gz': 'package', '.nova': 'package',
};

export const FILE_CATEGORY_ICONS: Record<FileCategory, string> = {
  model: '🧊', texture: '🖼', material: '🎨', audio: '🔊', video: '🎬',
  script: '📄', font: '🔤', animation: '🏃', scene: '🎬', package: '📦', unknown: '❓',
};

export const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.json': 'application/json', '.zip': 'application/zip',
  '.cs': 'text/plain',
};
