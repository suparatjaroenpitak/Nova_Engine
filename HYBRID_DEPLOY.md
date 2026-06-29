# Nova Engine — Hybrid Free-Tier Deployment Guide

## Quick Start (30 min total)

### Step 1: Push code to GitHub
```bash
git add .
git commit -m "Nova Engine full stack"
git remote add origin https://github.com/YOUR_USER/nova-engine.git
git push -u origin main
```

### Step 2: Create 5 free services

| # | Service | Sign up at | What to create |
|---|---------|-----------|----------------|
| 1 | **Neon** | https://neon.tech | PostgreSQL database → copy connection string |
| 2 | **Backblaze** | https://backblaze.com | Bucket `nova-assets` + App Key |
| 3 | **Render** | https://render.com | Web Service from your GitHub repo (Docker) |
| 4 | **Vercel** | https://vercel.com | Import your GitHub repo (frontend/) |
| 5 | **Upstash** (opt) | https://upstash.com | Redis DB (leave ConnectionStrings__Redis empty if skipped) |

### Step 3: Render API Env Variables

Set these in Render dashboard (Web Service → Environment):

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:5080
ConnectionStrings__Postgres=postgresql://user:pass@ep-xxx.neon.tech/nova_engine?sslmode=require
Jwt__SigningKey=<openssl rand -hex 32>
Jwt__Issuer=NovaEngine
Jwt__Audience=NovaEditor
MinIO__Endpoint=s3.us-west-004.backblazeb2.com
MinIO__AccessKey=<B2 Key ID>
MinIO__SecretKey=<B2 App Key>
MinIO__Bucket=nova-assets
MinIO__Secure=true
Cors__AllowedOrigins__0=https://nova-engine.vercel.app
Seed__CreateAdmin=true
Seed__AdminEmail=admin@nova.local
Seed__AdminPassword=<choose-a-password>
```

### Step 4: Vercel Frontend

Import repo, set:
- Root: `frontend`
- Framework: Vite
- Env: `VITE_API_URL=https://nova-api.onrender.com`

### ✅ Done

| Service | URL |
|---------|-----|
| Editor | `https://nova-engine.vercel.app` |
| API | `https://nova-api.onrender.com` |
| DB | Managed by Neon |
| Assets | Stored in Backblaze B2 |

### ⚠️ Free tier limits

- **API sleeps** after 15 min idle → first load takes ~30s
- **No WebSocket** on Render free → SignalR uses long polling
- **Neon sleeps** after 5 min idle → first query takes ~3s
