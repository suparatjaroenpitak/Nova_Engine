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
  type: 'scene' | 'script' | 'shader' | 'material' | 'animation' | 'timeline' | 'terrain' | 'behaviour' | 'visualscript';
  data?: any;
  modified?: boolean;
}

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warning' | 'error' | 'info';
  message: string;
  stack?: string;
  timestamp: Date;
}

export type PanelId =
  | 'hierarchy' | 'inspector' | 'scene' | 'game'
  | 'assets' | 'console' | 'profiler' | 'animation'
  | 'timeline' | 'ai' | 'aiGeneration' | 'lighting' | 'material'
  | 'shader' | 'terrain' | 'script' | 'navigation'
  | 'physics' | 'build' | 'versionControl'
  | 'terminal' | 'packageManager' | 'animationWindow'
  | 'shaderGraph' | 'materialEditor' | 'lightingWindow'
  | 'navigationWindow' | 'physicsDebugger' | 'searchEverywhere'
  | 'assetStore' | 'gameView';

export interface PanelState {
  id: PanelId;
  visible: boolean;
  order: number;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
  floating?: boolean;
  dockZone?: DockZone;
  tabGroup?: string;
}

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DockZone = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'tab';

export interface LayoutConfig {
  id: string;
  name: string;
  panels: Record<PanelId, PanelState>;
  zones: DockZoneConfig[];
}

export interface DockZoneConfig {
  id: string;
  zone: DockZone;
  panelIds: PanelId[];
  activeTab?: PanelId;
  size?: number;
  splitDirection?: 'horizontal' | 'vertical';
  children?: DockZoneConfig[];
}

export interface ThemeConfig {
  mode: 'dark' | 'light';
  accent: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  border: string;
  hover: string;
  active: string;
}

export interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: string;
  action: () => void;
}

export interface Bookmark {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  sceneId: string;
}

export interface LayerInfo {
  id: number;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface SceneSettings {
  skybox?: string;
  fogColor?: string;
  fogMode?: 'linear' | 'exponential';
  fogDensity?: number;
  ambientColor?: string;
  ambientIntensity?: number;
  reflectionSource?: string;
}

export interface AnimationClip {
  id: string;
  name: string;
  length: number;
  loop: boolean;
  curves: AnimationCurve[];
  events: AnimationEvent[];
}

export interface AnimationCurve {
  path: string;
  property: string;
  keys: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: number;
  inTangent?: number;
  outTangent?: number;
}

export interface AnimationEvent {
  time: number;
  functionName: string;
  parameters?: string;
}

export interface AnimationState {
  name: string;
  clipId: string;
  speed: number;
  loop: boolean;
  transitions: AnimationTransition[];
}

export interface AnimationTransition {
  from: string;
  to: string;
  duration: number;
  conditions: AnimationCondition[];
}

export interface AnimationCondition {
  parameter: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: number | boolean;
}

export interface NavMeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  areas: Uint8Array;
}

export interface Waypoint {
  position: [number, number, number];
  waitTime: number;
}

export interface ShaderNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  inputs: ShaderNodePort[];
  outputs: ShaderNodePort[];
  properties: Record<string, any>;
}

export interface ShaderNodePort {
  id: string;
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'texture2d' | 'sampler' | 'bool' | 'int';
}

export interface ShaderEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

export interface MaterialProperty {
  name: string;
  type: 'float' | 'int' | 'color' | 'texture' | 'vector2' | 'vector3' | 'vector4' | 'range';
  value: any;
  range?: [number, number];
  defaultValue?: any;
}

export interface BuildSettings {
  target: 'web' | 'windows' | 'linux' | 'macos' | 'android' | 'ios';
  compression: 'none' | 'gzip' | 'brotli';
  il2cpp: boolean;
  developmentBuild: boolean;
  autoconnectProfiler: boolean;
  scriptOnly: boolean;
  outputPath: string;
  scenes: string[];
}

export interface ProfilerSnapshot {
  frame: number;
  fps: number;
  cpu: number;
  gpu: number;
  ram: number;
  drawCalls: number;
  triangles: number;
  batches: number;
  shaderTime: number;
  gcAlloc: number;
}

export interface VersionControlFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'conflict';
  staged: boolean;
}

export interface PhysicsMaterial {
  friction: number;
  bounciness: number;
  frictionCombine: 'average' | 'minimum' | 'maximum' | 'multiply';
  bounceCombine: 'average' | 'minimum' | 'maximum' | 'multiply';
}

export interface TerrainLayer {
  name: string;
  texture: string;
  tileSize: [number, number];
  metallic: number;
  smoothness: number;
}

export interface TerrainSettings {
  width: number;
  length: number;
  height: number;
  resolution: number;
  layers: TerrainLayer[];
}

export interface LODGroup {
  levels: LODLevel[];
}

export interface LODLevel {
  screenPercent: number;
  renderers: string[];
}

export interface EditorHistoryEntry {
  type: 'gameObjectAdded' | 'gameObjectRemoved' | 'gameObjectModified' | 'componentAdded' | 'componentRemoved' | 'componentModified';
  timestamp: number;
  data: any;
}
