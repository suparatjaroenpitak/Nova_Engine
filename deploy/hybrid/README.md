# Nova Engine — Hybrid Free-Tier Deployment (Option 2)

Deploy the full Nova Engine stack using **5 free services** — no credit card needed for most.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Vercel     │     │  Render      │     │  Neon        │
│  React App  │────▶│  .NET API    │────▶│  PostgreSQL  │
│  (always on)│     │  (sleeps)    │     │  (always on) │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  Backblaze   │     │  Upstash     │
                    │  B2 (Assets) │     │  Redis Cache │
                    │  (10GB free) │     │  (10MB free) │
                    └──────────────┘     └──────────────┘
```

---

## Prerequisites

- GitHub account
- Git repo with the Nova Engine code pushed:
  ```bash
  git add .
  git commit -m "Nova Engine"
  git remote add origin https://github.com/YOUR_USER/nova-engine.git
  git push -u origin main
  ```

---

## Step 1: Neon — PostgreSQL Database (5 min)

**Free tier:** 0.5GB storage, always-on, auto-suspend after 5 min of inactivity.

1. Go to https://neon.tech → Sign up (GitHub login)
2. Create a **Project**:
   - Name: `nova-engine`
   - Region: closest to you (e.g., US East)
3. Copy the **connection string** from the dashboard:
   ```
   postgresql://nova_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/nova-engine?sslmode=require
   ```
4. ⚠️ **Fix the database name**: the URL uses `nova-engine` but our app expects `nova_engine`.
   Either:
   - In Neon dashboard → Databases → rename `nova-engine` → `nova_engine`
   - **OR** in the connection string, change `/nova-engine` → `/nova_engine`:
   ```
   postgresql://nova_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/nova_engine?sslmode=require
   ```
5. Save this string — you'll need it for Render.

---

## Step 2: Backblaze B2 — Asset Storage (5 min)

**Free tier:** 10GB storage, 1GB download/day.

1. https://www.backblaze.com/sign-up/cloud-storage
2. Create a **Bucket**:
   - Name: `nova-assets`
   - Type: **Private**
3. **Generate App Key**:
   - App Keys → Generate New Master Application Key
   - Save `Key ID` and `Application Key`
4. Find your **S3 Endpoint**:
   - Bucket Settings → "S3 Endpoint"
   - Default: `https://s3.us-west-004.backblazeb2.com`

---

## Step 3: Upstash — Redis Cache (2 min, optional)

**Free tier:** 10MB, 5,000 commands/day. Skip this if you don't need caching.

1. https://console.upstash.com → Create Redis database
2. Copy the `UPSTASH_REDIS_REST_URL`
3. You'll set it as `ConnectionStrings__Redis`

---

## Step 4: Render — .NET API (10 min)

**Free tier:** 512MB RAM, 1 vCPU, sleeps after 15 min of inactivity. Wakes on request.

### 4a. Create the Web Service

1. https://dashboard.render.com → **New +** → **Web Service**
2. **Connect repository**: select `YOUR_USER/nova-engine`
3. **Configure**:
   - Name: `nova-api`
   - Region: `US East` (or closest to your Neon DB region)
   - Branch: `main`
   - Runtime: **Docker**
   - Dockerfile Path: `deploy/hybrid/render/Dockerfile.render`
   - Plan: **Free**
4. **Environment Variables** (add these):

```
Key: ASPNETCORE_ENVIRONMENT                 Value: Production
Key: ASPNETCORE_URLS                        Value: http://+:5080
Key: ConnectionStrings__Postgres            Value: postgresql://nova_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/nova_engine?sslmode=require
Key: Jwt__SigningKey                        Value: (generate a 64-char random hex string)
Key: Jwt__Issuer                            Value: NovaEngine
Key: Jwt__Audience                          Value: NovaEditor
Key: MinIO__Endpoint                        Value: s3.us-west-004.backblazeb2.com
Key: MinIO__AccessKey                       Value: (your B2 Key ID)
Key: MinIO__SecretKey                       Value: (your B2 Application Key)
Key: MinIO__Bucket                          Value: nova-assets
Key: MinIO__Secure                          Value: true
Key: Cors__AllowedOrigins__0                Value: https://nova-web.vercel.app
Key: Seed__CreateAdmin                      Value: true
Key: Seed__AdminEmail                       Value: admin@nova.local
Key: Seed__AdminPassword                    Value: (generate a strong password)
```

5. **Generate JWT key** (run locally or use any online generator):
   ```bash
   openssl rand -hex 32
   ```
6. Click **Create Web Service**

### 4b. Wait for first deploy (~3-5 min)

Watch the logs in Render dashboard. First deploy builds the Docker image.

After success, your API is live at:
```
https://nova-api.onrender.com
```

Test it:
```bash
# Should return 401 (Unauthorized) — means API is working
curl -w "\n%{http_code}" https://nova-api.onrender.com/api/v1/auth/me

# Login as admin
curl -X POST https://nova-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nova.local","password":"YOUR_ADMIN_PASSWORD"}'
```

---

## Step 5: Vercel — React Frontend (10 min)

**Free tier:** Always-on, global CDN, 100GB bandwidth.

### 5a. Deploy

1. https://vercel.com → Import Git Repository → select `YOUR_USER/nova-engine`
2. **Configure project**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
3. **Environment Variables**:
   ```
   VITE_API_URL: https://nova-api.onrender.com
   ```
4. Click **Deploy**

### 5b. Configure API proxy

Vercel uses `deploy/hybrid/vercel/vercel.json` to proxy API calls to Render.
The file is already in the repo — Vercel auto-detects it.

### 5c. After deployment

Your frontend is live at:
```
https://nova-engine.vercel.app
```

---

## Step 6: Verify Everything Works

```bash
# 1. Open the frontend
open https://nova-engine.vercel.app

# 2. Login with admin credentials
Email:    admin@nova.local
Password: (the Seed__AdminPassword you set)

# 3. Create a new project
# 4. Open the editor
# 5. Add GameObjects, modify transforms
# 6. Import an asset (upload a .png or .fbx — stored in Backblaze B2)
```

---

## Important Notes

| Behavior | Details |
|----------|---------|
| **API cold start** | Render free tier sleeps after 15 min. First request after idle takes ~30s. |
| **Neon auto-suspend** | Neon also sleeps after 5 min. Wakes on first query (~3s). |
| **No WebSockets** | Render free tier doesn't support WebSocket connections. SignalR falls back to long polling. |
| **No Redis on Render** | Render doesn't run Redis. Use Upstash for cache or leave `ConnectionStrings__Redis` empty. |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API returns 502 | Check Render logs — likely a startup crash. Verify env vars. |
| "Cannot connect to database" | Check Neon connection string in Render. Try `?sslmode=require` at the end. |
| CORS errors in browser | Verify `Cors__AllowedOrigins__0` matches your Vercel URL exactly. |
| Assets upload fails | Check Backblaze B2 key permissions. Ensure bucket name matches `MinIO__Bucket`. |
| SignalR not working | Render free tier uses HTTP long polling (no WebSocket). This is normal. |

---

## Updating

```bash
# 1. Make changes
git add .
git commit -m "Update"

# 2. Push to main — both Render and Vercel auto-deploy
git push
```

---

## Cost Breakdown

| Service | Cost | What you get |
|---------|------|-------------|
| Neon PostgreSQL | $0/mo | 0.5GB DB, always-on |
| Render API | $0/mo | 512MB RAM, sleeps idle |
| Vercel Frontend | $0/mo | Global CDN, always-on |
| Backblaze B2 | $0/mo | 10GB storage |
| Upstash Redis | $0/mo | 10MB cache |
| **Total** | **$0/mo** | |
