import { Object3D, Mesh, Material, BufferGeometry } from 'three';

export interface SceneNode {
  id: string;
  name: string;
  object: Object3D;
  children: SceneNode[];
  mesh?: Mesh;
  geometry?: BufferGeometry;
  material?: Material;
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
