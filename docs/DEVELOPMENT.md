# Nova Engine — Development Guide

## Prerequisites

- .NET 10 SDK
- Node.js 20+ (tested on 22) and npm
- Docker (+ Docker Compose) for the full stack
- (Optional) PostgreSQL/Redis/MinIO clients if running outside Docker

## One-command stack (recommended)

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Editor   | http://localhost:5173        |
| API      | http://localhost:5080        |
| Swagger  | http://localhost:5080/swagger|
| MinIO UI | http://localhost:9001 (minio / minio12345) |

## Local dev (without Docker for the app code)

Spin up only the data services, then run API and web on your host:

```bash
docker compose up -d postgres redis minio

# Backend
cd backend
dotnet tool restore
dotnet ef database update --project src/Nova.Infrastructure --startup-project src/Nova.Api
dotnet run --project src/Nova.Api    # http://localhost:5080

# Frontend (other terminal)
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

Create a `.env` for the API (or `appsettings.Development.json`) pointing the connection strings
at `localhost` instead of the container hostnames.

## Running tests

```bash
# Backend
cd backend
dotnet test

# Frontend
cd frontend
npm test        # vitest
npm run lint
```

## EF Core migrations

```bash
cd backend
# Add a migration
dotnet ef migrations add <Name> \
  --project src/Nova.Infrastructure --startup-project src/Nova.Api \
  --output-dir Migrations

# Apply
dotnet ef database update \
  --project src/Nova.Infrastructure --startup-project src/Nova.Api
```

## Default credentials (dev only)

- Postgres: `nova / nova_postgres_dev` (db `nova_engine`)
- MinIO: `minio / minio12345` (bucket auto-created: `nova-assets`)
- The first time you start the API it will **auto-seed** an admin user:

  ```
  email: admin@nova.local
  password: Admin#123
  ```

  (Disable with `Seed:CreateAdmin=false`.)
