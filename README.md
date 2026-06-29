# Nova Engine

A browser-based, Unity-like game engine. Everything runs in the browser; the heavy lifting
(auth, persistence, asset storage, realtime collaboration, C# compilation, GPU/AI jobs) is
handled by an ASP.NET Core 10 backend.

> **Status:** deep vertical slice — Phases 1–6 are real and runnable end-to-end
> (auth → create project → edit scene → save to Postgres → realtime sync via SignalR →
> render in the browser via Three.js). Phases 7–12 (animation, physics, AI, GPU, export,
> optimization) are defined as interfaces + documented extension points.

---

## Stack

| Layer        | Technology                                                                 |
|--------------|----------------------------------------------------------------------------|
| Backend      | ASP.NET Core 10, C#, SignalR, EF Core, Hangfire, gRPC                      |
| Frontend     | React 20, TypeScript, Vite, TailwindCSS, Zustand, React Flow, R3F, Monaco |
| Renderer     | Three.js via React Three Fiber                                             |
| Database     | PostgreSQL                                                                 |
| Cache/Queue  | Redis                                                                      |
| Storage      | MinIO (S3-compatible)                                                      |
| Auth         | JWT, Google, GitHub                                                        |
| Scripting    | Roslyn (server-side compile) + Monaco IntelliSense (client)                |
| GPU / AI     | FastAPI + PyTorch (abstracted behind `IGpuComputeService` / `IAiAgent`)    |

## Repository layout

```
/
├── backend/                 # .NET solution
│   ├── src/
│   │   ├── Nova.Domain/         # entities, value objects, enums
│   │   ├── Nova.Application/    # use-cases, DTOs, interfaces
│   │   ├── Nova.Infrastructure/ # EF Core, Redis, MinIO, identity, externals
│   │   └── Nova.Api/            # controllers, SignalR hubs, DI composition root
│   └── tests/                   # xUnit unit + integration tests
├── frontend/               # React + Vite editor
│   ├── src/
│   │   ├── engine/              # runtime: renderer, nodes, scene graph
│   │   ├── panels/              # Hierarchy, Inspector, Console, Assets…
│   │   ├── stores/              # Zustand stores
│   │   └── services/            # API + SignalR clients
│   └── package.json
├── gpu/                    # FastAPI service (Colab-capable) — Phase 10
├── deploy/k8s/             # Kubernetes manifests
├── docker/                 # Dockerfiles
├── docs/                   # architecture & roadmap
└── docker-compose.yml      # one-command local stack
```

## Quick start

```bash
# 1. Copy env
cp .env.example .env

# 2. Boot the whole stack (Postgres, Redis, MinIO, API, web)
docker compose up --build

# 3. Open the editor
#    http://localhost:5173
#    API/Swagger: http://localhost:5080/swagger
#    MinIO console: http://localhost:9001  (minio / minio12345)
```

For local dev without Docker, see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap & phases](docs/ROADMAP.md)
- [Development guide](docs/DEVELOPMENT.md)
- [API reference](http://localhost:5080/swagger) (when running)

## License

Proprietary — © Nova Engine.
