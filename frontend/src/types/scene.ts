export interface SceneNode {
  id: string;
  name: string;
  children: SceneNode[];
  visible: boolean;
  selected: boolean;
}

export interface GizmoState {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'world' | 'local';
  snapping: boolean;
  snapSize: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  orthographic: boolean;
}

export type ViewMode = 'shaded' | 'wireframe' | 'albedo' | 'normals' | 'roughness' | 'metallic' | 'lightmap' | 'depth';

export const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'shaded', label: 'Shaded' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'albedo', label: 'Albedo' },
  { id: 'normals', label: 'Normals' },
  { id: 'roughness', label: 'Roughness' },
  { id: 'metallic', label: 'Metallic' },
  { id: 'lightmap', label: 'Lightmap' },
  { id: 'depth', label: 'Depth' },
];
