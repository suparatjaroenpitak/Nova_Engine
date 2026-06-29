# Nova Engine — Roadmap

Status legend: ✅ delivered in this slice · 🔌 interface + extension doc · 🔜 future

## Phase 1 — Architecture ✅
Monorepo, Docker Compose, CI, K8s, docs, layered solution skeleton.

## Phase 2 — Database ✅
EF Core entities + migrations for Users, Projects, Scenes, GameObjects, Components, Assets,
Scripts, Packages. Repository pattern. `database/init` bootstrap scripts.

## Phase 3 — Backend API ✅
- ASP.NET Core 10, JWT auth, Google/GitHub OAuth, refresh tokens.
- REST controllers (Projects, Scenes, GameObjects, Components, Assets, Scripts, Auth).
- SignalR `SceneHub` (realtime scene sync / collaboration).
- Swagger/OpenAPI.
- MinIO asset storage, Redis cache, Hangfire background jobs.
- Roslyn scripting compile service with diagnostics.
- xUnit unit + integration tests.

## Phase 4 — Frontend ✅
React 20 + TypeScript + Vite + Tailwind + Zustand. Unity-like docking shell (resizable panels,
tabs, context menu, command palette, keyboard shortcuts). Auth + project management pages.

## Phase 5 — Renderer ✅
Three.js via React Three Fiber. Scene view with transform gizmo (translate/rotate/scale),
scene gizmo, grid, camera controls, GameObject → Three object bridge.

## Phase 6 — Editor ✅
Hierarchy, Inspector, Console, Asset browser, Scene editor, Monaco script editor with live
Roslyn diagnostics, drag & drop, undo/redo, copy/paste/duplicate.

## Phase 7 — Animation 🔌
Interfaces defined: `IAnimationClip`, `IAnimatorState`, `IBlendTree`, `ITimelineTrack`.
Runtime: keyframe curves, state machine, transitions. Editor: curve editor, timeline UI.
_Extension point: implement AnimationModule in Nova.Engine.Animation._

## Phase 8 — Physics 🔌
Interfaces: `IPhysicsWorld`, `IRigidBody`, `ICollider`, `IJoint`. Three.js Ammo/Rapier bridge.
RigidBody, Collider, CharacterController, joints, raycast API, physics materials.

## Phase 9 — AI Agents 🔌
`IAiAgent` plus a registry. Agents: generate scene/objects/scripts/animation/ui/shader/terrain/
npc/quest/dialogue/materials/textures/sounds. Local LLM stub today; OpenAI/Anthropic provider later.

## Phase 10 — GPU Computing 🔌
`IGpuComputeService`. Job types: texture gen, AI material, 3D model gen, mesh optimization,
upscaling, light/shadow baking, navmesh/physics baking, voxel/terrain/world gen, NPC/voice gen.
FastAPI + PyTorch service in `gpu/`. Connect to Colab T4/L4/A100/V100/H100 by swapping provider.

## Phase 11 — Export 🔌
`IExporter` per target (Web, Windows, Linux, Android, iOS, macOS). Web export is real (build
the editor shell into a static bundle that runs the scene runtime). Native targets require the
respective SDKs and are documented extension points.

## Phase 12 — Optimization 🔌
ECS for runtime, Job System, object pooling, GPU instancing, LOD, occlusion culling, async/lazy
asset loading, streaming. Hooks already present in the renderer (instanced meshes, frustum culling).
