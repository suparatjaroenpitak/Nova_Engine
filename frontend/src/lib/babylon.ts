/**
 * Central Babylon.js side-effect imports.
 *
 * Babylon.js v7+ ships a tree-shakeable ES6 build. When bundlers (Vite/Rollup)
 * tree-shake the production build, they drop modules that appear to have no
 * referenced exports — but several Babylon classes self-register a "Scene
 * Component" via side effect. Without those imports the class throws at runtime:
 *
 *   "Uncaught <Name>SceneComponent needs to be imported before as it contains
 *    a side-effect required by your code."
 *
 * This file imports every scene component / side-effect module the editor uses,
 * so importing it once from the app entry point keeps them alive in production.
 *
 * Import this BEFORE rendering anything that uses Babylon.js.
 */

// Core engine + scene component registration
import '@babylonjs/core/Engines/engine';
import '@babylonjs/core/scene';

// Cameras — ArcRotateCamera + FreeCamera register input managers
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/freeCamera';

// Layers (HighlightLayer extends EffectLayer)
import '@babylonjs/core/Layers/effectLayer';
import '@babylonjs/core/Layers/effectLayerSceneComponent';
import '@babylonjs/core/Layers/highlightLayer';

// Shadows
import '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';

// Lights
import '@babylonjs/core/Lights/hemisphericLight';
import '@babylonjs/core/Lights/directionalLight';

// Materials
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Materials/shaderMaterial';
import '@babylonjs/core/Materials/effect';
import '@babylonjs/core/Materials/Textures/texture';

// Meshes
import '@babylonjs/core/Meshes/mesh';
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Meshes/Builders/boxBuilder';
import '@babylonjs/core/Meshes/Builders/sphereBuilder';
import '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import '@babylonjs/core/Meshes/Builders/torusBuilder';
import '@babylonjs/core/Meshes/Builders/groundBuilder';
import '@babylonjs/core/Meshes/Builders/planeBuilder';

// Gizmos
import '@babylonjs/core/Gizmos/gizmoManager';
import '@babylonjs/core/Gizmos/positionGizmo';
import '@babylonjs/core/Gizmos/rotationGizmo';
import '@babylonjs/core/Gizmos/scaleGizmo';

// Loaders
import '@babylonjs/loaders/glTF';

// Loading screen
import '@babylonjs/core/Loading/loadingScreen';

export {};
