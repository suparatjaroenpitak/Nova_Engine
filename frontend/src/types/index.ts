export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: string;
  renderPipeline: string;
  is3D: boolean;
  createdAtUtc: string;
  sceneCount: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  is3D?: boolean;
  renderPipeline?: string;
}

export interface SceneDto {
  id: string;
  projectId: string;
  name: string;
  isMain: boolean;
  settingsJson: string;
  gameObjectCount: number;
}

export interface TransformDto {
  px: number; py: number; pz: number;
  rx: number; ry: number; rz: number; rw: number;
  sx: number; sy: number; sz: number;
}

export interface ComponentDto {
  id: string;
  gameObjectId: string;
  kind: string;
  enabled: boolean;
  propertiesJson: string;
  order: number;
}

export interface GameObjectDto {
  id: string;
  sceneId: string;
  parentId: string | null;
  name: string;
  isActive: boolean;
  layer: number;
  tag: string | null;
  siblingIndex: number;
  transform: TransformDto;
  components: ComponentDto[];
  children: GameObjectDto[];
}

export interface AssetDto {
  id: string;
  projectId: string;
  name: string;
  path: string;
  kind: string;
  contentType: string;
  sizeBytes: number;
  previewUrl: string | null;
  createdAtUtc: string;
}

export interface ScriptDto {
  id: string;
  projectId: string;
  name: string;
  className: string;
  currentSource: string;
  currentVersion: number;
  compiles: boolean;
  errorCount: number;
  warningCount: number;
  updatedAtUtc: string;
}

export interface CompileResultDto {
  success: boolean;
  diagnostics: CompileDiagnosticDto[];
}

export interface CompileDiagnosticDto {
  severity: string;
  code: string;
  message: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface GpuJobDto {
  id: string;
  type: string;
  status: string;
  provider: string;
  gpu: string;
  progressPct: number;
  error: string | null;
  resultJson: string | null;
  createdAtUtc: string;
}

export interface PackageDto {
  id: string;
  name: string;
  version: string;
  source: string;
  isEnabled: boolean;
}

export interface EditorTab {
  id: string;
  label: string;
  type: 'scene' | 'script' | 'shader' | 'material' | 'animation' | 'timeline';
  data?: any;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warning' | 'error' | 'info';
  message: string;
  stack?: string;
  timestamp: Date;
}

export type PanelId = 'hierarchy' | 'inspector' | 'scene' | 'game' | 'assets' | 'console' | 'profiler' | 'animation' | 'timeline' | 'ai' | 'lighting';

export interface PanelState {
  id: PanelId;
  visible: boolean;
  order: number;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
}

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
