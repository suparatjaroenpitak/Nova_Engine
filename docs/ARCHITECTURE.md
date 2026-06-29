# Nova Engine — Architecture

## High level

```
                       ┌──────────────────────────────────────────┐
   Browser (editor)    │  React 20 + Vite + Three.js (R3F)       │
                       │  Zustand stores · Monaco editor         │
                       └───────────────┬──────────────┬──────────┘
                          REST/JSON     │   SignalR    │  WebSocket
                                        ▼              ▼
                       ┌──────────────────────────────────────────┐
   Backend             │  ASP.NET Core 10 Web API                  │
                       │  ─ Controllers (Projects, Scenes, …)     │
                       │  ─ SignalR hubs (realtime scene sync)     │
                       │  ─ Application layer (use-cases, DTOs)    │
                       │  ─ Domain layer (entities, value objects) │
                       │  ─ Infrastructure (EF Core, Redis, MinIO) │
                       └──┬──────────┬──────────┬───────────┬──────┘
                          │          │          │           │
                ┌─────────▼──┐ ┌─────▼───┐ ┌────▼────┐ ┌─────▼─────┐
                │ PostgreSQL │ │  Redis  │ │  MinIO  │ │ Hangfire  │
                │ (catalog)  │ │(cache/  │ │ (asset  │ │ (jobs:    │
                │            │ │ pubsub) │ │ storage)│ │  import,  │
                │            │ │         │ │         │ │  bake, …) │
                └────────────┘ └─────────┘ └─────────┘ └───────────┘
                                                                     │
                                              ┌──────────────────────▼───────┐
                                              │  GPU service (Phase 10)      │
                                              │  FastAPI + PyTorch / Colab   │
                                              │  IGpuComputeService consumers│
                                              └──────────────────────────────┘
```

## Layered backend (Clean Architecture)

- **Nova.Domain** — pure entities, value objects, enums. No dependencies on EF or ASP.NET.
- **Nova.Application** — use-cases (handlers), DTOs, and **abstractions** (`IProjectRepository`,
  `IAssetRepository`, `IGpuComputeService`, `IAiAgent`, `IExporter`). Depends only on Domain.
- **Nova.Infrastructure** — EF Core `AppDbContext` & migrations, repository implementations,
  Redis cache, MinIO object store, Identity/JWT, Hangfire, Roslyn scripting service, and the
  *local stub* implementations of GPU/AI/export providers. Depends on Application.
- **Nova.Api** — composition root: controllers, SignalR hubs, DI wiring, middleware, Swagger.
  Depends on Infrastructure + Application.

The **dependency rule** points inward: Domain knows nothing; Application defines interfaces;
Infrastructure and Api implement them.

## Realtime collaboration

The editor pushes every scene mutation through the **SceneHub** SignalR group (one group per
scene). Operations are CRDT-ish command deltas (create/update/delete/move/reparent GameObjects,
set component properties). Every connected client applies the same deltas, giving Google-Docs-style
live co-editing. The backend also persists the canonical scene state to PostgreSQL on a debounced
flush.

## Scripting

User scripts are MonoBehaviour-style C# (Start/Update/Awake/…). On save they are sent to the
backend `ScriptingController`, compiled by **Microsoft.CodeAnalysis (Roslyn)** to an in-memory
assembly, and diagnostics are returned. Monaco on the client ships completions via a lightweight
language-server model; a future OmniSharp bridge can deepen IntelliSense.

## GPU / AI as swappable providers

Everything GPU- and AI-related is hidden behind interfaces:

```
IGpuComputeService.SubmitAsync(GpuJobRequest)  → GpuJobHandle
IAiAgent.ExecuteAsync(AgentRequest)            → AgentResponse
IExporter.ExportAsync(ExportRequest)           → ExportArtifact
```

`LocalStub` implementations run today (no Colab). `ColabGpuComputeService` / `OpenAiAgent` etc.
are documented providers you plug in later by changing configuration. See [ROADMAP.md](ROADMAP.md).

## Security

JWT bearer access tokens (short-lived) + refresh tokens (rotated, stored hashed in Redis).
Optional Google/GitHub OAuth. Rate limiting (fixed-window via ASP.NET Core middleware), audit
log on mutating endpoints, role/permission checks at the controller/handler boundary.
